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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SignInFormOTPProps {
  onToggleMode: () => void;
  onResetMode?: () => void;
  onForgotPassword?: () => void;
  prefilledPhoneNumber?: string;
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
  prefilledPhoneNumber,
}: SignInFormOTPProps) {
  const [activeTab, setActiveTab] = useState<"otp" | "password">("otp");

  // OTP state
  const [otpIdentifier, setOtpIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [otpStep, setOtpStep] = useState<"input" | "verify">("input");
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const { signIn, signInWithOTP, sendOTP, user } = useAuth();
  const { toast } = useToast();
  const hasAutoSentRef = useRef(false);
  const formattedPhoneRef = useRef<string | null>(null);

  // Initialize identifier with prefilled phone number if provided
  useEffect(() => {
    if (prefilledPhoneNumber) {
      // Format phone number: remove non-digits, add 91 if needed
      let formattedPhone = prefilledPhoneNumber.replace(/\D/g, "");
      if (!formattedPhone.startsWith("91") && formattedPhone.length === 10) {
        formattedPhone = "91" + formattedPhone;
      }
      formattedPhoneRef.current = formattedPhone;
      // Use requestAnimationFrame to ensure state update happens
      requestAnimationFrame(() => {
        setOtpIdentifier(formattedPhone);
      });
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
      formattedPhoneRef.current = formattedPhone;
      // Use requestAnimationFrame to ensure state update happens after current render
      requestAnimationFrame(() => {
        setOtpIdentifier(formattedPhone);
      });
    } else {
      // Clear identifier if no prefilled phone
      setOtpIdentifier("");
    }
    setOtp("");
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpStep("input");
    setSendingOTP(false);
    setVerifyingOTP(false);
    setOtpCountdown(0);
    setOtpError(null);
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setPasswordLoading(false);
    setActiveTab("otp");
  }, [prefilledPhoneNumber]); // Run when prefilledPhoneNumber changes

  // Separate effect to fix missing identifier (runs when prefilledPhoneNumber changes)
  useEffect(() => {
    // Safeguard: If we have a prefilled phone but identifier is empty, set it
    if (prefilledPhoneNumber && !otpIdentifier && prefilledPhoneNumber.trim()) {
      let formattedPhone = prefilledPhoneNumber.replace(/\D/g, "");
      if (!formattedPhone.startsWith("91") && formattedPhone.length === 10) {
        formattedPhone = "91" + formattedPhone;
      }
      formattedPhoneRef.current = formattedPhone;
      // Force update using requestAnimationFrame to ensure it happens after render
      requestAnimationFrame(() => {
        setOtpIdentifier(formattedPhone);
      });
    }
  }, [prefilledPhoneNumber, otpIdentifier]);

  // Auto-send OTP if phone number is prefilled (runs after identifier is set)
  useEffect(() => {
    // Use ref value if state is not yet updated
    const currentIdentifier = otpIdentifier || formattedPhoneRef.current || "";

    // Wait a bit for state to settle after setting identifier
    if (
      prefilledPhoneNumber &&
      currentIdentifier &&
      otpStep === "input" &&
      !sendingOTP &&
      otpCountdown === 0 &&
      !hasAutoSentRef.current
    ) {
      // Check if it's a phone number (not email)
      if (!currentIdentifier.includes("@")) {
        hasAutoSentRef.current = true;
        // Small delay to ensure component is fully mounted and state is settled
        const timer = setTimeout(() => {
          // Ensure identifier is set in state before sending
          if (!otpIdentifier && formattedPhoneRef.current) {
            setOtpIdentifier(formattedPhoneRef.current);
          }
          handleSendOTP();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledPhoneNumber, otpIdentifier, otpStep, sendingOTP, otpCountdown]); // Run when relevant state changes

  // Also reset when user is not authenticated (logged out)
  useEffect(() => {
    if (!user) {
      setOtpIdentifier("");
      setOtp("");
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpStep("input");
      setSendingOTP(false);
      setVerifyingOTP(false);
      setOtpCountdown(0);
      setOtpError(null);
      setEmail("");
      setPassword("");
      setShowPassword(false);
      setPasswordLoading(false);
      setActiveTab("otp");
    }
  }, [user]);

  // Reset OTP step when switching tabs
  useEffect(() => {
    setOtpStep("input");
    setOtp("");
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError(null);
    // Don't clear identifier when switching tabs if we have a prefilled phone
    if (!prefilledPhoneNumber) {
      setOtpIdentifier("");
    }
    setOtpCountdown(0);
  }, [activeTab, prefilledPhoneNumber]);

  // Sync otp with otpDigits
  useEffect(() => {
    setOtp(otpDigits.join(""));
  }, [otpDigits]);

  const otpInputType = otpIdentifier ? detectInputType(otpIdentifier) : "email";

  const handleSendOTP = async () => {
    if (!otpIdentifier.trim()) {
      setOtpError("Please enter your email or phone number");
      toast({
        title: "Input required",
        description: "Please enter your email or phone number",
        variant: "destructive",
      });
      return;
    }

    setOtpError(null);
    setSendingOTP(true);
    const type = otpInputType === "email" ? "email" : "sms";

    try {
      const { error } = await sendOTP(otpIdentifier.trim(), type, true); // true = isSignIn

      if (error) {
        setOtpError(error.message || "Failed to send OTP. Please try again.");
        toast({
          title: "Failed to send OTP",
          description: error.message || "Please try again",
          variant: "destructive",
        });
      } else {
        setOtpError(null);
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
      setOtpError(
        error.message || "An error occurred. Please try again later."
      );
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
    <Card className="w-full  shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Welcome to bucketlistt</CardTitle>
        <CardDescription className="text-sm">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>

      {/* Google Sign-in Button */}
      <div className="px-6 pb-3">
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
      <div className="flex items-center px-6 pb-3">
        <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
        <span className="px-2 text-xs uppercase text-muted-foreground font-medium bg-background">
          OR
        </span>
        <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
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
        <TabsList className="grid grid-cols-2 mx-6 mb-2">
          <TabsTrigger value="otp">OTP</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>

        {/* OTP Sign-in Tab */}
        <TabsContent value="otp" className="space-y-4">
          {otpStep === "input" ? (
            <div className="space-y-2 px-6">
              <div className="space-y-2">
                <Label htmlFor="otp-identifier">Email or Phone Number</Label>
                <Input
                  id="otp-identifier"
                  type="text"
                  placeholder=""
                  value={otpIdentifier || formattedPhoneRef.current || ""}
                  onChange={(e) => {
                    setOtpIdentifier(e.target.value);
                    formattedPhoneRef.current = e.target.value;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendOTP();
                    }
                  }}
                  required
                />
                {otpError && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {otpError}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {otpInputType === "email"
                    ? "We'll send an OTP to your email"
                    : "We'll send an OTP to your phone number"}
                </p>
              </div>

              <Button
                type="button"
                className="w-full text-white" style={{color:"white",background:"var(--brand-color)"}}
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
              <CardContent className="pb-1 space-y-2">
                <div className="flex flex-col gap-2">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="otp-identifier-display">
                      Email or Phone
                    </Label>
                    <Input
                      id="otp-identifier-display"
                      type="text"
                      value={otpIdentifier}
                      disabled
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <Label htmlFor="otp-input">Enter OTP</Label>
                    <div className="flex gap-2 justify-center">
                      {otpDigits.map((digit, index) => (
                        <Input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          value={digit}
                          onChange={(e) => {
                            const value = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 1);
                            const newDigits = [...otpDigits];
                            newDigits[index] = value;
                            setOtpDigits(newDigits);
                            if (value && index < 5) {
                              const nextInput = document.getElementById(
                                `otp-${index + 1}`
                              );
                              nextInput?.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace" && !digit && index > 0) {
                              const prevInput = document.getElementById(
                                `otp-${index - 1}`
                              );
                              prevInput?.focus();
                            }
                          }}
                          className="h-8 md:h-10 text-center text-lg md:text-xl font-mono"
                          maxLength={1}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Enter the 6-digit code sent to your{" "}
                      {otpInputType === "email" ? "email" : "phone number"}
                    </p>
                  </div>
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

              <CardFooter className="flex flex-col  pb-0">
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
                <br />
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-sm p-0 h-auto"
                  onClick={() => {
                    setOtpStep("input");
                    setOtp("");
                    setOtpDigits(["", "", "", "", "", ""]);
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
            <CardContent className="space-y-2">
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
                    className="p-0 h-auto font-normal text-sm "
                    style={{color:"var(--brand-color)"}}
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
            <CardFooter className="flex flex-col space-y-2">
              <Button
                type="submit"
                className="w-full text-white"
                style={{color:"white",backgroundColor:"var(--brand-color)"}}
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

      <CardFooter className="flex flex-col space-y-2 pt-4">
        <div className="text-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
          </span>
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto font-normal" style={{color:"var(--brand-color)"}}
            onClick={onToggleMode}
          >
            Sign up here
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
