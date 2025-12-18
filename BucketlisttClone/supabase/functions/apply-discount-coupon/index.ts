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

interface ApplyCouponRequest {
  coupon_code: string;
  experience_id: string;
  booking_id?: string; // Optional: to track which booking used the coupon
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { coupon_code, experience_id, booking_id }: ApplyCouponRequest =
      await req.json();

    // Validate required fields
    if (!coupon_code || !experience_id) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: coupon_code, experience_id",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // First validate the coupon exists and is valid
    const { data: coupon, error: couponError } = await supabase
      .from("discount_coupons")
      .select(
        `
        id,
        coupon_code,
        is_active,
        type,
        discount_value,
        max_uses,
        used_count,
        valid_from,
        valid_until,
        experience_id
      `
      )
      .eq("experience_id", experience_id)
      .eq("coupon_code", coupon_code.trim().toUpperCase())
      .eq("is_active", true)
      .single();

    if (couponError || !coupon) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Coupon not found or inactive",
          message: "Invalid coupon code",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if coupon has expired
    const now = new Date();
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Coupon expired",
          message: "This coupon has expired",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if coupon is not yet valid
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Coupon not yet valid",
          message: "This coupon is not yet active",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check usage limits
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Coupon usage limit reached",
          message: "This coupon has reached its usage limit",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Increment the usage count
    const { data: updatedCoupon, error: updateError } = await supabase
      .from("discount_coupons")
      .update({
        used_count: coupon.used_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", coupon.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating coupon usage:", updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to apply coupon",
          message: "Could not apply the coupon",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        coupon: {
          id: updatedCoupon.id,
          coupon_code: updatedCoupon.coupon_code,
          type: updatedCoupon.type,
          discount_value: updatedCoupon.discount_value,
          used_count: updatedCoupon.used_count,
          max_uses: updatedCoupon.max_uses,
          remaining_uses: updatedCoupon.max_uses
            ? updatedCoupon.max_uses - updatedCoupon.used_count
            : null,
        },
        message: "Coupon applied successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in apply-discount-coupon function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        message: "An error occurred while applying the coupon",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
