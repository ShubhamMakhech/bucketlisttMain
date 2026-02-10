// @ts-nocheck

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
  Activity,
  Waves,
  Wind,
  CircleDot,
  Zap,
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
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { MapPin, Compass } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import { AuthModal } from "@/components/AuthModal";
import { EditProfileDialog } from "./EditProfileDialog";

const TYPEWRITER_PHRASES = [
  "Explore the Himalaya",
  "Search for experiences and cities...",
  "Find your next adventure",
];

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
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchDropdownPosition, setSearchDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [typewriterPhraseIndex, setTypewriterPhraseIndex] = useState(0);
  const [typewriterVisibleLength, setTypewriterVisibleLength] = useState(0);
  const [typewriterIsDeleting, setTypewriterIsDeleting] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement | null>(null);

  // Check if we're on the landing page
  const isLandingPage = location.pathname === "/";

  // Typewriter placeholder effect (only when search is empty and not focused)
  useEffect(() => {
    if (searchFocused || searchQuery) return;
    const phrase = TYPEWRITER_PHRASES[typewriterPhraseIndex];
    const tick = () => {
      if (typewriterIsDeleting) {
        setTypewriterVisibleLength((prev) => {
          if (prev <= 0) {
            setTypewriterIsDeleting(false);
            setTypewriterPhraseIndex((i) => (i + 1) % TYPEWRITER_PHRASES.length);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setTypewriterVisibleLength((prev) => {
          if (prev >= phrase.length) {
            setTypewriterIsDeleting(true);
            return prev;
          }
          return prev + 1;
        });
      }
    };
    const id = setInterval(tick, typewriterIsDeleting ? 40 : 80);
    return () => clearInterval(id);
  }, [typewriterPhraseIndex, typewriterVisibleLength, typewriterIsDeleting, searchFocused, searchQuery]);

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
        `,
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

  const { data: searchSuggestions, isLoading: searchSuggestionsLoading } = useQuery({
    queryKey: ["search-suggestions", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.length < 2)
        return { destinations: [], experiences: [] };
      const [destinationsResponse, experiencesResponse] = await Promise.all([
        supabase
          .from("destinations")
          .select("id, title, subtitle")
          .or(`title.ilike.%${searchQuery}%,subtitle.ilike.%${searchQuery}%`)
          .limit(3),
        supabase
          .from("experiences")
          .select("id, title, category, location")
          .eq("is_active", true)
          .or(
            `title.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`
          )
          .limit(3),
      ]);
      return {
        destinations: destinationsResponse.data || [],
        experiences: experiencesResponse.data || [],
      };
    },
    enabled: searchQuery.length >= 2,
  });

  const hasSearchResults =
    searchSuggestions &&
    (searchSuggestions.destinations.length > 0 ||
      searchSuggestions.experiences.length > 0);

  useEffect(() => {
    if (!showSearchDropdown) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node) &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    };
    const updatePosition = () => {
      if (searchContainerRef.current) {
        const rect = searchContainerRef.current.getBoundingClientRect();
        setSearchDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width,
        });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [showSearchDropdown]);

  const handleSearch = (value: string) => {
    if (value && value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value.trim())}`);
      setShowSearchDropdown(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    const shouldShow = value.length >= 2;
    setShowSearchDropdown(shouldShow);
    if (shouldShow && searchContainerRef.current) {
      const rect = searchContainerRef.current.getBoundingClientRect();
      setSearchDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  const handleSearchSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSearchDropdown(false);
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
  };

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

  const headerCategories = [
    { label: "BUNGEE", q: "bungee", Icon: Activity },
    { label: "RAFTING", q: "rafting", Icon: Waves },
    { label: "PARAGLIDING", q: "paragliding", Icon: Wind },
    { label: "HOT AIR BALLON", q: "hot air balloon", Icon: CircleDot },
    { label: "ZIP LINING", q: "zip lining", Icon: Zap },
  ];

  return (
    <>
      <div className="sticky top-0 left-0 right-0 z-[8] w-full">
        <header
          className={`left-0 right-0 w-full transition-all duration-300 ${getHeaderStyles()}`}
        >
          <div className="flex items-center justify-between gap-2 mx-auto relative navigationheight MaxWidthContainer">
            {/* Logo - Left */}
            <Link
              to="/"
              className="flex items-center cursor-pointer flex-shrink-0"
              onClick={() => {
                sessionStorage.setItem("hasNavigatedWithinApp", "true");
              }}
              id="LogoADjustContainer"
            >
              <img
                src="/Images/NewLogo.png"
                alt="bucketlistt Logo"
                className={`transition-opacity duration-300 ${
                  isScrolled ? "opacity-0 absolute" : "opacity-100"
                }`}
              />
              <img
                src="/Images/NewLogo.png"
                alt="bucketlistt Logo"
                className={`transition-opacity duration-300 ${
                  isScrolled ? "opacity-100" : "opacity-0 absolute"
                }`}
              />
            </Link>

            {/* Search Bar - Center (desktop only) - typewriter placeholder */}
            <div className="flex-1 hidden md:flex justify-center px-2 max-w-xl min-w-0">
              <div className="w-full max-w-md" ref={searchContainerRef}>
                <Input
                  size="middle"
                  placeholder={
                    searchFocused || searchQuery
                      ? "Search for experiences and cities..."
                      : TYPEWRITER_PHRASES[typewriterPhraseIndex].slice(
                          0,
                          typewriterVisibleLength,
                        )
                  }
                  prefix={<SearchOutlined />}
                  className="HeroSearchInput"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => {
                    setSearchFocused(true);
                    if (searchQuery.length >= 2) {
                      setShowSearchDropdown(true);
                      if (searchContainerRef.current) {
                        const rect =
                          searchContainerRef.current.getBoundingClientRect();
                        setSearchDropdownPosition({
                          top: rect.bottom + 8,
                          left: rect.left,
                          width: rect.width,
                        });
                      }
                    }
                  }}
                  onBlur={() => setSearchFocused(false)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleSearch(searchQuery)
                  }
                  onPressEnter={() => handleSearch(searchQuery)}
                />
              </div>
            </div>

            {/* Right: Favorites, Bell, Profile */}
            <div className="hidden md:flex items-center space-x-2 flex-shrink-0">
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
                                "MMM d, yyyy",
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
                          style={{ background: "var(--brand-color)" }}
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
                              style={{ background: "var(--brand-color)" }}
                            >
                              <User
                                className="h-3.5 w-3.5"
                                style={{ color: "white" }}
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
                            style={{ background: "var(--brand-color)" }}
                          >
                            <Calendar
                              className="h-3.5 w-3.5"
                              style={{ color: "white" }}
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
                              style={{ background: "var(--brand-color)" }}
                            >
                              <Heart
                                className="h-3.5 w-3.5"
                                style={{ color: "white" }}
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
                              style={{ background: "var(--brand-color)" }}
                            >
                              <Star
                                className="h-3.5 w-3.5"
                                style={{ color: "white" }}
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
                                style={{ background: "var(--brand-color)" }}
                              >
                                <Shield
                                  className="h-3.5 w-3.5"
                                  style={{ color: "white" }}
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
                                style={{ background: "var(--brand-color)" }}
                              >
                                <User
                                  className="h-3.5 w-3.5"
                                  style={{ color: "white" }}
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
                          style={{ background: "var(--brand-color)" }}
                        >
                          <LogOut
                            className="h-3.5 w-3.5"
                            style={{ color: "white" }}
                          />
                        </div>
                        <span className="text-sm" style={{ color: "white" }}>
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
                          style={{ background: "white" }}
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
                          <span className="text-sm flex-1">
                            Upcoming Booking
                          </span>
                          <span
                            style={{ background: "white" }}
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
                              style={{ background: "var(--brand-color)" }}
                            >
                              <User
                                className="h-3.5 w-3.5"
                                style={{ color: "white" }}
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
                            style={{ background: "var(--brand-color)" }}
                          >
                            <Calendar
                              className="h-3.5 w-3.5"
                              style={{ color: "white" }}
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
                              style={{ background: "var(--brand-color)" }}
                            >
                              <Heart
                                className="h-3.5 w-3.5"
                                style={{ color: "white" }}
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
                              style={{ background: "var(--brand-color)" }}
                            >
                              <Star
                                className="h-3.5 w-3.5"
                                style={{ color: "white" }}
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
                                style={{ background: "var(--brand-color)" }}
                              >
                                <Shield
                                  className="h-3.5 w-3.5"
                                  style={{ color: "white" }}
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
                                style={{ background: "var(--brand-color)" }}
                              >
                                <User
                                  className="h-3.5 w-3.5"
                                  style={{ color: "white" }}
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
                          style={{ background: "var(--brand-color)" }}
                        >
                          <LogOut
                            className="h-3.5 w-3.5"
                            style={{ color: "white" }}
                          />
                        </div>
                        <span className="text-sm" style={{ color: "white" }}>
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
                      background: isScrolled ? "white" : "white",
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

          {/* Search suggestions dropdown (portal) */}
          {showSearchDropdown &&
            searchQuery.length >= 2 &&
            typeof document !== "undefined" &&
            createPortal(
              <div
                ref={searchDropdownRef}
                className="HeroSearchDropdown"
                style={{
                  position: "fixed",
                  top: searchDropdownPosition.top,
                  left: searchDropdownPosition.left,
                  width: searchDropdownPosition.width,
                  zIndex: 9999,
                }}
              >
                {searchSuggestionsLoading ? (
                  <div className="HeroSearchDropdownLoading">
                    <div className="HeroSearchDropdownLoadingText">
                      Searching adventures...
                    </div>
                  </div>
                ) : hasSearchResults ? (
                  <div className="HeroSearchDropdownContent">
                    {searchSuggestions?.destinations &&
                      searchSuggestions.destinations.length > 0 && (
                        <div>
                          <div className="HeroSearchDropdownSectionTitle">
                            Destinations
                          </div>
                          {searchSuggestions.destinations.map(
                            (destination: any) => (
                              <div
                                key={`dest-${destination.id}`}
                                onClick={() =>
                                  handleSearchSuggestionClick(destination.title)
                                }
                                className="HeroSearchDropdownItem"
                              >
                                <div className="HeroSearchDropdownItemContent">
                                  <MapPin className="HeroSearchDropdownIcon HeroSearchDropdownIconPrimary" />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="HeroSearchDropdownItemTitle">
                                      {destination.title}
                                    </div>
                                    {destination.subtitle && (
                                      <div className="HeroSearchDropdownItemSubtitle">
                                        {destination.subtitle}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    {searchSuggestions?.experiences &&
                      searchSuggestions.experiences.length > 0 && (
                        <div>
                          <div className="HeroSearchDropdownSectionTitle HeroSearchDropdownSectionTitleInfo">
                            Activities
                          </div>
                          {searchSuggestions.experiences.map(
                            (experience: any) => (
                              <div
                                key={`exp-${experience.id}`}
                                onClick={() =>
                                  handleSearchSuggestionClick(experience.title)
                                }
                                className="HeroSearchDropdownItem"
                              >
                                <div className="HeroSearchDropdownItemContent">
                                  <Compass className="HeroSearchDropdownIcon HeroSearchDropdownIconInfo" />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="HeroSearchDropdownItemTitle">
                                      {experience.title}
                                    </div>
                                    <div className="HeroSearchDropdownItemSubtitle">
                                      {experience.category}
                                      {experience.location &&
                                        ` • ${experience.location}`}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="HeroSearchDropdownNoResults">
                    <img
                      src="/Images/NewIcons/NoDataFoundIcon.png"
                      alt="No results found"
                      className="HeroSearchDropdownNoResultsImage"
                    />
                    <div className="HeroSearchDropdownNoResultsText">
                      No adventures found for "{searchQuery}"
                    </div>
                    <div className="HeroSearchDropdownNoResultsSubtext">
                      Try different keywords
                    </div>
                  </div>
                )}
              </div>,
              document.body,
            )}
        </header>

        {/* Sticky categories bar below header */}
        <nav
          className="header-categories-bar border-t border-orange-100 bg-[#fef3e8] dark:bg-[#2d1f14]"
          aria-label="Activity categories"
        >
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mx-auto py-3 px-4 MaxWidthContainer">
            {headerCategories.map(({ label, q, Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate(`/search?q=${encodeURIComponent(q)}`)}
                className="header-category-item flex flex-col items-center gap-1 text-gray-700 dark:text-gray-200 hover:text-orange-600 dark:hover:text-orange-400 transition-colors min-w-[4rem]"
              >
                <Icon
                  className="h-6 w-6 text-orange-500 dark:text-orange-400"
                  strokeWidth={2}
                  aria-hidden
                />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </nav>
      </div>

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
