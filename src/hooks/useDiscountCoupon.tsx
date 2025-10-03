import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DiscountCoupon {
  id: string;
  coupon_code: string;
  type: "flat" | "percentage";
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  remaining_uses: number | null;
  valid_until: string | null;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: DiscountCoupon;
  experience?: {
    id: string;
    title: string;
    price: number;
    currency: string;
  };
  discount_calculation?: {
    original_amount: number;
    discount_amount: number;
    final_amount: number;
    savings_percentage: number;
  };
  error?: string;
  message?: string;
}

export interface CreateCouponRequest {
  coupon_code: string;
  experience_id: string;
  type: "flat" | "percentage";
  discount_value: number;
  max_uses?: number;
  valid_until?: string;
}

export const useDiscountCoupon = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateCoupon = async (
    couponCode: string,
    experienceId: string,
    bookingAmount?: number
  ): Promise<CouponValidationResult> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "validate-discount-coupon",
        {
          body: {
            coupon_code: couponCode,
            experience_id: experienceId,
            booking_amount: bookingAmount,
          },
        }
      );

      if (error) {
        throw error;
      }

      return data;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to validate coupon";
      setError(errorMessage);
      return {
        valid: false,
        error: errorMessage,
        message: "Could not validate coupon",
      };
    } finally {
      setLoading(false);
    }
  };

  const createCoupon = async (couponData: CreateCouponRequest) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-discount-coupon",
        {
          body: couponData,
        }
      );

      if (error) {
        throw error;
      }

      return data;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to create coupon";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async (
    couponCode: string,
    experienceId: string,
    bookingId?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "apply-discount-coupon",
        {
          body: {
            coupon_code: couponCode,
            experience_id: experienceId,
            booking_id: bookingId,
          },
        }
      );

      if (error) {
        throw error;
      }

      return data;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to apply coupon";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getCouponsForExperience = async (experienceId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
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
          created_at
        `
        )
        .eq("experience_id", experienceId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch coupons";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    validateCoupon,
    createCoupon,
    applyCoupon,
    getCouponsForExperience,
  };
};
