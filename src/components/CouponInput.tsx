import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Percent,
  DollarSign,
} from "lucide-react";
import {
  useDiscountCoupon,
  CouponValidationResult,
} from "@/hooks/useDiscountCoupon";

interface CouponInputProps {
  experienceId: string;
  bookingAmount: number;
  currency?: string;
  onCouponApplied?: (result: CouponValidationResult) => void;
  onCouponRemoved?: () => void;
  className?: string;
}

export const CouponInput: React.FC<CouponInputProps> = ({
  experienceId,
  bookingAmount,
  currency = "USD",
  onCouponApplied,
  onCouponRemoved,
  className,
}) => {
  const [couponCode, setCouponCode] = useState("");
  const [validationResult, setValidationResult] =
    useState<CouponValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const { validateCoupon, applyCoupon, loading, error } = useDiscountCoupon();

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsValidating(true);
    try {
      const result = await validateCoupon(
        couponCode.trim(),
        experienceId,
        bookingAmount
      );
      setValidationResult(result);

      if (result.valid && onCouponApplied) {
        onCouponApplied(result);
      }
    } catch (err) {
      console.error("Error validating coupon:", err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!validationResult?.valid || !couponCode.trim()) return;

    try {
      await applyCoupon(couponCode.trim(), experienceId);
      // Coupon is now applied and usage count is incremented
    } catch (err) {
      console.error("Error applying coupon:", err);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setValidationResult(null);
    if (onCouponRemoved) {
      onCouponRemoved();
    }
  };

  const formatCurrency = (amount: number) => {
    return currency === "USD"
      ? `$${amount.toFixed(2)}`
      : `${currency}${amount.toFixed(2)}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Apply Discount Coupon</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="coupon-code">Coupon Code</Label>
            <Input
              id="coupon-code"
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={loading || isValidating}
              className="uppercase"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleValidateCoupon}
              disabled={!couponCode.trim() || loading || isValidating}
              className="min-w-[100px]"
            >
              {isValidating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Validate"
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {validationResult && (
          <div className="space-y-3">
            {validationResult.valid ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Coupon Valid!</span>
                </div>

                {validationResult.coupon && (
                  <div className="bg-green-50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          {validationResult.coupon.coupon_code}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {validationResult.coupon.type === "percentage" ? (
                            <Percent className="h-4 w-4" />
                          ) : (
                            <DollarSign className="h-4 w-4" />
                          )}
                          <span className="text-sm font-medium">
                            {validationResult.coupon.type === "percentage"
                              ? `${validationResult.coupon.discount_value}% OFF`
                              : `${formatCurrency(
                                  validationResult.coupon.discount_value
                                )} OFF`}
                          </span>
                        </div>
                      </div>
                      {validationResult.coupon.remaining_uses !== null && (
                        <span className="text-xs text-gray-500">
                          {validationResult.coupon.remaining_uses} uses left
                        </span>
                      )}
                    </div>

                    {validationResult.discount_calculation && (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Original Amount:</span>
                          <span>
                            {formatCurrency(
                              validationResult.discount_calculation
                                .original_amount
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>
                            -
                            {formatCurrency(
                              validationResult.discount_calculation
                                .discount_amount
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium border-t pt-1">
                          <span>Final Amount:</span>
                          <span>
                            {formatCurrency(
                              validationResult.discount_calculation.final_amount
                            )}
                          </span>
                        </div>
                        <div className="text-center text-green-600 font-medium">
                          You save{" "}
                          {validationResult.discount_calculation.savings_percentage.toFixed(
                            1
                          )}
                          %!
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleApplyCoupon} className="flex-1">
                    Apply Coupon
                  </Button>
                  <Button variant="outline" onClick={handleRemoveCoupon}>
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">
                  {validationResult.message || "Invalid coupon"}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
