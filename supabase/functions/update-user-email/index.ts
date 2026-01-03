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
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface UpdateEmailRequest {
  userId: string;
  newEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { userId, newEmail }: UpdateEmailRequest = body;

    if (!userId || !newEmail) {
      return new Response(
        JSON.stringify({ error: "User ID and new email are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if user exists and if email is already in use
    const { data: userList, error: listError } =
      await supabase.auth.admin.listUsers();

    if (listError) {
      console.error("Error listing users:", listError);
      return new Response(
        JSON.stringify({
          error: "Failed to check existing users",
          details: listError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if user exists
    const userExists = userList.users.some((u: any) => u.id === userId);
    if (!userExists) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if email is already in use by another user
    const emailExists = userList.users.some(
      (u: any) => u.email?.toLowerCase() === newEmail.toLowerCase() && u.id !== userId
    );

    if (emailExists) {
      return new Response(
        JSON.stringify({ error: "Email is already in use" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get current user data
    const currentUser = userList.users.find((u: any) => u.id === userId);
    if (!currentUser) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Use database function to update email directly (bypasses API limitations)
    const { data: functionResult, error: functionError } = await supabase.rpc(
      "update_user_email",
      {
        user_id: userId,
        new_email: newEmail,
      }
    );

    if (functionError) {
      console.error("Error calling update_user_email function:", functionError);
      return new Response(
        JSON.stringify({
          error: functionError.message || "Failed to update email",
          details: functionError,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!functionResult || !functionResult.success) {
      return new Response(
        JSON.stringify({
          error: functionResult?.error || "Failed to update email",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get updated user data
    const { data: updatedUserData, error: getUserError } =
      await supabase.auth.admin.getUserById(userId);

    if (getUserError || !updatedUserData.user) {
      console.error("Error getting updated user:", getUserError);
      // Still return success since email was updated
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email updated successfully",
        user: {
          id: userId,
          email: newEmail,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in update-user-email function:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Error updating user",
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

