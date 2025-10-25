"use client";

import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, isSameDay } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BookingWithDueAmount {
  due_amount?: number;
  [key: string]: any;
}

export const UserBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sortBy, setSortBy] = React.useState<
    "booking_date" | "title" | "status"
  >("booking_date");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [showTodayOnly, setShowTodayOnly] = React.useState(false);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["user-bookings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // console.log("user", user);
      if (user.user_metadata.role === "vendor") {
        const { data, error } = await supabase
          .from("bookings")
          .select(
            `
          *,
          experiences (
            id,
            title,
            location,
            price,
            currency,
            vendor_id
          ),
          time_slots (
            id,
            start_time,
            end_time,
            activity_id,
            activities (
              id,
              name,
              price,
              currency
            )
          ),
          booking_participants (
            name,
            email,
            phone_number
          )
        `
          )
          .eq("experiences.vendor_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("bookings")
          .select(
            `
          *,
          experiences (
            id,
            title,
            location,
            price,
            currency
          ),
          time_slots (
            id,
            start_time,
            end_time,
            activity_id,
            activities (
              id,
              name,
              price,
              currency
            )
          ),
          booking_participants (
            name,
            email,
            phone_number
          )
        `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
      }
    },
    enabled: !!user,
  });

  // Fetch profiles for all unique user_ids from bookings
  const uniqueUserIds = React.useMemo(() => {
    const userIds = bookings.map((booking) => booking.user_id).filter(Boolean);
    // console.log("All bookings:", bookings);
    // console.log(
    // "All user_ids from bookings:",
    // bookings.map((b) => b.user_id)
    // );
    // console.log("Filtered user_ids:", userIds);
    // console.log("Unique user_ids:", [...new Set(userIds)]);

    // TEMPORARY: Add your own user ID for testing if no bookings exist
    const uniqueIds = [...new Set(userIds)];
    if (uniqueIds.length === 0 && user?.id) {
      // console.log(
      // "No user IDs from bookings, adding current user ID for testing:",
      // user.id
      // );
      return [user.id];
    }

    return uniqueIds;
  }, [bookings, user]);

  const { data: profiles = [] } = useQuery({
    queryKey: ["user-profiles", uniqueUserIds],
    queryFn: async () => {
      // console.log("Profile query triggered with uniqueUserIds:", uniqueUserIds);
      if (uniqueUserIds.length === 0) {
        // console.log("No unique user IDs, returning empty array");
        return [];
      }
      // console.log("uniqueUserIds", uniqueUserIds);
      // console.log("Current user:", user);
      // console.log("User role:", user?.user_metadata?.role);

      // Try to fetch profiles one by one to debug RLS issues
      const profilePromises = uniqueUserIds.map(async (userId) => {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId);

          if (error) {
            // console.log(`Error fetching profile for user ${userId}:`, error);
            return null;
          }

          // Return the first profile if found, otherwise null
          return data && data.length > 0 ? data[0] : null;
        } catch (err) {
          // console.log(`Exception fetching profile for user ${userId}:`, err);
          return null;
        }
      });

      const results = await Promise.all(profilePromises);
      const validProfiles = results.filter(Boolean);

      // console.log("Fetched profiles:", validProfiles);
      return validProfiles;
    },
    enabled: uniqueUserIds.length > 0,
  });

  // Create a map of user_id to profile for easy lookup
  const profileMap = React.useMemo(() => {
    return profiles.reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {} as Record<string, any>);
  }, [profiles]);

  // Filter and sort bookings
  const filteredAndSortedBookings = React.useMemo(() => {
    let filtered = bookings;

    // Apply today filter
    if (showTodayOnly) {
      filtered = filtered.filter((booking) =>
        isSameDay(new Date(booking.booking_date), new Date())
      );
    }

    // Apply search filter
    if (globalFilter) {
      filtered = filtered.filter((booking) => {
        const searchTerm = globalFilter.toLowerCase();
        return (
          booking.experiences?.title?.toLowerCase().includes(searchTerm) ||
          booking.time_slots?.activities?.name
            ?.toLowerCase()
            .includes(searchTerm) ||
          booking.status?.toLowerCase().includes(searchTerm) ||
          profileMap[booking.user_id]?.first_name
            ?.toLowerCase()
            .includes(searchTerm) ||
          profileMap[booking.user_id]?.last_name
            ?.toLowerCase()
            .includes(searchTerm) ||
          profileMap[booking.user_id]?.email?.toLowerCase().includes(searchTerm)
        );
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "booking_date":
          aValue = new Date(a.booking_date).getTime();
          bValue = new Date(b.booking_date).getTime();
          break;
        case "title":
          aValue = a.experiences?.title || "";
          bValue = b.experiences?.title || "";
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [bookings, showTodayOnly, globalFilter, sortBy, sortOrder, profileMap]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatTime12Hour = (timeString: string) => {
    if (!timeString) return "N/A";
    try {
      // Handle both "HH:mm:ss" and "HH:mm" formats
      const timeParts = timeString.split(":");
      const hours = parseInt(timeParts[0]);
      const minutes = timeParts[1];

      if (isNaN(hours)) return timeString;

      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

      return `${displayHours}:${minutes} ${period}`;
    } catch (error) {
      return timeString;
    }
  };
  const handleSort = (field: "booking_date" | "title" | "status") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const BookingCard = ({
    booking,
    index,
  }: {
    booking: BookingWithDueAmount;
    index: number;
  }) => {
    const profile = profileMap[booking.user_id];
    const activity = booking.time_slots?.activities;
    const price = activity?.price || booking?.experiences?.price || 0;
    const currency =
      activity?.currency || booking?.experiences?.currency || "INR";
    const bookingAmount = booking?.booking_amount || "N/A";
    const dueAmount = booking?.due_amount || 0;

    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              <span
                className="cursor-pointer hover:text-brand-primary"
                onClick={() => {
                  const experienceName = (booking.experiences?.title || "")
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/\s+/g, "-")
                    .replace(/-+/g, "-")
                    .trim();
                  navigate(`/experience/${experienceName}`, {
                    state: {
                      experienceData: booking.experiences,
                      fromPage: "user-bookings",
                      timestamp: Date.now(),
                    },
                  });
                }}
              >
                {booking.experiences?.title}
              </span>
            </CardTitle>
            <Badge className={getStatusColor(booking.status)}>
              {booking.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Activity:</span>
              <p className="font-medium">
                {booking.time_slots?.activities?.name || "N/A"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Date:</span>
              <p className="font-medium">
                {format(new Date(booking.booking_date), "MMM d, yyyy")}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Start Time:</span>
              <p className="font-medium">
                {formatTime12Hour(booking.time_slots?.start_time || "")}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">End Time:</span>
              <p className="font-medium">
                {formatTime12Hour(booking.time_slots?.end_time || "")}
              </p>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Customer:</span>
                <p className="font-medium">
                  {profile
                    ? `${profile.first_name} ${profile.last_name}`.trim()
                    : booking?.booking_participants?.[0]?.name || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Participants:</span>
                <p className="font-medium">
                  {booking?.total_participants || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Amount:</span>
                <div className="text-right">
                  <div className="text-lg font-bold text-orange-500">
                    {bookingAmount === "N/A"
                      ? "N/A"
                      : `${currency} ${bookingAmount}`}
                  </div>
                  {bookingAmount !== "N/A" && (
                    <div className="text-xs text-muted-foreground">
                      {booking?.total_participants} × {currency}{" "}
                      {bookingAmount / booking?.total_participants}
                    </div>
                  )}
                </div>
              </div>
              {dueAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Pending Payment:
                  </span>
                  <span className="text-sm font-medium">
                    {currency} {dueAmount}
                  </span>
                </div>
              )}
            </div>
          </div>

          {(profile?.email || booking?.booking_participants?.[0]?.email) && (
            <div className="border-t pt-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">
                  {profile?.email ||
                    booking?.booking_participants?.[0]?.email ||
                    "N/A"}
                </p>
              </div>
            </div>
          )}

          {(profile?.phone_number ||
            booking?.booking_participants?.[0]?.phone_number) && (
            <div className="text-sm">
              <span className="text-muted-foreground">Contact:</span>
              <p className="font-medium">
                {profile?.phone_number ||
                  booking?.booking_participants?.[0]?.phone_number ||
                  "N/A"}
              </p>
            </div>
          )}

          {booking.note_for_guide && (
            <div className="border-t pt-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Notes for Guide:</span>
                <p className="font-medium">{booking.note_for_guide}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) return <p className="text-center py-10">Loading...</p>;
  if (!bookings.length)
    return (
      <div className="text-center py-10 text-muted-foreground">
        No bookings yet!
      </div>
    );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
        <Input
          placeholder="Search bookings..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
            <Button
              variant={sortBy === "booking_date" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort("booking_date")}
            >
              Date{" "}
              {sortBy === "booking_date" && (sortOrder === "asc" ? "↑" : "↓")}
            </Button>
            {/* <Button
              variant={sortBy === "title" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort("title")}
            >
              Title {sortBy === "title" && (sortOrder === "asc" ? "↑" : "↓")}
            </Button> */}
            {/* <Button
              variant={sortBy === "status" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort("status")}
            >
              Status {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
            </Button> */}
          </div>
          <Button
            variant={showTodayOnly ? "default" : "outline"}
            onClick={() => setShowTodayOnly((prev) => !prev)}
          >
            {showTodayOnly
              ? `Show All (${filteredAndSortedBookings.length} today)`
              : "Today's bookings"}
          </Button>
        </div>
      </div>

      {filteredAndSortedBookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedBookings.map((booking, index) => (
            <BookingCard key={booking.id} booking={booking} index={index} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          {showTodayOnly ? "No bookings for today." : "No bookings found."}
        </div>
      )}
    </div>
  );
};
