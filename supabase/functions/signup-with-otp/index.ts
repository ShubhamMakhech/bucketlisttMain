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

    // Verify OTP first
    const { data: otpData, error: fetchError } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("identifier", identifier)
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
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, phone_number")
        .eq("phone_number", formattedIdentifier)
        .limit(1);
      if (profiles && profiles.length > 0) {
        existingUser = profiles[0];
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

    // Generate a random secure password (user won't need it for OTP login)
    const randomPassword =
      Math.random().toString(36).slice(-12) +
      Math.random().toString(36).slice(-12) +
      "A1!@#";

    // Create user in Supabase Auth (no email verification needed)
    const { data: authData, error: signUpError } =
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

    if (signUpError || !authData.user) {
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

    // Profile is automatically created by database trigger
    // But we need to update it with the correct phone number if it was SMS signup
    if (type === "sms") {
      await supabase
        .from("profiles")
        .update({ phone_number: formattedIdentifier })
        .eq("id", authData.user.id);
    }

    // Generate a session for the new user
    const { data: sessionData, error: sessionError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: authData.user.email!,
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

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account created successfully",
        sessionLink: sessionData.properties?.action_link,
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
  } catch (error: any) {
    console.error("Error in signup-with-otp function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
