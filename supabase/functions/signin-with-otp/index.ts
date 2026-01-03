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

interface SignInWithOTPRequest {
  identifier: string; // email or phone number
  otp: string;
  type: "email" | "sms";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let { identifier, otp, type }: SignInWithOTPRequest = await req.json();

    if (!identifier || !otp) {
      return new Response(
        JSON.stringify({ error: "Identifier and OTP are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Format identifier BEFORE verifying OTP (OTP was stored with formatted identifier)
    let formattedIdentifier = identifier;
    if (type === "sms") {
      formattedIdentifier = identifier.replace(/\D/g, "");
      if (!formattedIdentifier.startsWith("91")) {
        formattedIdentifier = "91" + formattedIdentifier;
      }
    }

    // Verify OTP first - use formatted identifier
    const { data: otpData, error: fetchError } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("identifier", formattedIdentifier)
      .eq("type", type)
      .eq("otp", otp)
      .eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

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

    // Find user by identifier in profiles table (not auth.users)
    // Use the same logic as check-user-exists to ensure consistency
    let profile: any = null;
    let userEmail: string | null = null;

    if (type === "email") {
      // Find user by email in profiles - try exact match
      let { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, phone_number")
        .eq("email", identifier.trim())
        .limit(1);

      if (profileError) {
        console.error("Error finding profile by email:", profileError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Error finding user account. Please try again.",
            details: profileError.message,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      if (!profileData || profileData.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "No account found with this email. Please sign up first.",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      profile = profileData[0];
      userEmail = profile.email;
    } else {
      // Find user by phone number in profiles
      // Use the same logic as check-user-exists
      let formattedPhone = formattedIdentifier;
      const withoutCountryCode = formattedPhone.startsWith("91")
        ? formattedPhone.slice(2)
        : formattedPhone;
      const withCountryCode = formattedPhone.startsWith("91")
        ? formattedPhone
        : "91" + formattedPhone;

      console.log("Looking for phone:", {
        formattedPhone,
        withoutCountryCode,
        withCountryCode,
      });

      // Try exact match first with formatted phone
      let { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, phone_number")
        .eq("phone_number", formattedPhone)
        .limit(1);

      console.log("First query result:", { profileData, profileError });

      // If not found, try without country code
      if (
        (!profileData || profileData.length === 0) &&
        !profileError &&
        withoutCountryCode !== formattedPhone
      ) {
        const result = await supabase
          .from("profiles")
          .select("id, email, phone_number")
          .eq("phone_number", withoutCountryCode)
          .limit(1);
        profileData = result.data;
        profileError = result.error;
        console.log("Second query result (without country code):", {
          profileData,
          profileError,
        });
      }

      // If still not found, try with country code
      if (
        (!profileData || profileData.length === 0) &&
        !profileError &&
        withCountryCode !== formattedPhone
      ) {
        const result = await supabase
          .from("profiles")
          .select("id, email, phone_number")
          .eq("phone_number", withCountryCode)
          .limit(1);
        profileData = result.data;
        profileError = result.error;
        console.log("Third query result (with country code):", {
          profileData,
          profileError,
        });
      }

      if (profileError) {
        console.error("Error finding profile by phone:", profileError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Error finding user account. Please try again.",
            details: profileError.message,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      if (!profileData || profileData.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "No account found with this phone number. Please sign up first.",
            debug: {
              searchedFor: formattedPhone,
              alsoTried: [withoutCountryCode, withCountryCode],
            },
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      profile = profileData[0];
      userEmail = profile.email;
      console.log("Found profile:", { id: profile.id, email: userEmail });
    }

    if (!userEmail || !profile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unable to find user account",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Find user in auth.users by profile ID (not email)
    const { data: authUser, error: authError } =
      await supabase.auth.admin.getUserById(profile.id);

    if (authError || !authUser.user) {
      // If auth user doesn't exist, create one
      // Generate a random secure password
      const randomPassword =
        Math.random().toString(36).slice(-12) +
        Math.random().toString(36).slice(-12) +
        "A1!@#";

      // Get the formatted identifier for metadata
      let identifierForMetadata = identifier;
      if (type === "sms") {
        identifierForMetadata = identifier.replace(/\D/g, "");
        if (!identifierForMetadata.startsWith("91")) {
          identifierForMetadata = "91" + identifierForMetadata;
        }
      }

      const { data: newAuthUser, error: createError } =
        await supabase.auth.admin.createUser({
          id: profile.id, // Use profile ID
          email: userEmail,
          password: randomPassword,
          email_confirm: true,
          user_metadata: {
            [type === "email" ? "email" : "phone_number"]:
              identifierForMetadata,
          },
        });

      if (createError || !newAuthUser.user) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to create authentication session",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Use the newly created user for session generation
      userEmail = newAuthUser.user.email!;
    }

    // Generate session for the user
    const user = authUser?.user || { id: profile.id, email: userEmail };

    // Create a session using generateLink with magiclink type
    // This will create a magic link that we can use to sign in
    const { data: sessionData, error: sessionError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: userEmail,
      });

    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create session",
          details: sessionError?.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Extract the token from the recovery link
    const recoveryLink = sessionData.properties?.action_link;
    if (!recoveryLink) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to generate session link",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Parse the recovery link to extract the token
    const url = new URL(recoveryLink);
    const token = url.searchParams.get("token");
    const tokenHash = url.searchParams.get("token_hash");

    // Return the token and link for the client to use
    return new Response(
      JSON.stringify({
        success: true,
        sessionLink: recoveryLink,
        token: token,
        tokenHash: tokenHash,
        user: {
          id: user.id,
          email: user.email,
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
    console.error("Error in signin-with-otp function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
