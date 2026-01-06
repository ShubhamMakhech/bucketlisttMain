import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is a vendor or admin
    const { data: userRoles, error: rolesError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError) {
      console.error("Error fetching user roles:", rolesError);
      return new Response(
        JSON.stringify({ error: "Error checking user permissions" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const roles = userRoles?.map((r) => r.role) || [];
    const isVendor = roles.includes("vendor");
    const isAdmin = roles.includes("admin");

    if (!isVendor && !isAdmin) {
      return new Response(
        JSON.stringify({
          error: "Only vendors and admins can manage experiences",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { experienceId, action } = await req.json();

    if (!experienceId) {
      return new Response(
        JSON.stringify({ error: "Experience ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // For toggleForAgent, only admins can do this
    if (action === "toggleForAgent" && !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Only admins can toggle for_agent status" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify the experience exists
    let experienceQuery = supabaseClient
      .from("experiences")
      .select("id, vendor_id, is_active, for_agent")
      .eq("id", experienceId);

    // For vendors (not admins), verify the experience belongs to them
    if (isVendor && !isAdmin) {
      experienceQuery = experienceQuery.eq("vendor_id", user.id);
    }

    const { data: experience, error: experienceError } =
      await experienceQuery.single();

    if (experienceError || !experience) {
      return new Response(
        JSON.stringify({ error: "Experience not found or access denied" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // For toggle action, only vendors can toggle their own experiences (or admins can toggle any)
    if (action === "toggle" && isVendor && !isAdmin) {
      if (experience.vendor_id !== user.id) {
        return new Response(
          JSON.stringify({ error: "You can only toggle your own experiences" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    let result;
    if (action === "toggle") {
      // Toggle the is_active status
      const { data, error } = await supabaseClient
        .from("experiences")
        .update({ is_active: !experience.is_active })
        .eq("id", experienceId)
        .select("id, is_active")
        .single();

      if (error) throw error;
      result = data;
    } else if (action === "toggleForAgent") {
      // Toggle the for_agent status (only admins can do this)
      const { data, error } = await supabaseClient
        .from("experiences")
        .update({ for_agent: !experience.for_agent })
        .eq("id", experienceId)
        .select("id, for_agent")
        .single();

      if (error) throw error;
      result = data;
    } else {
      return new Response(
        JSON.stringify({
          error: 'Invalid action. Use "toggle" or "toggleForAgent"',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        message:
          action === "toggle"
            ? `Experience ${
                result.is_active ? "activated" : "deactivated"
              } successfully`
            : action === "toggleForAgent"
            ? `Experience ${
                result.for_agent ? "enabled" : "disabled"
              } for agents successfully`
            : "Experience status updated successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
