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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SignInFormProps {
  onToggleMode: () => void;
  onResetMode?: () => void;
  onForgotPassword?: () => void;
}

export function SignInForm({
  onToggleMode,
  onResetMode,
  onForgotPassword,
}: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://bucketlistt.vercel.app/",
      },
    });
    // console.log(data);
    if (error) console.error(error.message);
  };
  return (
    <>
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle>Welcome to bucketlistt</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <div className="GoogleAndAppleButtonsSignInForm space-y-4">
          {/* Heading and Description */}
          {/* <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Continue with</h3>
            <p className="text-sm text-muted-foreground">
              Sign in quickly with your social accounts
            </p>
            <p className="text-xs text-muted-foreground">
              Secure and fast authentication
            </p>
          </div> */}

          {/* Social Sign-in Buttons */}
          <div className="space-y-3 GoogleAndAppleButtons">
            {/* Google Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 flex items-center justify-center space-x-3 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              onClick={() => {
                // TODO: Implement Google sign-in
                handleGoogleLogin();
                toast({
                  title: "Google Sign-in",
                  description: "Google authentication coming soon!",
                });
              }}
            >
              <img
                src="https://s3.ap-south-1.amazonaws.com/prepseed/prod/ldoc/media/GoogleIcon.png"
                alt=""
                style={{ width: "20px" }}
              />
              <span className="font-medium">Continue with Google</span>
            </Button>

            {/* Apple Button */}
            {/* <Button
              type="button"
              variant="outline"
              className="w-full h-12 flex items-center justify-center space-x-3 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              onClick={() => {
                // TODO: Implement Apple sign-in
                toast({
                  title: "Apple Sign-in",
                  description: "Apple authentication coming soon!",
                });
              }}
            >
              <img
                src="https://s3.ap-south-1.amazonaws.com/prepseed/prod/ldoc/media/AppleLog.png"
                alt=""
                style={{ width: "20px" }}
              />
              <span className="font-medium">Continue with Apple</span>
            </Button> */}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
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
                  className="p-0 h-auto font-normal text-sm text-orange-500 hover:text-orange-600"
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
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Welcome Back!
            </Button>
            <div className="text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
              </span>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto font-normal text-orange-500 hover:text-orange-600"
                onClick={onToggleMode}
              >
                Sign up here
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </>
  );
}
