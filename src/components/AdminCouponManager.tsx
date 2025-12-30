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
} from "lucide-react";
import {
  useDiscountCoupon,
  DiscountCoupon,
  CreateCouponRequest,
} from "@/hooks/useDiscountCoupon";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export const AdminCouponManager: React.FC = () => {
  const [selectedExperienceId, setSelectedExperienceId] = useState<string>("");
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState<CreateCouponRequest>({
    coupon_code: "",
    experience_id: "",
    type: "percentage",
    discount_value: 0,
    max_uses: null,
    valid_until: null,
  });
  const { toast } = useToast();

  const { createCoupon, getCouponsForExperience, loading, error } =
    useDiscountCoupon();

  // Fetch all experiences for admin
  const { data: experiences = [], isLoading: experiencesLoading } = useQuery({
    queryKey: ["admin-all-experiences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select("id, title, location")
        .eq("is_active", true)
        .order("title", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (selectedExperienceId) {
      loadCoupons();
      // Update newCoupon with selected experience
      setNewCoupon((prev) => ({
        ...prev,
        experience_id: selectedExperienceId,
      }));
    } else {
      setCoupons([]);
    }
  }, [selectedExperienceId]);

  const loadCoupons = async () => {
    if (!selectedExperienceId) return;
    try {
      const data = await getCouponsForExperience(selectedExperienceId);
      setCoupons(data || []);
    } catch (err) {
      console.error("Error loading coupons:", err);
      toast({
        title: "Error",
        description: "Failed to load coupons",
        variant: "destructive",
      });
    }
  };

  const handleCreateCoupon = async () => {
    if (!selectedExperienceId) {
      toast({
        title: "Error",
        description: "Please select an experience first",
        variant: "destructive",
      });
      return;
    }

    if (!newCoupon.coupon_code || !newCoupon.discount_value) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await createCoupon(newCoupon);
      await loadCoupons();
      setIsCreateDialogOpen(false);
      setNewCoupon({
        coupon_code: "",
        experience_id: selectedExperienceId,
        type: "percentage",
        discount_value: 0,
        max_uses: null,
        valid_until: null,
      });
      toast({
        title: "Success",
        description: "Coupon created successfully",
      });
    } catch (err: any) {
      console.error("Error creating coupon:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to create coupon",
        variant: "destructive",
      });
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
      toast({
        title: "Success",
        description: "Coupon deactivated successfully",
      });
    } catch (err) {
      console.error("Error deleting coupon:", err);
      toast({
        title: "Error",
        description: "Failed to deactivate coupon",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No expiry";
    return new Date(dateString).toLocaleDateString();
  };

  const selectedExperience = experiences.find(
    (exp) => exp.id === selectedExperienceId
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Admin Coupon Manager</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Create and manage discount coupons for any experience
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="experience-select">Select Experience</Label>
              <Select
                value={selectedExperienceId}
                onValueChange={setSelectedExperienceId}
                disabled={experiencesLoading}
              >
                <SelectTrigger id="experience-select" className="w-full">
                  <SelectValue placeholder="Choose an experience..." />
                </SelectTrigger>
                <SelectContent>
                  {experiences.map((experience) => (
                    <SelectItem key={experience.id} value={experience.id}>
                      {experience.title} {experience.location ? `- ${experience.location}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedExperienceId && (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    Coupons for: {selectedExperience?.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Manage discount coupons for this experience
                  </p>
                </div>
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
                  <DialogContent className="max-w-md">
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
                            {newCoupon.type === "percentage" ? "(%)" : "(₹)"}
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
                          {loading ? "Creating..." : "Create Coupon"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedExperienceId && (
        <Card>
          <CardHeader>
            <CardTitle>Existing Coupons</CardTitle>
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

