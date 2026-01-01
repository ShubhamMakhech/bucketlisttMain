import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithOTP: (identifier: string, otp: string) => Promise<{ error: any }>;
  signUp: (data: SignUpData) => Promise<{ error: any }>;
  signUpWithOTP: (
    identifier: string,
    otp: string,
    role?: "customer" | "vendor" | "agent"
  ) => Promise<{ error: any }>;
  sendOTP: (
    identifier: string,
    type: "email" | "sms",
    isSignIn?: boolean
  ) => Promise<{ error: any; success?: boolean }>;
  verifyOTP: (
    identifier: string,
    otp: string,
    type: "email" | "sms"
  ) => Promise<{ error: any; success?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: "customer" | "vendor" | "agent";
  termsAccepted: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle password recovery
      if (event === "PASSWORD_RECOVERY") {
        console.log("Password recovery event detected");
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const sendOTP = async (
    identifier: string,
    type: "email" | "sms",
    isSignIn: boolean = false
  ) => {
    try {
      // Format phone number - add 91 if not present
      let formattedIdentifier = identifier;
      if (type === "sms") {
        formattedIdentifier = identifier.replace(/\D/g, "");
        if (!formattedIdentifier.startsWith("91")) {
          formattedIdentifier = "91" + formattedIdentifier;
        }
      }

      // For signin, check if user exists in profiles first
      if (isSignIn) {
        if (type === "email") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("email", identifier)
            .single();

          if (!profile) {
            return {
              error: {
                message:
                  "No account found with this email. Please sign up first.",
              },
            };
          }
        } else {
          const { data: profile } = await supabase
            .from("profiles")
            .select("phone_number")
            .eq("phone_number", formattedIdentifier)
            .single();

          if (!profile) {
            return {
              error: {
                message:
                  "No account found with this phone number. Please sign up first.",
              },
            };
          }
        }
      }

      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: {
          [type === "email" ? "email" : "phoneNumber"]: formattedIdentifier,
          type,
        },
      });

      if (error) {
        return { error: { message: error.message || "Failed to send OTP" } };
      }

      return { success: true, error: null };
    } catch (error: any) {
      return { error: { message: error.message || "Failed to send OTP" } };
    }
  };

  const verifyOTP = async (
    identifier: string,
    otp: string,
    type: "email" | "sms"
  ) => {
    try {
      // Format phone number for verification if SMS
      let formattedIdentifier = identifier;
      if (type === "sms") {
        formattedIdentifier = identifier.replace(/\D/g, "");
        if (!formattedIdentifier.startsWith("91")) {
          formattedIdentifier = "91" + formattedIdentifier;
        }
      }

      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: {
          identifier: formattedIdentifier,
          otp,
          type,
        },
      });

      if (error) {
        return { error: { message: error.message || "Failed to verify OTP" } };
      }

      if (!data?.success) {
        return {
          error: { message: data?.error || "Invalid or expired OTP" },
        };
      }

      return { success: true, error: null };
    } catch (error: any) {
      return { error: { message: error.message || "Failed to verify OTP" } };
    }
  };

  const signUpWithOTP = async (
    identifier: string,
    otp: string,
    role: "customer" | "vendor" | "agent" = "customer"
  ) => {
    // Format identifier for phone numbers
    const isEmail = identifier.includes("@");
    const otpType = isEmail ? "email" : "sms";
    let formattedIdentifier = identifier;

    if (!isEmail) {
      formattedIdentifier = identifier.replace(/\D/g, "");
      if (!formattedIdentifier.startsWith("91")) {
        formattedIdentifier = "91" + formattedIdentifier;
      }
    }

    // Verify OTP first
    const { error: verifyError } = await verifyOTP(
      formattedIdentifier,
      otp,
      otpType
    );
    if (verifyError) {
      return { error: verifyError };
    }

    // Check if user already exists in profiles (not auth.users)
    try {
      const { data: checkResult, error: checkError } =
        await supabase.functions.invoke("check-user-exists", {
          body: {
            email: isEmail ? identifier : undefined,
            phoneNumber: !isEmail ? formattedIdentifier : undefined,
          },
        });

      if (checkError) {
        return {
          error: {
            message: "Failed to validate identifier. Please try again.",
          },
        };
      }

      if (checkResult?.userExists) {
        return {
          error: {
            message: "User already registered",
            code: "user_already_exists",
          },
        };
      }
    } catch (error) {
      return {
        error: { message: "Failed to validate identifier. Please try again." },
      };
    }

    // Create user account via edge function to handle both email and phone
    try {
      const { data, error: signUpError } = await supabase.functions.invoke(
        "signup-with-otp",
        {
          body: {
            identifier: formattedIdentifier, // Use formatted identifier
            otp,
            type: otpType,
            role,
          },
        }
      );

      if (signUpError) {
        return { error: signUpError };
      }

      if (!data?.success) {
        return {
          error: { message: data?.error || "Failed to create account" },
        };
      }

      // If we got a session, set it
      if (data.sessionLink) {
        const url = new URL(data.sessionLink);
        const accessToken = url.searchParams.get("access_token");
        const refreshToken = url.searchParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            return { error: sessionError };
          }
        }
      }

      return { error: null };
    } catch (error: any) {
      return {
        error: { message: error.message || "Failed to create account" },
      };
    }
  };

  const signInWithOTP = async (identifier: string, otp: string) => {
    // Format identifier for phone numbers
    const isEmail = identifier.includes("@");
    const otpType = isEmail ? "email" : "sms";
    let formattedIdentifier = identifier;

    if (!isEmail) {
      formattedIdentifier = identifier.replace(/\D/g, "");
      if (!formattedIdentifier.startsWith("91")) {
        formattedIdentifier = "91" + formattedIdentifier;
      }
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        "signin-with-otp",
        {
          body: {
            identifier: formattedIdentifier, // Use formatted identifier
            otp,
            type: otpType,
          },
        }
      );

      if (error) {
        return {
          error: { message: error.message || "Failed to sign in with OTP" },
        };
      }

      if (!data?.success) {
        return {
          error: { message: data?.error || "Invalid OTP or user not found" },
        };
      }

      // If we got a session link, extract tokens and set session
      if (data.sessionLink) {
        // Parse the session link to extract tokens
        const url = new URL(data.sessionLink);
        const accessToken = url.searchParams.get("access_token");
        const refreshToken = url.searchParams.get("refresh_token");

        if (accessToken && refreshToken) {
          // Set the session
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            return { error: sessionError };
          }
        }
      }

      return { error: null };
    } catch (error: any) {
      return {
        error: { message: error.message || "Failed to sign in with OTP" },
      };
    }
  };

  const signUp = async (data: SignUpData) => {
    // Check if user already exists using secure Edge Function
    try {
      const { data: checkResult, error: checkError } =
        await supabase.functions.invoke("check-user-exists", {
          body: { email: data.email.trim() },
        });

      if (checkError) {
        return {
          error: { message: "Failed to validate email. Please try again." },
        };
      }

      if (checkResult?.userExists) {
        return {
          error: {
            message: "User already registered",
            code: "user_already_exists",
          },
        };
      }
    } catch (error) {
      return {
        error: { message: "Failed to validate email. Please try again." },
      };
    }

    const redirectUrl = `https://www.bucketlistt.com/auth`;

    // Create user without email verification requirement
    // Note: This method is kept for backward compatibility (VendorSignUpForm)
    // New signups should use signUpWithOTP instead
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          phone_number: data.phoneNumber,
          role: data.role,
          terms_accepted: data.termsAccepted,
        },
      },
    });

    // Note: Email confirmation is disabled in Supabase settings
    // Users are auto-confirmed via email_confirm: true in edge functions

    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setSession(null);
      setUser(null);
      setLoading(false);
      // Force removal of supabase keys from local storage to prevent auto-login on refresh
      // in case the supabase.auth.signOut() call failed to clean up
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
          localStorage.removeItem(key);
        }
      });
    }
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `https://www.bucketlistt.com/auth?mode=reset`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signInWithOTP,
        signUp,
        signUpWithOTP,
        sendOTP,
        verifyOTP,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
