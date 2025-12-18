import { VendorCalendar } from "@/components/VendorCalendar";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const VendorCalendarPage = () => {
  const { user, loading } = useAuth();
  const { isVendor, isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!roleLoading && user && !isVendor) {
      navigate("/profile");
    }
  }, [roleLoading, user, isVendor, navigate]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="w-full px-3 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <Button
            variant="outline"
            onClick={() => navigate("/profile")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="text-right">
            <div className="text-lg sm:text-xl font-semibold">
              Vendor Calendar
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              Weekly booking overview
            </div>
          </div>
        </div>

        <VendorCalendar />
      </div>
    </div>
  );
};

export default VendorCalendarPage;


