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

interface CheckUserRequest {
  email?: string;
  phoneNumber?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phoneNumber }: CheckUserRequest = await req.json();

    if (!email && !phoneNumber) {
      return new Response(
        JSON.stringify({ error: "Email or phone number is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    let existingProfiles = null;
    let error = null;

    // Check if user exists in profiles table only (not auth.users)
    if (email) {
      const result = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email.trim())
        .limit(1);
      existingProfiles = result.data;
      error = result.error;
    } else if (phoneNumber) {
      // Format phone number - add 91 if not present
      let formattedPhone = phoneNumber.replace(/\D/g, "");
      if (!formattedPhone.startsWith("91")) {
        formattedPhone = "91" + formattedPhone;
      }

      const result = await supabase
        .from("profiles")
        .select("id, phone_number")
        .eq("phone_number", formattedPhone)
        .limit(1);
      existingProfiles = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Error checking user existence:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to validate identifier. Please try again.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const userExists = existingProfiles && existingProfiles.length > 0;

    return new Response(
      JSON.stringify({
        userExists,
        message: userExists
          ? "User already registered"
          : "Identifier available",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (err: any) {
    console.error("Error in check-user-exists function:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
