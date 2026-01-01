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

    // Find user by identifier in profiles table (not auth.users)
    let profile: any = null;
    let userEmail: string | null = null;

    if (type === "email") {
      // Find user by email in profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, phone_number")
        .eq("email", identifier)
        .single();

      if (profileError || !profileData) {
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

      profile = profileData;
      userEmail = profile.email;
    } else {
      // Find user by phone number in profiles
      // Format phone number - add 91 if not present
      let formattedIdentifier = identifier.replace(/\D/g, "");
      if (!formattedIdentifier.startsWith("91")) {
        formattedIdentifier = "91" + formattedIdentifier;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, phone_number")
        .eq("phone_number", formattedIdentifier)
        .single();

      if (profileError || !profileData) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "No account found with this phone number. Please sign up first.",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      profile = profileData;
      userEmail = profile.email;
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

    // Generate a session token for the user
    // We'll use Supabase's admin API to generate a session
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
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Return the session link - client will extract tokens from it
    return new Response(
      JSON.stringify({
        success: true,
        sessionLink: sessionData.properties?.action_link,
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
