import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  identifier: string; // email or phone number
  otp: string;
  authMethod: "email" | "phone";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identifier, otp, authMethod }: VerifyOTPRequest = await req.json();

    if (!identifier || !otp || !authMethod) {
      return new Response(
        JSON.stringify({ error: "Identifier, OTP, and auth method are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the OTP record
    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("identifier", identifier)
      .eq("auth_method", authMethod)
      .eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if OTP is expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "OTP has expired. Please request a new one." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check attempts (max 5 attempts)
    if (otpRecord.attempts >= 5) {
      return new Response(
        JSON.stringify({ error: "Too many attempts. Please request a new OTP." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      // Increment attempts
      await supabase
        .from("otp_verifications")
        .update({ attempts: otpRecord.attempts + 1 })
        .eq("id", otpRecord.id);

      return new Response(
        JSON.stringify({ error: "Invalid OTP. Please try again." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if user exists
    let userEmail = authMethod === "email" ? identifier : null;
    let userPhone = authMethod === "phone" ? identifier : null;

    // Format phone number consistently
    if (userPhone && !userPhone.startsWith("+")) {
      userPhone = `+91${userPhone.replace(/\s/g, "")}`;
    }

    // Find existing user by email or phone
    let existingUser = null;
    if (userEmail) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", userEmail.toLowerCase().trim())
        .maybeSingle();
      
      if (profile) {
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
        existingUser = authUser?.user;
      }
    } else if (userPhone) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, phone_number")
        .eq("phone_number", userPhone)
        .maybeSingle();
      
      if (profile) {
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
        existingUser = authUser?.user;
      }
    }

    // Mark OTP as verified
    await supabase
      .from("otp_verifications")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    if (existingUser) {
      // User exists

      // Generate magic link for sign-in
      const redirectUrl = `${Deno.env.get("SITE_URL") || "https://www.bucketlistt.com"}/auth?otp_verified=true`;
      
      let magicLinkResponse;
      if (userEmail) {
        magicLinkResponse = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: userEmail,
          options: {
            redirectTo: redirectUrl,
          },
        });
      } else if (userPhone) {
        // For phone, we'll need to use OTP sign-in
        // Generate a magic link using phone
        magicLinkResponse = await supabase.auth.admin.generateLink({
          type: "magiclink",
          phone: userPhone,
          options: {
            redirectTo: redirectUrl,
          },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          isNewUser: false,
          userId: existingUser.id,
          magicLink: magicLinkResponse?.data?.properties?.action_link,
          message: "OTP verified successfully",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } else {
      // New user - create account
      // Generate a random password (user won't need it for OTP auth)
      const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + "A1!";
      
      const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
        email: userEmail ? userEmail.toLowerCase().trim() : undefined,
        phone: userPhone || undefined,
        email_confirm: true, // Auto-confirm for OTP-based signup
        phone_confirm: true,
        user_metadata: {
          auth_method: authMethod,
          phone_number: userPhone || null,
        },
        password: randomPassword, // Required but won't be used
      });

      if (signUpError || !newUser.user) {
        console.error("Error creating user:", signUpError);
        return new Response(
          JSON.stringify({ error: "Failed to create account" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Update profile with auth_method
      await supabase
        .from("profiles")
        .update({ auth_method: authMethod })
        .eq("id", newUser.user.id);

      // Generate magic link for new user
      const redirectUrl = `${Deno.env.get("SITE_URL") || "https://www.bucketlistt.com"}/auth?otp_verified=true`;
      
      let magicLinkResponse;
      if (userEmail) {
        magicLinkResponse = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: userEmail,
          options: {
            redirectTo: redirectUrl,
          },
        });
      } else if (userPhone) {
        magicLinkResponse = await supabase.auth.admin.generateLink({
          type: "magiclink",
          phone: userPhone,
          options: {
            redirectTo: redirectUrl,
          },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          isNewUser: true,
          userId: newUser.user.id,
          magicLink: magicLinkResponse?.data?.properties?.action_link,
          message: "Account created successfully",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

