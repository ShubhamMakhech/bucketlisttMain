import React, { useState, useEffect, useRef } from "react";
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
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface SignUpFormOTPProps {
  onToggleMode: () => void;
  prefilledPhoneNumber?: string;
}

// Helper function to detect if input is email or phone
function detectInputType(input: string): "email" | "phone" {
  // Simple email detection
  if (input.includes("@") && input.includes(".")) {
    return "email";
  }
  // Phone detection (contains mostly digits, possibly with +, spaces, dashes)
  const digitsOnly = input.replace(/\D/g, "");
  if (digitsOnly.length >= 10) {
    return "phone";
  }
  // Default to email if unclear
  return "email";
}

export function SignUpFormOTP({ onToggleMode, prefilledPhoneNumber }: SignUpFormOTPProps) {
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"input" | "verify">("input");
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { sendOTP, verifyOTP, signUpWithOTP, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const hasAutoSentRef = useRef(false);

  // Initialize identifier with prefilled phone number if provided
  useEffect(() => {
    if (prefilledPhoneNumber && !identifier) {
      // Format phone number: remove non-digits, add 91 if needed
      let formattedPhone = prefilledPhoneNumber.replace(/\D/g, "");
      if (!formattedPhone.startsWith("91") && formattedPhone.length === 10) {
        formattedPhone = "91" + formattedPhone;
      }
      setIdentifier(formattedPhone);
    }
  }, []); // Run only on mount

  // Reset form state when component mounts or when prefilledPhoneNumber changes
  useEffect(() => {
    // Reset auto-send flag when prefilledPhoneNumber changes
    hasAutoSentRef.current = false;

    // Reset all form state, but pre-fill phone if provided
    if (prefilledPhoneNumber) {
      // Format phone number: remove non-digits, add 91 if needed
      let formattedPhone = prefilledPhoneNumber.replace(/\D/g, "");
      if (!formattedPhone.startsWith("91") && formattedPhone.length === 10) {
        formattedPhone = "91" + formattedPhone;
      }
      setIdentifier(formattedPhone);
    } else {
      // Clear identifier if no prefilled phone
      setIdentifier("");
    }
    setOtp("");
    setStep("input");
    setLoading(false);
    setSendingOTP(false);
    setCountdown(0);
  }, [prefilledPhoneNumber]); // Run when prefilledPhoneNumber changes

  // Auto-send OTP if phone number is prefilled (runs after identifier is set)
  useEffect(() => {
    if (prefilledPhoneNumber && identifier && step === "input" && !sendingOTP && countdown === 0 && !hasAutoSentRef.current) {
      // Check if it's a phone number (not email)
      if (!identifier.includes("@")) {
        hasAutoSentRef.current = true;
        // Small delay to ensure component is fully mounted
        const timer = setTimeout(() => {
          handleSendOTP();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledPhoneNumber, identifier, step, sendingOTP, countdown]); // Run when relevant state changes

  // Also reset when user is authenticated (after successful signup)
  useEffect(() => {
    if (user) {
      setIdentifier("");
      setOtp("");
      setStep("input");
      setLoading(false);
      setSendingOTP(false);
      setCountdown(0);
    }
  }, [user]);

  const inputType = identifier ? detectInputType(identifier) : "email";

  const handleSendOTP = async () => {
    if (!identifier.trim()) {
      toast({
        title: "Input required",
        description: "Please enter your email or phone number",
        variant: "destructive",
      });
      return;
    }

    setSendingOTP(true);
    const type = inputType === "email" ? "email" : "sms";

    try {
      const { error } = await sendOTP(identifier.trim(), type, false); // false = isSignUp

      if (error) {
        toast({
          title: "Failed to send OTP",
          description: error.message || "Please try again",
          variant: "destructive",
        });
      } else {
        toast({
          title: "OTP sent!",
          description: `We've sent an OTP to your ${
            type === "email" ? "email" : "phone number"
          }`,
          variant: "default",
        });
        setStep("verify");
        setCountdown(60); // 60 second countdown
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error: any) {
      toast({
        title: "An error occurred",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSendingOTP(false);
    }
  };

  const handleVerifyAndSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim() || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const type = inputType === "email" ? "email" : "sms";

    try {
      const { error } = await signUpWithOTP(identifier.trim(), otp.trim());

      if (error) {
        if (
          error.code === "user_already_exists" ||
          error.message?.includes("already")
        ) {
          toast({
            title: "Account already exists",
            description: (
              <div className="space-y-2">
                <p>
                  You already have an account with this{" "}
                  {inputType === "email" ? "email" : "phone number"}.
                </p>
                <Button
                  variant="link"
                  className="p-0 h-auto text-brand-primary hover:text-brand-primary-dark"
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
            description: error.message || "Please try again",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Account created successfully!",
          description: "Welcome to bucketlistt!",
          variant: "default",
        });
        // Don't navigate - let AuthModal close and preserve current page
        // The booking data will be restored automatically by BookingDialog
      }
    } catch (error: any) {
      toast({
        title: "An error occurred",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-lg max-h-[90vh] overflow-y-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          {step === "input"
            ? "Enter your email or phone number to get started"
            : "Enter the OTP sent to your " +
              (inputType === "email" ? "email" : "phone number")}
        </CardDescription>
      </CardHeader>

      {step === "input" ? (
        <div className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="identifier">Email or Phone Number</Label>
            <Input
              id="identifier"
              type="text"
              placeholder="email@example.com or +91 9876543210"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendOTP();
                }
              }}
              required
            />
            <p className="text-xs text-gray-500">
              {inputType === "email"
                ? "We'll send an OTP to your email"
                : "We'll send an OTP to your phone number"}
            </p>
          </div>

          <Button
            type="button"
            className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white"
            onClick={handleSendOTP}
            disabled={sendingOTP || !identifier.trim()}
          >
            {sendingOTP && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send OTP
          </Button>
        </div>
      ) : (
        <form onSubmit={handleVerifyAndSignUp}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier-display">Email or Phone</Label>
              <Input
                id="identifier-display"
                type="text"
                value={identifier}
                disabled
                className="bg-gray-50 dark:bg-gray-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(value);
                }}
                maxLength={6}
                required
                className="text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-xs text-gray-500">
                Enter the 6-digit code sent to your{" "}
                {inputType === "email" ? "email" : "phone number"}
              </p>
            </div>

            {countdown > 0 && (
              <p className="text-sm text-gray-500 text-center">
                Resend OTP in {countdown} seconds
              </p>
            )}

            {countdown === 0 && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleSendOTP}
                disabled={sendingOTP}
              >
                {sendingOTP && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Resend OTP
              </Button>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white"
              disabled={loading || otp.length !== 6}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep("input");
                setOtp("");
                setCountdown(0);
              }}
            >
              Change {inputType === "email" ? "Email" : "Phone Number"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
              </span>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto font-normal text-brand-primary hover:text-brand-primary-dark"
                onClick={onToggleMode}
              >
                Sign in here
              </Button>
            </div>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
