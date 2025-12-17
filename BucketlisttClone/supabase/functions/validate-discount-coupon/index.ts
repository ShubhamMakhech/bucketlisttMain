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

interface ValidateCouponRequest {
  coupon_code: string;
  experience_id: string;
  booking_amount?: number; // Optional: for calculating discount amount
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      coupon_code,
      experience_id,
      booking_amount,
    }: ValidateCouponRequest = await req.json();

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

    // Find the coupon
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
        experience_id,
        experiences!inner(
          id,
          title,
          price,
          currency
        )
      `
      )
      .eq("experience_id", experience_id)
      .eq("coupon_code", coupon_code.trim().toUpperCase())
      .eq("is_active", true)
      .single();

    if (couponError || !coupon) {
      return new Response(
        JSON.stringify({
          valid: false,
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
          valid: false,
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
          valid: false,
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
          valid: false,
          error: "Coupon usage limit reached",
          message: "This coupon has reached its usage limit",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Calculate discount amount if booking_amount is provided
    let discount_amount = 0;
    let final_amount = booking_amount || 0;

    if (booking_amount) {
      if (coupon.type === "percentage") {
        discount_amount = (booking_amount * coupon.discount_value) / 100;
      } else {
        discount_amount = Math.min(coupon.discount_value, booking_amount); // Flat discount cannot exceed booking amount
      }
      final_amount = Math.max(0, booking_amount - discount_amount);
    }

    return new Response(
      JSON.stringify({
        valid: true,
        coupon: {
          id: coupon.id,
          coupon_code: coupon.coupon_code,
          type: coupon.type,
          discount_value: coupon.discount_value,
          max_uses: coupon.max_uses,
          used_count: coupon.used_count,
          remaining_uses: coupon.max_uses
            ? coupon.max_uses - coupon.used_count
            : null,
          valid_until: coupon.valid_until,
        },
        experience: {
          id: coupon.experiences.id,
          title: coupon.experiences.title,
          price: coupon.experiences.price,
          currency: coupon.experiences.currency,
        },
        discount_calculation: booking_amount
          ? {
              original_amount: booking_amount,
              discount_amount: discount_amount,
              final_amount: final_amount,
              savings_percentage:
                booking_amount > 0
                  ? (discount_amount / booking_amount) * 100
                  : 0,
            }
          : null,
        message: "Coupon is valid",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in validate-discount-coupon function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
