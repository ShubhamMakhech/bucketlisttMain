// @ts-nocheck

import {
  Heart,
  LogOut,
  MessageSquare,
  Calendar,
  Gift,
  Settings,
  CreditCard,
  FileText,
  UserCircle,
  Bell,
  User,
  BookOpen,
  Star,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useFavorites } from "@/hooks/useFavorites";
import { FeedbackFish } from "@feedback-fish/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import { AuthModal } from "@/components/AuthModal";
import { EditProfileDialog } from "./EditProfileDialog";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isVendor, isAdmin } = useUserRole();
  const { role } = useUserRole();
  const { favoritesCount } = useFavorites();
  const { theme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);

  // Check if we're on the landing page
  const isLandingPage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      // Check if we're on mobile
      const isMobile = window.innerWidth < 768;

      // Only apply scroll effect on landing page
      if (!isLandingPage) {
        setIsScrolled(true); // Always dark on non-landing pages
        return;
      }

      // Mobile devices now follow the same scroll behavior as desktop

      // Header becomes opaque after scrolling just 100px
      const scrollThreshold = 50; // Trigger after 100px scroll

      setIsScrolled(window.scrollY > scrollThreshold);
    };

    // Initial check
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isLandingPage]);

  // Query for upcoming bookings
  const { data: nextBooking } = useQuery({
    queryKey: ["next-booking", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          experiences (
            title
          )
        `
        )
        .eq("user_id", user.id)
        .eq("status", "confirmed")
        .gte("booking_date", now)
        .order("booking_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const {
    data: userProfile,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getRoleDisplayName = (userRole: string | null) => {
    switch (userRole) {
      case "vendor":
        return "Vendor";
      case "agent":
        return "Agent";
      case "admin":
        return "Admin";
      case "customer":
      default:
        return "Traveler";
    }
  };

  // Get theme-aware background and text colors
  const getHeaderStyles = () => {
    if (!isScrolled) return "bg-transparent";

    const isMobile = window.innerWidth < 768;
    const backdropBlur = isMobile ? "backdrop-blur-xl" : "backdrop-blur-md";

    if (theme === "light") {
      return `bg-white/90 ${backdropBlur} border-b border-gray-200 text-gray-900`;
    } else {
      return `bg-black/80 ${backdropBlur} border-b border-gray-800 text-white`;
    }
  };

  const getButtonStyles = () => {
    if (!isScrolled) return "text-white hover:bg-white/20";

    if (theme === "light") {
      return "text-gray-900 hover:bg-gray-100/80";
    } else {
      return "text-white hover:bg-white/20";
    }
  };

  return (
    <>
      {/* Backdrop Blur Overlay */}
      {(isDesktopDropdownOpen || isMobileDropdownOpen) && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9997] animate-in fade-in duration-200" />
      )}

      <header
        className={`sticky top-0 left-0 right-0 z-[9998] w-full transition-all duration-300 ${getHeaderStyles()}`}
      >
        <div className="flex items-center justify-between  mx-auto relative navigationheight MaxWidthContainer" >
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center cursor-pointer"
            onClick={() => {
              // Mark that user has navigated within the app
              sessionStorage.setItem("hasNavigatedWithinApp", "true");
            }}
            id="LogoADjustContainer"
          >
            {/* First logo - shown by default */}
            <img
              src="https://prepseed.s3.ap-south-1.amazonaws.com/Bucketlistt+(1).png"
              alt="bucketlistt Logo"
              className={`transition-opacity duration-300 ${isScrolled ? "opacity-0 absolute" : "opacity-100"
                }`}
            />
            {/* Second logo - shown after scroll */}
            <img
              src="https://prepseed.s3.ap-south-1.amazonaws.com/Bucketlistt.png"
              alt="bucketlistt Logo"
              className={`transition-opacity duration-300 ${isScrolled ? "opacity-100" : "opacity-0 absolute"
                }`}
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Theme Toggle */}
            {/* <ThemeToggle variant="header" buttonStyles={getButtonStyles()} /> */}

            {/* Feedback Button - Hidden on mobile */}
            {/* <FeedbackFish
              projectId="ec45667732aaa6"
              userId={user?.email || undefined}
            >
              <Button
                variant="ghost"
                size="icon"
                className={`h-10 w-10 ${getButtonStyles()} transition-colors`}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            </FeedbackFish> */}

            {/* Favorites Button */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 ${getButtonStyles()} transition-colors relative`}
              onClick={() => navigate("/favorites")}
            >
              <Heart className="h-5 w-5" />
              {user && favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {favoritesCount > 9 ? "9+" : favoritesCount}
                </span>
              )}
            </Button>

            {/* Notification Bell - Desktop only */}
            {user && (
              <div className="relative group">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-10 w-10 ${getButtonStyles()} transition-colors relative`}
                >
                  <Bell className="h-5 w-5" />
                  {nextBooking && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      1
                    </span>
                  )}
                </Button>

                {/* Notification Dropdown on Hover */}
                {nextBooking && (
                  <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <Calendar className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="flex-1" style={{ textAlign: "left" }}>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            Upcoming Booking
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <strong>{nextBooking.experiences?.title}</strong>
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {format(
                              new Date(nextBooking.booking_date),
                              "MMM d, yyyy"
                            )}{" "}
                            - Don't forget!
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <Button
                          size="sm"
                          className="w-full bg-blue-500 ViewBookingButton"
                          onClick={() => navigate("/bookings")}
                        >
                          View All Bookings
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Dropdown or Sign In Button */}
            {user ? (
              <DropdownMenu onOpenChange={setIsDesktopDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`h-10 w-10 rounded-full ${getButtonStyles()}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.user_metadata?.avatar_url}
                        alt={user.email || ""}
                      />
                      <AvatarFallback className="bg-orange-500 text-white">
                        {getInitials(user.email || "")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 bg-background border border-border shadow-lg rounded-lg p-1.5"
                >
                  {/* User Info Section */}
                  <div className="flex items-center gap-2.5 p-2 mb-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.user_metadata?.avatar_url}
                        alt={user.email || ""}
                      />
                      <AvatarFallback
                        style={{ background: "#940fdb" }}
                        className="text-white font-semibold"
                      >
                        {getInitials(user.email || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getRoleDisplayName(role)}
                      </p>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="my-1" />

                  {/* Main Menu Items */}
                  <div>
                    <DropdownMenuItem
                      className="cursor-pointer rounded-md px-2.5 py-2 hover:bg-accent transition-colors group"
                      onClick={() => setShowEditProfile(true)}
                    >
                      {!isVendor && (
                        <div className="flex items-center gap-2.5 w-full">
                          <div
                            className="flex items-center justify-center w-7 h-7 rounded-md"
                            style={{ background: "#940fdb15" }}
                          >
                            <User
                              className="h-3.5 w-3.5"
                              style={{ color: "#940fdb" }}
                            />
                          </div>
                          <span className="text-sm">Profile</span>
                        </div>
                      )}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="cursor-pointer rounded-md px-2.5 py-2 hover:bg-accent transition-colors group"
                      onClick={() => navigate("/bookings")}
                    >
                      <div className="flex items-center gap-2.5 w-full">
                        <div
                          className="flex items-center justify-center w-7 h-7 rounded-md"
                          style={{ background: "#940fdb15" }}
                        >
                          <Calendar
                            className="h-3.5 w-3.5"
                            style={{ color: "#940fdb" }}
                          />
                        </div>
                        <span className="text-sm">Bookings</span>
                      </div>
                    </DropdownMenuItem>

                    {!isVendor && (
                      <DropdownMenuItem
                        className="cursor-pointer rounded-md px-2.5 py-2 hover:bg-accent transition-colors group"
                        onClick={() => navigate("/favorites")}
                      >
                        <div className="flex items-center gap-2.5 w-full">
                          <div
                            className="flex items-center justify-center w-7 h-7 rounded-md"
                            style={{ background: "#940fdb15" }}
                          >
                            <Heart
                              className="h-3.5 w-3.5"
                              style={{ color: "#940fdb" }}
                            />
                          </div>
                          <span className="text-sm">Wishlists</span>
                        </div>
                      </DropdownMenuItem>
                    )}

                    {!isVendor && (
                      <DropdownMenuItem
                        className="cursor-pointer rounded-md px-2.5 py-2 hover:bg-accent transition-colors group"
                        onClick={() => navigate("/coming-soon")}
                      >
                        <div className="flex items-center gap-2.5 w-full">
                          <div
                            className="flex items-center justify-center w-7 h-7 rounded-md"
                            style={{ background: "#940fdb15" }}
                          >
                            <Star
                              className="h-3.5 w-3.5"
                              style={{ color: "#940fdb" }}
                            />
                          </div>
                          <span className="text-sm">Reviews</span>
                        </div>
                      </DropdownMenuItem>
                    )}

                    {isAdmin && (
                      <>
                        <DropdownMenuItem
                          className="cursor-pointer rounded-md px-2.5 py-2 hover:bg-accent transition-colors group"
                          onClick={() => navigate("/users")}
                        >
                          <div className="flex items-center gap-2.5 w-full">
                            <div
                              className="flex items-center justify-center w-7 h-7 rounded-md"
                              style={{ background: "#940fdb15" }}
                            >
                              <Shield
                                className="h-3.5 w-3.5"
                                style={{ color: "#940fdb" }}
                              />
                            </div>
                            <span className="text-sm">Users</span>
                          </div>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="cursor-pointer rounded-md px-2.5 py-2 hover:bg-accent transition-colors group"
                          onClick={() => navigate("/profile")}
                        >
                          <div className="flex items-center gap-2.5 w-full">
                            <div
                              className="flex items-center justify-center w-7 h-7 rounded-md"
                              style={{ background: "#940fdb15" }}
                            >
                              <User
                                className="h-3.5 w-3.5"
                                style={{ color: "#940fdb" }}
                              />
                            </div>
                            <span className="text-sm">Go to profile</span>
                          </div>
                        </DropdownMenuItem>
                      </>
                    )}
                  </div>

                  <DropdownMenuSeparator className="my-1" />

                  {/* Logout */}
                  <DropdownMenuItem
                    className="cursor-pointer rounded-md px-2.5 py-2 hover:bg-accent transition-colors group"
                    onClick={handleSignOut}
                  >
                    <div className="flex items-center gap-2.5 w-full">
                      <div
                        className="flex items-center justify-center w-7 h-7 rounded-md"
                        style={{ background: "#940fdb15" }}
                      >
                        <LogOut
                          className="h-3.5 w-3.5"
                          style={{ color: "#940fdb" }}
                        />
                      </div>
                      <span className="text-sm" style={{ color: "#940fdb" }}>
                        Log out
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                style={{ background: "var(--brand-color)" }}
                onClick={() => setIsAuthModalOpen(true)}
              >
                Sign in
              </Button>
            )}
          </div>

          {/* Mobile Right Side */}
          <div className="flex md:hidden items-center space-x-1">
            {/* Theme Toggle - Mobile */}
            {/* <ThemeToggle variant="header" buttonStyles={getButtonStyles()} /> */}

            {/* Feedback Button - Mobile */}
            {/* <FeedbackFish
              projectId="ec45667732aaa6"
              userId={user?.email || undefined}
            >
              <Button
                variant="ghost"
                size="icon"
                className={`h-10 w-10 ${getButtonStyles()} transition-colors`}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            </FeedbackFish> */}

            {/* Favorites Button - Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 ${getButtonStyles()} transition-colors relative`}
              onClick={() => navigate("/favorites")}
            >
              <Heart className="h-5 w-5" />
              {user && favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {favoritesCount > 9 ? "9+" : favoritesCount}
                </span>
              )}
            </Button>

            {/* User Profile or Sign In - Mobile */}
            {user ? (
              <DropdownMenu onOpenChange={setIsMobileDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`h-10 w-10 rounded-full ${getButtonStyles()}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.user_metadata?.avatar_url}
                        alt={user.email || ""}
                      />
                      <AvatarFallback className="bg-orange-500 text-white">
                        {getInitials(user.email || "")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 bg-background border border-border shadow-lg rounded-lg p-1.5"
                >
                  {/* User Info Section */}
                  <div className="flex items-center gap-2.5 p-2 mb-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.user_metadata?.avatar_url}
                        alt={user.email || ""}
                      />
                      <AvatarFallback
                        style={{ background: "#940fdb" }}
                        className="text-white font-semibold"
                      >
                        {getInitials(user.email || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getRoleDisplayName(role)}
                      </p>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="my-1" />

                  {/* Mobile-specific: Notification item */}
                  {nextBooking && (
                    <>
                      <DropdownMenuItem
                        className="cursor-pointer rounded-md px-2.5 py-2 hover:bg-accent transition-colors"
                        onClick={() => navigate("/bookings")}
                      >
                        <Bell className="mr-2.5 h-4 w-4" />
                        <span className="text-sm flex-1">Upcoming Booking</span>
                        <span
                          style={{ background: "#940fdb" }}
                          className="text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold ml-auto"
                        >
                          1
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1" />
                    </>
                  )}

                  {/* Main Menu Items */}
                  <div>
                    {!isVendor && (
                      <DropdownMenuItem
                        className="cursor-pointer rounded-md px-2.5 py-2 hover:bg-accent transition-colors group"
                        onClick={() => setShowEditProfile(true)}
                      >
                        <div className="flex items-center gap-2.5 w-full">
                          <div
                            className="flex items-center justify-center w-7 h-7 rounded-md"
                            style={{ background: "#940fdb15" }}
                          >
                            <User
                              className="h-3.5 w-3.5"
                              style={{ color: "#940fdb" }}
                            />
                          </div>
                          <span className="text-sm">Profile</span>
                        </div>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                      className="cursor-pointer rounded-md px-2.5 py-2 hover:bg-accent transition-colors group"
                      onClick={() => navigate("/bookings")}
                    >
                      <div className="flex items-center gap-2.5 w-full">
                        <div
                          className="flex items-center justify-center w-7 h-7 rounded-md"
                          style={{ background: "#940fdb15" }}
                        >
                          <Calendar
                            className="h-3.5 w-3.5"
                            style={{ color: "#940fdb" }}
                          />
                        </div>
                        <span className="text-sm">Bookings</span>
                      </div>
                    </DropdownMenuItem>

                    {!isVendor && (
                      <DropdownMenuItem
                        className="cursor-pointer rounded-md px-2.5 py-2 hover:bg-accent transition-colors group"
                        onClick={() => navigate("/favorites")}
                      >
                        <div className="flex items-center gap-2.5 w-full">
                          <div
                            className="flex items-center justify-center w-7 h-7 rounded-md"
                            style={{ background: "#940fdb15" }}
                          >
                            <Heart
                              className="h-3.5 w-3.5"
                              style={{ color: "#940fdb" }}
                            />
                          </div>
                          <span className="text-sm">Wishlists</span>
                        </div>
                      </DropdownMenuItem>
                    )}

                    {!isVendor && (
                      <DropdownMenuItem
                        className="cursor-pointer rounded-md px-2.5 py-2 hover:bg-accent transition-colors group"
                        onClick={() => navigate("/coming-soon")}
                      >
                        <div className="flex items-center gap-2.5 w-full">
                          <div
                            className="flex items-center justify-center w-7 h-7 rounded-md"
                            style={{ background: "#940fdb15" }}
                          >
                            <Star
                              className="h-3.5 w-3.5"
                              style={{ color: "#940fdb" }}
                            />
                          </div>
                          <span className="text-sm">Reviews</span>
                        </div>
                      </DropdownMenuItem>
                    )}

                    {isAdmin && (
                      <>
                        <DropdownMenuItem
                          className="cursor-pointer rounded-md px-2.5 py-2 hover:bg-accent transition-colors group"
                          onClick={() => navigate("/users")}
                        >
                          <div className="flex items-center gap-2.5 w-full">
                            <div
                              className="flex items-center justify-center w-7 h-7 rounded-md"
                              style={{ background: "#940fdb15" }}
                            >
                              <Shield
                                className="h-3.5 w-3.5"
                                style={{ color: "#940fdb" }}
                              />
                            </div>
                            <span className="text-sm">Users</span>
                          </div>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="cursor-pointer rounded-md px-2.5 py-2 hover:bg-accent transition-colors group"
                          onClick={() => navigate("/profile")}
                        >
                          <div className="flex items-center gap-2.5 w-full">
                            <div
                              className="flex items-center justify-center w-7 h-7 rounded-md"
                              style={{ background: "#940fdb15" }}
                            >
                              <User
                                className="h-3.5 w-3.5"
                                style={{ color: "#940fdb" }}
                              />
                            </div>
                            <span className="text-sm">Go to profile</span>
                          </div>
                        </DropdownMenuItem>
                      </>
                    )}
                  </div>

                  <DropdownMenuSeparator className="my-1" />

                  {/* Logout */}
                  <DropdownMenuItem
                    className="cursor-pointer rounded-md px-2.5 py-2 hover:bg-accent transition-colors group"
                    onClick={handleSignOut}
                  >
                    <div className="flex items-center gap-2.5 w-full">
                      <div
                        className="flex items-center justify-center w-7 h-7 rounded-md"
                        style={{ background: "#940fdb15" }}
                      >
                        <LogOut
                          className="h-3.5 w-3.5"
                          style={{ color: "#940fdb" }}
                        />
                      </div>
                      <span className="text-sm" style={{ color: "#940fdb" }}>
                        Log out
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                {/* Existing Sign In Button - unchanged */}
                <Button
                  style={{
                    background: isScrolled ? "#940fdb" : "white",
                    color: isScrolled ? "white" : "black",
                    padding: "0px 10px",
                    height: "30px",
                  }}
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  Sign in
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <EditProfileDialog
        open={showEditProfile}
        onOpenChange={setShowEditProfile}
        userProfile={userProfile}
        onProfileUpdate={refetchProfile}
      />
    </>
  );
}
