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
  role?: "customer" | "vendor" | "agent";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let {
      identifier,
      otp,
      type,
      role = "customer",
    }: SignInWithOTPRequest = await req.json();

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
    let createdAuthUser: any = null; // Store auth user if we auto-create account

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
        // User doesn't exist - create new account (auto sign-up)
        const email = identifier.trim();

        // Check if auth user already exists with this email
        let authUser: any = null;
        try {
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
        const randomPassword =
          Math.random().toString(36).slice(-12) +
          Math.random().toString(36).slice(-12) +
          "A1!@#";

        const { data: newAuthData, error: signUpError } =
          await supabase.auth.admin.createUser({
            email,
            password: randomPassword,
            email_confirm: true,
            user_metadata: {
              email: identifier.trim(),
              role: role,
              terms_accepted: true,
            },
          });

        if (signUpError || !newAuthData.user) {
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

        // Profile is automatically created by database trigger
        // Get the newly created profile
        const { data: newProfile, error: profileFetchError } = await supabase
          .from("profiles")
          .select("id, email, phone_number")
          .eq("id", newAuthData.user.id)
          .single();

        if (profileFetchError || !newProfile) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Failed to create user profile",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }

        profile = newProfile;
        userEmail = newProfile.email;
        createdAuthUser = newAuthData.user; // Store the created auth user
      } else {
        profile = profileData[0];
        userEmail = profile.email;
      }
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

      // Try exact match first with formatted phone
      let { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, phone_number")
        .eq("phone_number", formattedPhone)
        .limit(1);

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
        // User doesn't exist - create new account (auto sign-up)
        const email = `${formattedPhone}@bucketlistt.temp`;

        // Check if auth user already exists with this email
        let authUser: any = null;
        try {
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
        const randomPassword =
          Math.random().toString(36).slice(-12) +
          Math.random().toString(36).slice(-12) +
          "A1!@#";

        const { data: newAuthData, error: signUpError } =
          await supabase.auth.admin.createUser({
            email,
            password: randomPassword,
            email_confirm: true,
            user_metadata: {
              phone_number: formattedPhone,
              role: role,
              terms_accepted: true,
            },
          });

        if (signUpError || !newAuthData.user) {
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

        // Profile is automatically created by database trigger
        // Update it with the correct phone number
        await supabase
          .from("profiles")
          .update({ phone_number: formattedPhone })
          .eq("id", newAuthData.user.id);

        // Get the newly created profile
        const { data: newProfile, error: profileFetchError } = await supabase
          .from("profiles")
          .select("id, email, phone_number")
          .eq("id", newAuthData.user.id)
          .single();

        if (profileFetchError || !newProfile) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Failed to create user profile",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }

        profile = newProfile;
        userEmail = newProfile.email;
        createdAuthUser = newAuthData.user; // Store the created auth user
      } else {
        profile = profileData[0];
        userEmail = profile.email;
      }
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
    // If we just created the auth user, use it directly
    let authUser: any = null;
    if (createdAuthUser) {
      authUser = { user: createdAuthUser };
    } else {
      const { data: fetchedAuthUser, error: authError } =
        await supabase.auth.admin.getUserById(profile.id);

      if (!authError && fetchedAuthUser) {
        authUser = fetchedAuthUser;
      }
    }

    if (!authUser || !authUser.user) {
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
