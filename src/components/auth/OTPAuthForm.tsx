import React, { useState } from "react";
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
import { Loader2, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OTPAuthFormProps {
  onToggleMode?: () => void;
}

export function OTPAuthForm({ onToggleMode }: OTPAuthFormProps) {
  const [step, setStep] = useState<"input" | "verify">("input");
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate identifier
      if (authMethod === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (authMethod === "phone" && !/^\+?[1-9]\d{1,14}$/.test(identifier.replace(/\s/g, ""))) {
        toast({
          title: "Invalid phone number",
          description: "Please enter a valid phone number",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: {
          identifier: identifier.trim(),
          authMethod,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "OTP sent!",
        description: `We've sent an OTP to your ${authMethod === "email" ? "email" : "phone number"}`,
        variant: "default",
      });

      setStep("verify");
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!otp || otp.length !== 6) {
        toast({
          title: "Invalid OTP",
          description: "Please enter a 6-digit OTP",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: {
          identifier: identifier.trim(),
          otp,
          authMethod,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.isNewUser) {
        toast({
          title: "Account created!",
          description: "Welcome to bucketlistt!",
          variant: "default",
        });
      } else {
        toast({
          title: "Signed in successfully!",
          description: "Welcome back!",
          variant: "default",
        });
      }

      // If magic link is provided, redirect to it for automatic sign-in
      if (data?.magicLink) {
        window.location.href = data.magicLink;
      } else {
        // Fallback: refresh the page
        window.location.reload();
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: {
          identifier: identifier.trim(),
          authMethod,
        },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error.message);
      }

      toast({
        title: "OTP resent!",
        description: "Please check your " + (authMethod === "email" ? "email" : "phone"),
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Failed to resend OTP",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === "input") {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle>Welcome to bucketlistt</CardTitle>
          <CardDescription>
            Sign in or create an account with OTP
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSendOTP}>
          <CardContent className="space-y-4">
            {/* Auth Method Selection */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={authMethod === "email" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setAuthMethod("email")}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
              <Button
                type="button"
                variant={authMethod === "phone" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setAuthMethod("phone")}
              >
                <Phone className="mr-2 h-4 w-4" />
                Phone
              </Button>
            </div>

            {/* Identifier Input */}
            <div className="space-y-2">
              <Label htmlFor="identifier">
                {authMethod === "email" ? "Email" : "Phone Number"}
              </Label>
              <Input
                id="identifier"
                type={authMethod === "email" ? "email" : "tel"}
                placeholder={
                  authMethod === "email"
                    ? "email@example.com"
                    : "+91 9876543210"
                }
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send OTP
            </Button>
            {onToggleMode && (
              <div className="text-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Prefer password?{" "}
                </span>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto font-normal text-orange-500 hover:text-orange-600"
                  onClick={onToggleMode}
                >
                  Sign in with password
                </Button>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>Enter OTP</CardTitle>
        <CardDescription>
          We've sent a 6-digit code to your {authMethod === "email" ? "email" : "phone"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleVerifyOTP}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">OTP Code</Label>
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
              Enter the 6-digit code sent to {identifier}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600"
            disabled={loading || otp.length !== 6}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify & Continue
          </Button>
          <div className="flex justify-between items-center w-full text-sm">
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto font-normal text-orange-500 hover:text-orange-600"
              onClick={() => setStep("input")}
            >
              ← Change {authMethod === "email" ? "email" : "phone"}
            </Button>
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto font-normal text-orange-500 hover:text-orange-600"
              onClick={handleResendOTP}
              disabled={loading}
            >
              Resend OTP
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

