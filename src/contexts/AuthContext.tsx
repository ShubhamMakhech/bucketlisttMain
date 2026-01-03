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

      // For signin, check if user exists using the check-user-exists edge function
      // This bypasses RLS and uses the same logic that works
      if (isSignIn) {
        try {
          const { data: checkResult, error: checkError } =
            await supabase.functions.invoke("check-user-exists", {
              body: {
                email: type === "email" ? identifier : undefined,
                phoneNumber: type === "sms" ? formattedIdentifier : undefined,
              },
            });

          if (checkError) {
            return {
              error: {
                message: "Failed to validate identifier. Please try again.",
              },
            };
          }

          if (!checkResult?.userExists) {
            return {
              error: {
                message:
                  type === "email"
                    ? "No account found with this email. Please sign up first."
                    : "No account found with this phone number. Please sign up first.",
              },
            };
          }
        } catch (error: any) {
          return {
            error: {
              message: "Failed to validate identifier. Please try again.",
            },
          };
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

    // Don't verify OTP here - let the edge function handle verification
    // This prevents the OTP from being marked as verified before signup completes

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

      // If we got a session link with token, use it to sign in (same as signInWithOTP)
      if (data.sessionLink && data.token) {
        try {
          // Parse the magic link URL to get the token and type
          const url = new URL(data.sessionLink);
          const token = url.searchParams.get("token") || data.token;
          const type = url.searchParams.get("type") || "magiclink";
          const email = data.user?.email;

          if (token && email) {
            // For magiclink type, use verifyOtp with email and token
            const { data: verifyData, error: verifyError } =
              await supabase.auth.verifyOtp({
                email: email,
                token: token,
                type: "magiclink",
              });

            if (verifyError) {
              console.error("Error verifying token with email:", verifyError);
              // Try with token_hash as fallback
              const { error: tokenHashError } = await supabase.auth.verifyOtp({
                token_hash: token,
                type: "magiclink",
              });

              if (tokenHashError) {
                console.error(
                  "Error verifying token with token_hash:",
                  tokenHashError
                );
                // Last resort: the session might be set automatically via the auth state listener
                // when Supabase processes the magic link in the background
                return { error: null };
              }
            }

            // Session should be set automatically after verifyOtp succeeds
            // The auth state listener will pick up the session change
            return { error: null };
          } else {
            console.warn("Missing token or email for session creation");
            return { error: null }; // Let auth state listener handle it
          }
        } catch (error: any) {
          console.error("Error in session creation:", error);
          // Return success anyway - the auth state listener might pick up the session
          return { error: null };
        }
      } else if (data.sessionLink) {
        // Fallback: if no token, try to extract from URL or let auth listener handle it
        try {
          const url = new URL(data.sessionLink);
          const token = url.searchParams.get("token");
          const email = data.user?.email;

          if (token && email) {
            const { error: verifyError } = await supabase.auth.verifyOtp({
              email: email,
              token: token,
              type: "magiclink",
            });

            if (verifyError) {
              console.error("Error verifying token (fallback):", verifyError);
            }
          }
        } catch (error) {
          console.error("Error parsing session link:", error);
        }
        return { error: null };
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

      // If we got a session link with token, use it to sign in
      if (data.sessionLink && data.token) {
        try {
          // Parse the magic link URL to get the token and type
          const url = new URL(data.sessionLink);
          const token = url.searchParams.get("token") || data.token;
          const type = url.searchParams.get("type") || "magiclink";
          const email = data.user?.email;

          if (token && email) {
            // For magiclink type, use verifyOtp with email and token
            const { data: verifyData, error: verifyError } =
              await supabase.auth.verifyOtp({
                email: email,
                token: token,
                type: "magiclink",
              });

            if (verifyError) {
              console.error("Error verifying token with email:", verifyError);
              // Try with token_hash as fallback
              const { error: tokenHashError } = await supabase.auth.verifyOtp({
                token_hash: token,
                type: "magiclink",
              });

              if (tokenHashError) {
                console.error(
                  "Error verifying token with token_hash:",
                  tokenHashError
                );
                // Last resort: the session might be set automatically via the auth state listener
                // when Supabase processes the magic link in the background
                return { error: null };
              }
            }

            // Session should be set automatically after verifyOtp succeeds
            // The auth state listener will pick up the session change
            return { error: null };
          } else {
            console.warn("Missing token or email for session creation");
            return { error: null }; // Let auth state listener handle it
          }
        } catch (error: any) {
          console.error("Error in session creation:", error);
          // Return success anyway - the auth state listener might pick up the session
          return { error: null };
        }
      } else if (data.sessionLink) {
        // Fallback: if no token, try to extract from URL or let auth listener handle it
        try {
          const url = new URL(data.sessionLink);
          const token = url.searchParams.get("token");
          const email = data.user?.email;

          if (token && email) {
            const { error: verifyError } = await supabase.auth.verifyOtp({
              email: email,
              token: token,
              type: "magiclink",
            });

            if (verifyError) {
              console.error("Error verifying token (fallback):", verifyError);
            }
          }
        } catch (error) {
          console.error("Error parsing session link:", error);
        }
        return { error: null };
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
