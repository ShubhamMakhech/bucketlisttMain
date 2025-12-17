import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Percent,
  DollarSign,
  Calendar,
  Users,
  Trash2,
  Edit,
} from "lucide-react";
import {
  useDiscountCoupon,
  DiscountCoupon,
  CreateCouponRequest,
} from "@/hooks/useDiscountCoupon";
import { supabase } from "@/integrations/supabase/client";

interface CouponManagerProps {
  experienceId: string;
  experienceTitle: string;
}

export const CouponManager: React.FC<CouponManagerProps> = ({
  experienceId,
  experienceTitle,
}) => {
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState<CreateCouponRequest>({
    coupon_code: "",
    experience_id: experienceId,
    type: "percentage",
    discount_value: 0,
    max_uses: null,
    valid_until: null,
  });

  const { createCoupon, getCouponsForExperience, loading, error } =
    useDiscountCoupon();

  useEffect(() => {
    loadCoupons();
  }, [experienceId]);

  const loadCoupons = async () => {
    try {
      const data = await getCouponsForExperience(experienceId);
      setCoupons(data || []);
    } catch (err) {
      console.error("Error loading coupons:", err);
    }
  };

  const handleCreateCoupon = async () => {
    try {
      await createCoupon(newCoupon);
      await loadCoupons();
      setIsCreateDialogOpen(false);
      setNewCoupon({
        coupon_code: "",
        experience_id: experienceId,
        type: "percentage",
        discount_value: 0,
        max_uses: null,
        valid_until: null,
      });
    } catch (err) {
      console.error("Error creating coupon:", err);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      const { error } = await supabase
        .from("discount_coupons")
        .update({ is_active: false })
        .eq("id", couponId);

      if (error) throw error;
      await loadCoupons();
    } catch (err) {
      console.error("Error deleting coupon:", err);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No expiry";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Discount Coupons for {experienceTitle}</CardTitle>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Coupon</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="coupon-code">Coupon Code</Label>
                  <Input
                    id="coupon-code"
                    type="text"
                    placeholder="e.g., SAVE20"
                    value={newCoupon.coupon_code}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        coupon_code: e.target.value.toUpperCase(),
                      })
                    }
                    className="uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="discount-type">Discount Type</Label>
                    <Select
                      value={newCoupon.type}
                      onValueChange={(value: "flat" | "percentage") =>
                        setNewCoupon({ ...newCoupon, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="flat">Flat Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="discount-value">
                      Discount Value{" "}
                      {newCoupon.type === "percentage" ? "(%)" : "($)"}
                    </Label>
                    <Input
                      id="discount-value"
                      type="number"
                      min="0"
                      max={newCoupon.type === "percentage" ? 100 : undefined}
                      step={newCoupon.type === "percentage" ? 1 : 0.01}
                      value={newCoupon.discount_value}
                      onChange={(e) =>
                        setNewCoupon({
                          ...newCoupon,
                          discount_value: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max-uses">Max Uses (optional)</Label>
                    <Input
                      id="max-uses"
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={newCoupon.max_uses || ""}
                      onChange={(e) =>
                        setNewCoupon({
                          ...newCoupon,
                          max_uses: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="valid-until">Valid Until (optional)</Label>
                    <Input
                      id="valid-until"
                      type="datetime-local"
                      value={
                        newCoupon.valid_until
                          ? newCoupon.valid_until.slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        setNewCoupon({
                          ...newCoupon,
                          valid_until: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : null,
                        })
                      }
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCoupon} disabled={loading}>
                    Create Coupon
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {coupons.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No coupons created yet. Create your first coupon to offer discounts
            to customers.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coupon Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <Badge variant="outline">{coupon.coupon_code}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {coupon.type === "percentage" ? (
                        <Percent className="h-4 w-4" />
                      ) : (
                        <DollarSign className="h-4 w-4" />
                      )}
                      <span className="capitalize">{coupon.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {coupon.type === "percentage"
                      ? `${coupon.discount_value}%`
                      : formatCurrency(coupon.discount_value)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>
                        {coupon.used_count}
                        {coupon.max_uses ? ` / ${coupon.max_uses}` : " / ∞"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(coupon.valid_until)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCoupon(coupon.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
