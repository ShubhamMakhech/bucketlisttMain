import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: any;
  onProfileUpdate: () => void;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  userProfile,
  onProfileUpdate,
}: EditProfileDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: userProfile?.first_name || "",
    lastName: userProfile?.last_name || "",
    phoneNumber: userProfile?.phone_number || "",
    email: user?.email || "",
  });

  useEffect(() => {
    setFormData({
      firstName: userProfile?.first_name || "",
      lastName: userProfile?.last_name || "",
      phoneNumber: userProfile?.phone_number || "",
      email: user?.email || "",
    });
  }, [userProfile, user]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate form data
    const trimmedData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      email: formData.email.trim().toLowerCase(),
    };

    // Basic validation
    if (!trimmedData.firstName || !trimmedData.lastName) {
      toast({
        title: "Validation Error",
        description: "First name and last name are required.",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    if (!trimmedData.email) {
      toast({
        title: "Validation Error",
        description: "Email is required.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Phone number validation (optional but if provided, should be valid)
    if (
      trimmedData.phoneNumber &&
      !/^[\+]?[1-9][\d]{0,15}$/.test(trimmedData.phoneNumber)
    ) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid phone number.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check if email has changed
      const emailChanged = trimmedData.email !== user?.email;

      // Update email using Edge Function if it has changed (bypasses email verification)
      if (emailChanged) {
        const { data: emailUpdateData, error: emailUpdateError } =
          await supabase.functions.invoke("update-user-email", {
            body: {
              userId: user.id,
              newEmail: trimmedData.email,
            },
          });

        if (emailUpdateError) {
          throw emailUpdateError;
        }

        if (!emailUpdateData?.success) {
          throw new Error(emailUpdateData?.error || "Failed to update email");
        }

        // Refresh the user session to get the updated email
        // This ensures the frontend reflects the change immediately
        const {
          data: { user: updatedUser },
          error: refreshError,
        } = await supabase.auth.getUser();

        if (refreshError) {
          console.error("Error refreshing user:", refreshError);
          // Continue anyway - the email is updated in the database
        } else if (updatedUser) {
          // The user object is automatically updated via onAuthStateChange listener
          // But we can also manually refresh the session to ensure it's updated
          await supabase.auth.refreshSession();
        }
      }

      // Update profile information (email is already updated by Edge Function, but update other fields)
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        email: trimmedData.email, // Update email in profiles too
        first_name: trimmedData.firstName,
        last_name: trimmedData.lastName,
        phone_number: trimmedData.phoneNumber || null,
        updated_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      toast({
        title: "Profile updated",
        description: emailChanged
          ? "Your email and profile have been updated successfully."
          : "Your personal information has been updated successfully.",
      });

      onProfileUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Personal Information</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              placeholder="Enter your phone number"
              type="tel"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter your email address"
              required
            />
            <p className="text-xs text-muted-foreground">
              Your email will be updated immediately
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
