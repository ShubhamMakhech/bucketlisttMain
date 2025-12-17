import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const QRCodeRedirect = () => {
  const navigate = useNavigate();
  const hasTracked = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (hasTracked.current) {
      return;
    }

    const trackQRRedirect = async () => {
      try {
        console.log("Tracking QR code redirect...");
        hasTracked.current = true;

        // Call the edge function to increment the count
        const { data, error } = await supabase.functions.invoke(
          "increment-qr-redirect"
        );

        if (error) {
          console.error("Error tracking QR redirect:", error);
        } else {
          console.log("QR redirect tracked successfully:", data);
        }
      } catch (error) {
        console.error("Failed to track QR redirect:", error);
      }

      // Redirect to home page after tracking
      navigate("/", { replace: true });
    };

    // Track the redirect and then navigate
    trackQRRedirect();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">
          Redirecting you to our homepage...
        </p>
      </div>
    </div>
  );
};

export default QRCodeRedirect;
