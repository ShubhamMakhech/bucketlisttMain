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

interface CreateCouponRequest {
  coupon_code: string;
  experience_id: string;
  type: "flat" | "percentage";
  discount_value: number;
  max_uses?: number;
  valid_until?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      coupon_code,
      experience_id,
      type,
      discount_value,
      max_uses,
      valid_until,
    }: CreateCouponRequest = await req.json();

    // Validate required fields
    if (!coupon_code || !experience_id || !type || !discount_value) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: coupon_code, experience_id, type, discount_value",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate type
    if (!["flat", "percentage"].includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Type must be either "flat" or "percentage"' }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate discount value
    if (discount_value <= 0) {
      return new Response(
        JSON.stringify({ error: "Discount value must be greater than 0" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate percentage discount
    if (type === "percentage" && discount_value > 100) {
      return new Response(
        JSON.stringify({ error: "Percentage discount cannot exceed 100%" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if experience exists
    const { data: experience, error: experienceError } = await supabase
      .from("experiences")
      .select("id, title, vendor_id")
      .eq("id", experience_id)
      .single();

    if (experienceError || !experience) {
      return new Response(JSON.stringify({ error: "Experience not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if coupon code already exists for this experience
    const { data: existingCoupon, error: checkError } = await supabase
      .from("discount_coupons")
      .select("id, coupon_code")
      .eq("experience_id", experience_id)
      .eq("coupon_code", coupon_code.trim().toUpperCase())
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error checking existing coupon:", checkError);
      return new Response(
        JSON.stringify({ error: "Failed to validate coupon code" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (existingCoupon) {
      return new Response(
        JSON.stringify({
          error: "Coupon code already exists for this experience",
          existing_coupon: existingCoupon,
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create the coupon
    const couponData = {
      coupon_code: coupon_code.trim().toUpperCase(),
      experience_id,
      type,
      discount_value,
      max_uses: max_uses || null,
      valid_until: valid_until || null,
      is_active: true,
    };

    const { data: newCoupon, error: insertError } = await supabase
      .from("discount_coupons")
      .insert(couponData)
      .select()
      .single();

    if (insertError) {
      console.error("Error creating coupon:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create coupon" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        coupon: newCoupon,
        experience: {
          id: experience.id,
          title: experience.title,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in create-discount-coupon function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
