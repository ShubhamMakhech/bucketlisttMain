import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CouponInput } from "./CouponInput";
import { CouponValidationResult } from "@/hooks/useDiscountCoupon";

interface BookingWithCouponProps {
  experienceId: string;
  experienceTitle: string;
  originalPrice: number;
  currency?: string;
  onBookingComplete?: (
    finalAmount: number,
    couponApplied?: CouponValidationResult
  ) => void;
}

export const BookingWithCoupon: React.FC<BookingWithCouponProps> = ({
  experienceId,
  experienceTitle,
  originalPrice,
  currency = "USD",
  onBookingComplete,
}) => {
  const [appliedCoupon, setAppliedCoupon] =
    useState<CouponValidationResult | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  const handleCouponApplied = (result: CouponValidationResult) => {
    setAppliedCoupon(result);
  };

  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
  };

  const handleBooking = async () => {
    setIsBooking(true);
    try {
      // Your existing booking logic here
      const finalAmount =
        appliedCoupon?.discount_calculation?.final_amount || originalPrice;

      if (onBookingComplete) {
        onBookingComplete(finalAmount, appliedCoupon || undefined);
      }
    } catch (error) {
      console.error("Booking failed:", error);
    } finally {
      setIsBooking(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return currency === "USD"
      ? `$${amount.toFixed(2)}`
      : `${currency}${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Experience Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{experienceTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Original Price:</span>
              <span
                className={
                  appliedCoupon ? "line-through text-gray-500" : "font-medium"
                }
              >
                {formatCurrency(originalPrice)}
              </span>
            </div>

            {appliedCoupon && appliedCoupon.discount_calculation && (
              <>
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>
                    -
                    {formatCurrency(
                      appliedCoupon.discount_calculation.discount_amount
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Final Price:</span>
                  <span>
                    {formatCurrency(
                      appliedCoupon.discount_calculation.final_amount
                    )}
                  </span>
                </div>
                <div className="text-center">
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    You save{" "}
                    {appliedCoupon.discount_calculation.savings_percentage.toFixed(
                      1
                    )}
                    %!
                  </Badge>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Coupon Input */}
      <CouponInput
        experienceId={experienceId}
        bookingAmount={originalPrice}
        currency={currency}
        onCouponApplied={handleCouponApplied}
        onCouponRemoved={handleCouponRemoved}
      />

      {/* Booking Button */}
      <div className="text-center">
        <Button
          onClick={handleBooking}
          disabled={isBooking}
          size="lg"
          className="w-full"
        >
          {isBooking
            ? "Processing..."
            : `Book Now - ${formatCurrency(
                appliedCoupon?.discount_calculation?.final_amount ||
                  originalPrice
              )}`}
        </Button>
      </div>
    </div>
  );
};
