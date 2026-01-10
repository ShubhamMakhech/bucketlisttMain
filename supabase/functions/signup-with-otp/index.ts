import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SignUpWithOTPRequest {
  identifier: string; // email or phone number
  otp: string;
  type: "email" | "sms";
  role?: "customer" | "vendor" | "agent";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      identifier,
      otp,
      type,
      role = "customer",
    }: SignUpWithOTPRequest = await req.json();

    if (!identifier || !otp) {
      return new Response(
        JSON.stringify({ error: "Identifier and OTP are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify OTP first - check for both verified and unverified OTPs
    // This handles the case where OTP might have been verified in a previous step
    let { data: otpData, error: fetchError } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("identifier", identifier)
      .eq("type", type)
      .eq("otp", otp)
      .eq("verified", false) // First try unverified OTPs
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // If not found as unverified, check if it was already verified (for retry scenarios)
    if (!otpData && !fetchError) {
      const { data: verifiedOtpData, error: verifiedError } = await supabase
        .from("otp_verifications")
        .select("*")
        .eq("identifier", identifier)
        .eq("type", type)
        .eq("otp", otp)
        .eq("verified", true) // Check verified OTPs too
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Only use verified OTP if it was verified very recently (within last minute)
      // This prevents reuse of old verified OTPs
      if (verifiedOtpData) {
        const verifiedAt = new Date(verifiedOtpData.verified_at);
        const now = new Date();
        const timeSinceVerification = now.getTime() - verifiedAt.getTime();

        // Allow if verified within last 2 minutes (for retry scenarios)
        if (timeSinceVerification < 2 * 60 * 1000) {
          otpData = verifiedOtpData;
          fetchError = null;
        }
      }
    }

    if (fetchError || !otpData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid or expired OTP",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if OTP is expired
    const expiresAt = new Date(otpData.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "OTP has expired. Please request a new one.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Mark OTP as verified
    await supabase
      .from("otp_verifications")
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq("id", otpData.id);

    // Format identifier for phone numbers (add country code 91)
    let formattedIdentifier = identifier;
    if (type === "sms") {
      formattedIdentifier = identifier.replace(/\D/g, "");
      if (!formattedIdentifier.startsWith("91")) {
        formattedIdentifier = "91" + formattedIdentifier;
      }
    }

    // Check if user already exists in profiles table (not auth.users)
    let existingUser = null;
    if (type === "email") {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", identifier)
        .limit(1);
      if (profiles && profiles.length > 0) {
        existingUser = profiles[0];
      }
    } else {
      // Check for both formats (with and without 91) to handle existing users
      const withoutCountryCode = formattedIdentifier.startsWith("91")
        ? formattedIdentifier.slice(2)
        : formattedIdentifier;
      const withCountryCode = formattedIdentifier;

      // Check for existing user - try exact matches
      let result = await supabase
        .from("profiles")
        .select("id, phone_number")
        .eq("phone_number", formattedIdentifier)
        .limit(1);

      if (result.data && result.data.length > 0) {
        existingUser = result.data[0];
      }

      // If not found, try without country code
      if (!existingUser && withoutCountryCode !== formattedIdentifier) {
        result = await supabase
          .from("profiles")
          .select("id, phone_number")
          .eq("phone_number", withoutCountryCode)
          .limit(1);
        if (result.data && result.data.length > 0) {
          existingUser = result.data[0];
        }
      }

      // If still not found, try with country code
      if (!existingUser && withCountryCode !== formattedIdentifier) {
        result = await supabase
          .from("profiles")
          .select("id, phone_number")
          .eq("phone_number", withCountryCode)
          .limit(1);
        if (result.data && result.data.length > 0) {
          existingUser = result.data[0];
        }
      }
    }

    if (existingUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User already registered",
          code: "user_already_exists",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create user account - first create profile, then auth user
    // For email: use email directly
    // For phone: create a temporary email
    const email =
      type === "email" ? identifier : `${formattedIdentifier}@bucketlistt.temp`;

    // Check if auth user already exists with this email
    let authData: any = null;
    let authUser: any = null;

    try {
      // Try to get user by email first
      const { data: userList, error: listError } =
        await supabase.auth.admin.listUsers();

      if (!listError && userList) {
        authUser = userList.users.find((u: any) => u.email === email);
      }
    } catch (error) {
      console.error("Error checking existing auth user:", error);
    }

    // If auth user already exists, return error
    if (authUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User already registered",
          code: "user_already_exists",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create new auth user
    // Generate a random secure password (user won't need it for OTP login)
    const randomPassword =
      Math.random().toString(36).slice(-12) +
      Math.random().toString(36).slice(-12) +
      "A1!@#";

    // Create user in Supabase Auth (no email verification needed)
    const { data: newAuthData, error: signUpError } =
      await supabase.auth.admin.createUser({
        email,
        password: randomPassword,
        email_confirm: true, // Auto-confirm - no email verification
        user_metadata: {
          [type === "email" ? "email" : "phone_number"]: formattedIdentifier,
          role: role,
          terms_accepted: true,
          // first_name and last_name are null - will be collected later
        },
      });

    if (signUpError || !newAuthData.user) {
      // If error is about email already existing, return user already exists error
      if (signUpError?.message?.includes("already been registered")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "User already registered",
            code: "user_already_exists",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      console.error("Error creating user:", signUpError);
      return new Response(
        JSON.stringify({
          success: false,
          error: signUpError?.message || "Failed to create user account",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    authData = newAuthData;
    authUser = newAuthData.user;

    // Profile is automatically created by database trigger
    // But we need to update it with the correct phone number if it was SMS signup
    if (type === "sms" && authUser) {
      await supabase
        .from("profiles")
        .update({ phone_number: formattedIdentifier })
        .eq("id", authUser.id);
    }

    // Generate a session for the new user
    const { data: sessionData, error: sessionError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: authUser.email!,
      });

    if (sessionError || !sessionData) {
      console.error("Error generating session:", sessionError);
      // User is created, but session generation failed
      // Return success anyway - user can sign in with OTP
      return new Response(
        JSON.stringify({
          success: true,
          message: "Account created successfully",
          user: {
            id: authData.user.id,
            email: authData.user.email,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Extract the token from the magic link
    const magicLink = sessionData.properties?.action_link;
    if (!magicLink) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Account created successfully",
          user: {
            id: authData.user.id,
            email: authData.user.email,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Parse the magic link to extract the token
    const url = new URL(magicLink);
    const token = url.searchParams.get("token");
    const tokenHash = url.searchParams.get("token_hash");

    // Return the token and link for the client to use
    return new Response(
      JSON.stringify({
        success: true,
        message: "Account created successfully",
        sessionLink: magicLink,
        token: token,
        tokenHash: tokenHash,
        user: {
          id: authUser.id,
          email: authUser.email,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in signup-with-otp function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
