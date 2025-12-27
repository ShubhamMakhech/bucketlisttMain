import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

/**
 * VendorRouteGuard - Restricts vendor users to specific routes
 * Allowed routes: /bookings, /experience, /experience/*, /vendor/experiences, /edit-experience/*
 * All other routes will redirect to /bookings
 */
export function VendorRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isVendor, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth and role to load
    if (authLoading || roleLoading) {
      return;
    }

    // Only apply restrictions if user is logged in and is a vendor
    if (user && isVendor) {
      const currentPath = location.pathname;

      // Public routes that vendors can access
      const publicRoutes = ["/auth", "/email-confirmation", "/qrcode"];

      // Helper function to check if path is allowed
      const isAllowedRoute = (path: string): boolean => {
        // Exact matches
        if (
          path === "/bookings" ||
          path === "/experience" ||
          path === "/vendor/experiences" ||
          publicRoutes.includes(path)
        ) {
          return true;
        }

        // Pattern matches - routes starting with these prefixes
        if (
          path.startsWith("/experience/") ||
          path.startsWith("/edit-experience/")
        ) {
          return true;
        }

        return false;
      };

      // Redirect if not an allowed route
      if (!isAllowedRoute(currentPath)) {
        navigate("/bookings", { replace: true });
      }
    }
  }, [user, isVendor, authLoading, roleLoading, location.pathname, navigate]);

  // Always render children - the redirect will happen via useEffect
  return <>{children}</>;
}
