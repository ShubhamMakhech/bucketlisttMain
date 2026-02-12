import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

/**
 * MarketingRouteGuard - Restricts marketing users to /bookings only.
 * Allowed routes: /bookings, and public routes (auth, email-confirmation, qrcode).
 * All other routes will redirect to /bookings.
 */
export function MarketingRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const { isMarketing, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || roleLoading) {
      return;
    }

    if (user && isMarketing) {
      const currentPath = location.pathname;
      const publicRoutes = ["/auth", "/email-confirmation", "/qrcode"];

      const isAllowedRoute =
        currentPath === "/bookings" || publicRoutes.includes(currentPath);

      if (!isAllowedRoute) {
        navigate("/bookings", { replace: true });
      }
    }
  }, [user, isMarketing, authLoading, roleLoading, location.pathname, navigate]);

  return <>{children}</>;
}
