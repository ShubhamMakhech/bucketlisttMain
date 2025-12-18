import React, { useState, useEffect, useRef } from 'react';
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useFavorites } from "@/hooks/useFavorites";
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
import { useLocation } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { AuthModal } from "@/components/AuthModal";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import './NavigationBar.css';

const NavigationBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, signOut } = useAuth();
    const { isVendor, isAdmin } = useUserRole();
    const { role } = useUserRole();
    const { favoritesCount } = useFavorites();
    const { theme } = useTheme();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);

    // Scroll-based height container (0px to 200px based on scroll)
    const [containerHeight, setContainerHeight] = useState(0);
    const maxScroll = 64; // Max scroll for max height
    const maxHeight = 64; // Max height in pixels

    // Function to check if current route is an activity or booking route
    const isActivityRoute = () => {
        return location.pathname.startsWith('/activity/') || location.pathname.startsWith('/booking/');
    };

    // Handle route changes - set colorful state for activity and booking routes
    useEffect(() => {
        if (location.pathname.startsWith('/activity/') || location.pathname.startsWith('/booking/')) {
            setContainerHeight(maxScroll);
        } else {
            // Reset based on scroll position when not on activity/booking route
            const currentScrollY = window.scrollY;
            const height = Math.min(currentScrollY, maxScroll);
            setContainerHeight(height);
        }
    }, [location.pathname, maxScroll]);

    useEffect(() => {
        const handleScroll = () => {
            // If on activity or booking route, always use max height (colorful state)
            if (location.pathname.startsWith('/activity/') || location.pathname.startsWith('/booking/')) {
                setContainerHeight(maxScroll);
                return;
            }

            const currentScrollY = window.scrollY;
            // Calculate height: 100px scroll = 100px height, up to 200px
            const height = Math.min(currentScrollY, maxScroll);
            setContainerHeight(height);
        };

        // Initial check - if on activity or booking route, set to max height
        if (location.pathname.startsWith('/activity/') || location.pathname.startsWith('/booking/')) {
            setContainerHeight(maxScroll);
        } else {
            const initialScrollY = window.scrollY;
            const initialHeight = Math.min(initialScrollY, maxScroll);
            setContainerHeight(initialHeight);
        }

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [location.pathname, maxScroll]);

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

    const getInitials = (email) => {
        return email.substring(0, 2).toUpperCase();
    };

    const getRoleDisplayName = (userRole) => {
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

    const getButtonStyles = () => {
        // If container height is 0, use white text (transparent background)
        if (containerHeight === 0) return "text-white hover:bg-white/20";

        // If container has height, use theme-based styles
        if (theme === "light") {
            return "text-gray-900 hover:bg-gray-100/80";
        } else {
            return "text-white hover:bg-white/20";
        }
    };

    return (
        <>
            <nav className="navigation-bar ">
                {/* Scroll-based height container */}
                <div
                    className="navigation-scroll-container"
                    style={{ height: `${containerHeight}px` }}
                />

                <div className="navigation-content MaxWidthContainer">
                    {/* Logo with layered effect */}
                    <Link
                        to="/"
                        className="navigation-logo"
                        onClick={() => {
                            sessionStorage.setItem("hasNavigatedWithinApp", "true");
                        }}
                    >
                        {/* White logo - base layer (always visible) */}
                        <img
                            src="https://prepseed.s3.ap-south-1.amazonaws.com/Bucketlistt+(1).png"
                            alt="bucketlistt Logo"
                            className="logo-white"
                        />
                        {/* Colored logo - top layer (revealed by scroll container) */}
                        <div
                            className="logo-colored-container"
                            style={{
                                clipPath: `inset(0 0 ${((maxHeight - containerHeight) / maxHeight) * 100}% 0)`,
                                WebkitClipPath: `inset(0 0 ${((maxHeight - containerHeight) / maxHeight) * 100}% 0)`
                            }}
                        >
                            <img
                                src="https://prepseed.s3.ap-south-1.amazonaws.com/Bucketlistt.png"
                                alt="bucketlistt Logo"
                                className="logo-colored"
                            />
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="navigation-desktop">
                        {/* Bookings Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`nav-button ${getButtonStyles()}`}
                            onClick={() => navigate("/bookings")}
                        >
                            <Calendar className="h-5 w-5" />
                        </Button>

                        {/* Favorites Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`nav-button ${getButtonStyles()}`}
                            onClick={() => navigate("/favorites")}
                        >
                            <Heart className="h-5 w-5" />
                            {user && favoritesCount > 0 && (
                                <span className="nav-badge">
                                    {favoritesCount > 9 ? "9+" : favoritesCount}
                                </span>
                            )}
                        </Button>

                        {/* Notification Bell - Desktop only */}
                        {user && (
                            <div className="nav-notification-group">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`nav-button ${getButtonStyles()}`}
                                >
                                    <Bell className="h-5 w-5" />
                                    {nextBooking && (
                                        <span className="nav-badge nav-badge-blue">1</span>
                                    )}
                                </Button>

                                {/* Notification Dropdown on Hover */}
                                {nextBooking && (
                                    <div className="nav-notification-dropdown">
                                        <div className="nav-notification-content">
                                            <div className="nav-notification-item">
                                                <div className="nav-notification-icon">
                                                    <Calendar className="h-5 w-5 text-blue-500" />
                                                </div>
                                                <div className="nav-notification-text">
                                                    <h4 className="nav-notification-title">
                                                        Upcoming Booking
                                                    </h4>
                                                    <p className="nav-notification-desc">
                                                        <strong>{nextBooking.experiences?.title}</strong>
                                                    </p>
                                                    <p className="nav-notification-date">
                                                        {format(
                                                            new Date(nextBooking.booking_date),
                                                            "MMM d, yyyy"
                                                        )}{" "}
                                                        - Don't forget!
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="nav-notification-footer">
                                                <Button
                                                    size="sm"
                                                    className="nav-notification-button"
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
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className={`nav-avatar-button ${getButtonStyles()}`}
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
                                    className="user-dropdown-content"
                                    sideOffset={8}
                                >
                                    {/* Header Section */}
                                    <div className="user-dropdown-header">
                                        <Avatar className="user-dropdown-avatar">
                                            <AvatarImage
                                                src={user.user_metadata?.avatar_url}
                                                alt={user.email || ""}
                                            />
                                            <AvatarFallback style={{
                                                background: 'linear-gradient(to bottom right, #f97316, #ea580c)',
                                                color: 'white',
                                                fontWeight: 600,
                                                fontSize: '14px'
                                            }}>
                                                {getInitials(user.email || "")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="user-dropdown-info">
                                            <p className="user-dropdown-email">
                                                {user.email}
                                            </p>
                                            <p className="user-dropdown-role">
                                                {getRoleDisplayName(role)}
                                            </p>
                                        </div>
                                    </div>

                                    <DropdownMenuSeparator className="user-dropdown-separator" />

                                    {/* Menu Items */}
                                    <div className="user-dropdown-menu">
                                        <DropdownMenuItem
                                            className="user-dropdown-item"
                                            onClick={() => setShowEditProfile(true)}
                                        >
                                            <UserCircle className="user-dropdown-item-icon" />
                                            Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="user-dropdown-item"
                                            onClick={() => navigate("/bookings")}
                                        >
                                            <Calendar className="user-dropdown-item-icon" />
                                            Bookings
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="user-dropdown-item"
                                            onClick={() => navigate("/favorites")}
                                        >
                                            <Heart className="user-dropdown-item-icon" />
                                            Wishlists
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="user-dropdown-item"
                                            onClick={() => navigate("/coming-soon")}
                                        >
                                            <FileText className="user-dropdown-item-icon" />
                                            Reviews
                                        </DropdownMenuItem>
                                        {isAdmin && (
                                            <DropdownMenuItem
                                                className="user-dropdown-item"
                                                onClick={() => isAdmin && navigate("/users")}
                                            >
                                                <FileText className="user-dropdown-item-icon" />
                                                Users
                                            </DropdownMenuItem>
                                        )}
                                    </div>

                                    <DropdownMenuSeparator className="user-dropdown-separator" />

                                    {/* Logout Item */}
                                    <DropdownMenuItem
                                        className="user-dropdown-item user-dropdown-item-logout"
                                        onClick={handleSignOut}
                                    >
                                        <LogOut className="user-dropdown-item-icon" />
                                        Log out
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

                    {/* Mobile Navigation */}
                    <div className="navigation-mobile">
                        {/* Bookings Button - Mobile */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`nav-button ${getButtonStyles()}`}
                            onClick={() => navigate("/bookings")}
                        >
                            <Calendar className="h-5 w-5" />
                        </Button>

                        {/* Favorites Button - Mobile */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`nav-button ${getButtonStyles()}`}
                            onClick={() => navigate("/favorites")}
                        >
                            <Heart className="h-5 w-5" />
                            {user && favoritesCount > 0 && (
                                <span className="nav-badge">
                                    {favoritesCount > 9 ? "9+" : favoritesCount}
                                </span>
                            )}
                        </Button>

                        {/* User Profile or Sign In - Mobile */}
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className={`nav-avatar-button ${getButtonStyles()}`}
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
                                    className="user-dropdown-content"
                                    sideOffset={8}
                                >
                                    {/* Header Section */}
                                    <div className="user-dropdown-header">
                                        <Avatar className="user-dropdown-avatar">
                                            <AvatarImage
                                                src={user.user_metadata?.avatar_url}
                                                alt={user.email || ""}
                                            />
                                            <AvatarFallback style={{
                                                background: 'linear-gradient(to bottom right, #f97316, #ea580c)',
                                                color: 'white',
                                                fontWeight: 600,
                                                fontSize: '14px'
                                            }}>
                                                {getInitials(user.email || "")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="user-dropdown-info">
                                            <p className="user-dropdown-email">
                                                {user.email}
                                            </p>
                                            <p className="user-dropdown-role">
                                                {getRoleDisplayName(role)}
                                            </p>
                                        </div>
                                    </div>

                                    <DropdownMenuSeparator className="user-dropdown-separator" />

                                    {/* Mobile-specific: Notification item */}
                                    {nextBooking && (
                                        <>
                                            <DropdownMenuItem
                                                className="user-dropdown-item"
                                                onClick={() => navigate("/bookings")}
                                            >
                                                <Bell className="user-dropdown-item-icon" />
                                                Upcoming Booking
                                                <span className="user-dropdown-badge">1</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="user-dropdown-separator" />
                                        </>
                                    )}

                                    {/* Menu Items */}
                                    <div className="user-dropdown-menu">
                                        <DropdownMenuItem
                                            className="user-dropdown-item"
                                            onClick={() => setShowEditProfile(true)}
                                        >
                                            <UserCircle className="user-dropdown-item-icon" />
                                            Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="user-dropdown-item"
                                            onClick={() => navigate("/bookings")}
                                        >
                                            <Calendar className="user-dropdown-item-icon" />
                                            Bookings
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="user-dropdown-item"
                                            onClick={() => navigate("/favorites")}
                                        >
                                            <Heart className="user-dropdown-item-icon" />
                                            Wishlists
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="user-dropdown-item"
                                            onClick={() => navigate("/coming-soon")}
                                        >
                                            <FileText className="user-dropdown-item-icon" />
                                            Reviews
                                        </DropdownMenuItem>
                                    </div>

                                    <DropdownMenuSeparator className="user-dropdown-separator" />

                                    {/* Logout Item */}
                                    <DropdownMenuItem
                                        className="user-dropdown-item user-dropdown-item-logout"
                                        onClick={handleSignOut}
                                    >
                                        <LogOut className="user-dropdown-item-icon" />
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button
                                style={{
                                    background: containerHeight > 0 ? "#940fdb" : "white",
                                    color: containerHeight > 0 ? "white" : "black",
                                    padding: "0px 10px",
                                    height: "30px",
                                }}
                                onClick={() => setIsAuthModalOpen(true)}
                            >
                                Sign in
                            </Button>
                        )}
                    </div>
                </div>
            </nav>

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
};

export default NavigationBar;
