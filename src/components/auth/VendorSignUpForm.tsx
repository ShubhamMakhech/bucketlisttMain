import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Store, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface VendorSignUpFormProps {
  onToggleMode: () => void;
}

export function VendorSignUpForm({ onToggleMode }: VendorSignUpFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    companyName: "",
    role: "vendor" as "vendor" | "agent",
    termsAccepted: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!formData.termsAccepted) {
      toast({
        title: "Terms not accepted",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        termsAccepted: formData.termsAccepted,
      });

      if (error) {
        console.log("Signup error:", error);

        // Check if the error is about user already existing - comprehensive patterns
        if (
          error.message.includes("User already registered") ||
          error.message.includes("already been registered") ||
          error.message.includes("email address is already registered") ||
          error.message.includes("already exists") ||
          error.message.includes("duplicate") ||
          error.message.includes("user_repeated_signup") ||
          error.code === "user_already_exists" ||
          error.code === "email_address_already_registered" ||
          error.status === 422
        ) {
          toast({
            title: "Account already exists",
            description: (
              <div className="space-y-2">
                <p>You already have an account with this email address.</p>
                <Button
                  variant="link"
                  className="p-0 h-auto text-orange-500 hover:text-orange-600"
                  onClick={onToggleMode}
                >
                  Go to login page instead
                </Button>
              </div>
            ),
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: `${
            formData.role === "agent" ? "Agent" : "Vendor"
          } account created successfully!`,
          description: "Please check your email to confirm your account.",
          variant: "default",
        });
        navigate("/email-confirmation");
      }
    } catch (error: any) {
      console.error("Signup error:", error);

      // Additional check for existing user in catch block
      if (error?.message?.includes("already") || error?.status === 422) {
        toast({
          title: "Account already exists",
          description: (
            <div className="space-y-2">
              <p>You already have an account with this email address.</p>
              <Button
                variant="link"
                className="p-0 h-auto text-orange-500 hover:text-orange-600"
                onClick={onToggleMode}
              >
                Go to login page instead
              </Button>
            </div>
          ),
          variant: "destructive",
        });
      } else {
        toast({
          title: "An error occurred",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-lg max-h-[90vh] overflow-y-auto">
      <CardHeader>
        <CardTitle>Create Vendor Account</CardTitle>
        <CardDescription>Join as a travel experience provider</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Role Selection */}
          <div className="space-y-3">
            <Label>Account Type</Label>
            <RadioGroup
              value={formData.role}
              onValueChange={(value) =>
                handleInputChange("role", value as "vendor" | "agent")
              }
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <RadioGroupItem value="vendor" id="vendor" className="mt-0" />
                <Label
                  htmlFor="vendor"
                  className="flex items-center gap-2 cursor-pointer font-normal flex-1"
                >
                  <Store className="h-4 w-4 text-orange-500" />
                  <div>
                    <div className="font-medium">Vendor</div>
                    {/* <div className="text-xs text-gray-500 dark:text-gray-400">
                      Experience provider
                    </div> */}
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <RadioGroupItem value="agent" id="agent" className="mt-0" />
                <Label
                  htmlFor="agent"
                  className="flex items-center gap-2 cursor-pointer font-normal flex-1"
                >
                  <UserCheck className="h-4 w-4 text-orange-500" />
                  <div>
                    <div className="font-medium">Agent</div>
                    {/* <div className="text-xs text-gray-500 dark:text-gray-400">
                      Travel agent
                    </div> */}
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="Your first name"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Your last name"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              placeholder="Your company name"
              value={formData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+91"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={formData.termsAccepted}
              onCheckedChange={(checked) =>
                handleInputChange("termsAccepted", checked)
              }
            />
            <Label
              htmlFor="terms"
              className="text-sm font-normal cursor-pointer"
            >
              I agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="p-0 h-auto text-orange-500 hover:text-orange-600"
              >
                Terms & Conditions
              </a>
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create {formData.role === "agent" ? "Agent" : "Vendor"} Account
          </Button>
          <div className="text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
            </span>
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto font-normal text-orange-500 hover:text-orange-600"
              onClick={onToggleMode}
            >
              Sign in here
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
