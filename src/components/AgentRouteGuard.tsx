import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

/**
 * AgentRouteGuard - Restricts agent users to only /bookings route
 * Allowed routes: /bookings
 * All other routes will redirect to /bookings
 */
export function AgentRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isAgent, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth and role to load
    if (authLoading || roleLoading) {
      return;
    }

    // Only apply restrictions if user is logged in and is an agent
    if (user && isAgent) {
      const currentPath = location.pathname;

      // Public routes that agents can access
      const publicRoutes = ["/auth", "/email-confirmation", "/qrcode"];

      // Helper function to check if path is allowed
      const isAllowedRoute = (path: string): boolean => {
        // Only /bookings is allowed for agents
        if (path === "/bookings" || publicRoutes.includes(path)) {
          return true;
        }

        return false;
      };

      // Redirect if not an allowed route
      if (!isAllowedRoute(currentPath)) {
        navigate("/bookings", { replace: true });
      }
    }
  }, [user, isAgent, authLoading, roleLoading, location.pathname, navigate]);

  // Always render children - the redirect will happen via useEffect
  return <>{children}</>;
}

