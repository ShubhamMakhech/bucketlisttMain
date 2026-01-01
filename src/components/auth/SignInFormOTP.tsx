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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SignInFormOTPProps {
  onToggleMode: () => void;
  onResetMode?: () => void;
  onForgotPassword?: () => void;
}

// Helper function to detect if input is email or phone
function detectInputType(input: string): "email" | "phone" {
  if (input.includes("@") && input.includes(".")) {
    return "email";
  }
  const digitsOnly = input.replace(/\D/g, "");
  if (digitsOnly.length >= 10) {
    return "phone";
  }
  return "email";
}

export function SignInFormOTP({
  onToggleMode,
  onResetMode,
  onForgotPassword,
}: SignInFormOTPProps) {
  const [activeTab, setActiveTab] = useState<"otp" | "password">("otp");

  // OTP state
  const [otpIdentifier, setOtpIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState<"input" | "verify">("input");
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const { signIn, signInWithOTP, sendOTP } = useAuth();
  const { toast } = useToast();

  const otpInputType = otpIdentifier ? detectInputType(otpIdentifier) : "email";

  const handleSendOTP = async () => {
    if (!otpIdentifier.trim()) {
      toast({
        title: "Input required",
        description: "Please enter your email or phone number",
        variant: "destructive",
      });
      return;
    }

    setSendingOTP(true);
    const type = otpInputType === "email" ? "email" : "sms";

    try {
      const { error } = await sendOTP(otpIdentifier.trim(), type, true); // true = isSignIn

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
        setOtpStep("verify");
        setOtpCountdown(60);
        const timer = setInterval(() => {
          setOtpCountdown((prev) => {
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

  const handleOTPSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim() || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setVerifyingOTP(true);

    try {
      const { error } = await signInWithOTP(otpIdentifier.trim(), otp.trim());

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message || "Invalid OTP or user not found",
          variant: "destructive",
        });
      }
      // Success - user will be redirected by Auth.tsx
    } catch (error: any) {
      toast({
        title: "An error occurred",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setVerifyingOTP(false);
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      }
      // Success - user will be redirected by Auth.tsx
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    localStorage.setItem("loggedInPath", window.location.pathname);
    const redirectTo = `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });
    if (error) console.error(error.message);
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>Welcome to bucketlistt</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>

      {/* Google Sign-in Button */}
      <div className="px-6 pb-4">
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 flex items-center justify-center space-x-3 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          onClick={handleGoogleLogin}
        >
          <img
            src="https://s3.ap-south-1.amazonaws.com/prepseed/prod/ldoc/media/GoogleIcon.png"
            alt=""
            style={{ width: "20px" }}
          />
          <span className="font-medium">Continue with Google</span>
        </Button>
      </div>

      {/* Divider */}
      <div className="relative px-6 pb-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground font-medium">
            OR CONTINUE WITH
          </span>
        </div>
      </div>

      {/* Tabs for OTP and Password */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as "otp" | "password");
          setOtpStep("input");
          setOtp("");
          setOtpCountdown(0);
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mx-6 mb-4">
          <TabsTrigger value="otp">OTP</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>

        {/* OTP Sign-in Tab */}
        <TabsContent value="otp" className="space-y-4">
          {otpStep === "input" ? (
            <div className="space-y-4 px-6">
              <div className="space-y-2">
                <Label htmlFor="otp-identifier">Email or Phone Number</Label>
                <Input
                  id="otp-identifier"
                  type="text"
                  placeholder="email@example.com or +91 9876543210"
                  value={otpIdentifier}
                  onChange={(e) => setOtpIdentifier(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendOTP();
                    }
                  }}
                  required
                />
                <p className="text-xs text-gray-500">
                  {otpInputType === "email"
                    ? "We'll send an OTP to your email"
                    : "We'll send an OTP to your phone number"}
                </p>
              </div>

              <Button
                type="button"
                className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white"
                onClick={handleSendOTP}
                disabled={sendingOTP || !otpIdentifier.trim()}
              >
                {sendingOTP && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send OTP
              </Button>
            </div>
          ) : (
            <form onSubmit={handleOTPSignIn}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp-identifier-display">Email or Phone</Label>
                  <Input
                    id="otp-identifier-display"
                    type="text"
                    value={otpIdentifier}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp-input">Enter OTP</Label>
                  <Input
                    id="otp-input"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      setOtp(value);
                    }}
                    maxLength={6}
                    required
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                  <p className="text-xs text-gray-500">
                    Enter the 6-digit code sent to your{" "}
                    {otpInputType === "email" ? "email" : "phone number"}
                  </p>
                </div>

                {otpCountdown > 0 && (
                  <p className="text-sm text-gray-500 text-center">
                    Resend OTP in {otpCountdown} seconds
                  </p>
                )}

                {otpCountdown === 0 && (
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
                  disabled={verifyingOTP || otp.length !== 6}
                >
                  {verifyingOTP && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign In
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setOtpStep("input");
                    setOtp("");
                    setOtpCountdown(0);
                  }}
                >
                  Change {otpInputType === "email" ? "Email" : "Phone Number"}
                </Button>
              </CardFooter>
            </form>
          )}
        </TabsContent>

        {/* Password Sign-in Tab */}
        <TabsContent value="password">
          <form onSubmit={handlePasswordSignIn}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto font-normal text-sm text-brand-primary hover:text-brand-primary-dark"
                    onClick={() => onForgotPassword?.()}
                  >
                    Forgot password?
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white"
                disabled={passwordLoading}
              >
                {passwordLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Welcome Back!
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>

      <CardFooter className="flex flex-col space-y-4 pt-4">
        <div className="text-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
          </span>
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto font-normal text-brand-primary hover:text-brand-primary-dark"
            onClick={onToggleMode}
          >
            Sign up here
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
