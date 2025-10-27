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
import { useIsMobile } from "@/hooks/use-mobile";

interface BookingWithDueAmount {
  due_amount?: number;
  [key: string]: any;
}

export const UserBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sortBy, setSortBy] = React.useState<
    "booking_date" | "title" | "status"
  >("booking_date");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [showTodayOnly, setShowTodayOnly] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<string>("");
  const [selectedEndDate, setSelectedEndDate] = React.useState<string>("");
  const [showDateRangePicker, setShowDateRangePicker] = React.useState(false);
  const [selectedActivityId, setSelectedActivityId] = React.useState<string | null>(null);
  const [showActivityFilter, setShowActivityFilter] = React.useState(false);
  const [selectedTimeslotId, setSelectedTimeslotId] = React.useState<string | null>(null);
  const [showTimeslotFilter, setShowTimeslotFilter] = React.useState(false);

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
            vendor_id,
            is_active
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
            currency,
            is_active
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

    // Apply date filter (mobile only) - supports range
    if (selectedDate && isMobile) {
      filtered = filtered.filter((booking) => {
        const bookingDate = format(new Date(booking.booking_date), "yyyy-MM-dd");
        
        if (selectedEndDate) {
          // Date range filter
          return bookingDate >= selectedDate && bookingDate <= selectedEndDate;
        } else {
          // Single date filter
          return bookingDate === selectedDate;
        }
      });
    }

    // Apply timeslot filter
    if (selectedTimeslotId) {
      filtered = filtered.filter((booking) => {
        return booking.time_slots?.id === selectedTimeslotId;
      });
    }

    // Apply activity filter
    if (selectedActivityId) {
      filtered = filtered.filter((booking) => {
        return booking.time_slots?.activities?.id === selectedActivityId;
      });
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
  }, [bookings, showTodayOnly, selectedDate, selectedEndDate, selectedTimeslotId, selectedActivityId, globalFilter, sortBy, sortOrder, profileMap, isMobile]);

  // Get unique activities from bookings - only from active experiences
  const uniqueActivities = React.useMemo(() => {
    const activities = new Map();
    bookings.forEach((booking) => {
      // Only include activities from active experiences
      if (booking.experiences?.is_active === true) {
        const activity = booking.time_slots?.activities;
        if (activity && activity.id && activity.name) {
          activities.set(activity.id, {
            id: activity.id,
            name: activity.name,
          });
        }
      }
    });
    return Array.from(activities.values());
  }, [bookings]);

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

  const handleSort = (field: "booking_date" | "title" | "status") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleClearDateFilter = () => {
    setSelectedDate("");
    setSelectedEndDate("");
    setShowDateRangePicker(false);
  };

  const isDateRangeActive = selectedDate || selectedEndDate;

  // Calculate count of today's bookings
  const todayBookingsCount = React.useMemo(() => {
    return bookings.filter((booking) =>
      isSameDay(new Date(booking.booking_date), new Date())
    ).length;
  }, [bookings]);

  // Get unique timeslots from bookings
  const uniqueTimeslots = React.useMemo(() => {
    const timeslots = new Map();
    bookings.forEach((booking) => {
      const timeslot = booking.time_slots;
      if (timeslot && timeslot.id) {
        const startTime = formatTime12Hour(timeslot.start_time || "");
        const endTime = formatTime12Hour(timeslot.end_time || "");
        const displayName = `${startTime} - ${endTime}`;
        timeslots.set(timeslot.id, {
          id: timeslot.id,
          start_time: timeslot.start_time,
          end_time: timeslot.end_time,
          displayName: displayName,
        });
      }
    });
    return Array.from(timeslots.values());
  }, [bookings]);

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
      <Card className="h-full" id="">
        <CardHeader className="pb-0 p-0">
          <div className="flex justify-between items-start">
            {/* <CardTitle className="text-base font-semibold line-clamp-2">
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
            </CardTitle> */}
            {/* <Badge className={getStatusColor(booking.status)}>
              {booking.status}
            </Badge> */}
          </div>
        </CardHeader>
        <CardContent className="space-y-1 p-3">
          <div className="grid grid-cols-2 gap-1 text-sm" id="UserBookingsCardContentStyles">
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
              <span className="text-muted-foreground">Participants:</span>
              <p className="font-medium">
                {booking?.total_participants || "N/A"}
              </p>
            </div>
            {/* <div>
              <span className="text-muted-foreground">End Time:</span>
              <p className="font-medium">
                {formatTime12Hour(booking.time_slots?.end_time || "")}
              </p>
            </div> */}
          </div>

          <div className="" >
            <div className="grid grid-cols-2 gap-2 text-sm" id="UserBookingsCardContentStyles3">
              <div>
                <span className="text-muted-foreground">Customer:</span>
                <p className="font-medium">
                  {profile
                    ? `${profile.first_name} ${profile.last_name}`.trim()
                    : booking?.booking_participants?.[0]?.name || "N/A"}
                </p>
              </div>

            </div>
          </div>
          {(profile?.phone_number ||
            booking?.booking_participants?.[0]?.phone_number) && (
              <div className="text-sm" id="UserBookingsCardContentStyles4">
                <span className="text-muted-foreground">Contact:</span>
                <p className="font-medium" style={{ color: "blue" }}>
                  <a href={`tel:${profile?.phone_number || booking?.booking_participants?.[0]?.phone_number}`}>{profile?.phone_number || booking?.booking_participants?.[0]?.phone_number || "N/A"}</a>
                </p>
              </div>
            )}
          <div className="">
            <div className="space-y-2">
              {/* <div className="flex justify-between items-center">
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
              </div> */}
              {dueAmount > 0 && (
                <div className="flex gap-1 items-center">
                  <span className="text-sm text-muted-foreground">
                    Pending Payment:
                  </span>
                  <span className="text-sm font-medium">
                    {currency} {dueAmount}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* {(profile?.email || booking?.booking_participants?.[0]?.email) && (
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
          )} */}



          {booking.note_for_guide && (
            <div className=" pt-1" id="UserBookingsCardContentStyles5">
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
      <div className="flex flex-col gap-3">
        {/* Mobile Layout: Search + Date Button on top row */}
        {isMobile && (
          <div className="flex gap-2">
            <Input
              placeholder="Search bookings..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="flex-1 text-sm"
            />
            <div className="relative">
              <Button
                variant={isMobile && showDateRangePicker ? "default" : (sortBy === "booking_date" ? "default" : "outline")}
                onClick={() => isMobile ? setShowDateRangePicker(!showDateRangePicker) : handleSort("booking_date")}
                className="text-sm"
              >
                <span className="text-sm">
                  {isMobile && isDateRangeActive
                    ? (selectedDate && selectedEndDate
                        ? `${selectedDate} to ${selectedEndDate}`
                        : selectedDate)
                    : "Date"}
                </span>
                {!isMobile && sortBy === "booking_date" && (sortOrder === "asc" ? "↑" : "↓")}
              </Button>
              
              {/* Mobile Date Range Picker - Opens below Date button */}
              {showDateRangePicker && (
                <div className="absolute z-10 left-0 mt-2 w-[280px] p-4 border rounded-lg bg-background space-y-3 shadow-lg">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full text-sm"
                      max={selectedEndDate || undefined}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      End Date (Optional)
                    </label>
                    <Input
                      type="date"
                      value={selectedEndDate}
                      onChange={(e) => setSelectedEndDate(e.target.value)}
                      className="w-full text-sm"
                      min={selectedDate || undefined}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShowDateRangePicker(false)}
                      className="flex-1 text-xs"
                    >
                      Apply Filter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearDateFilter}
                      className="text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filter Buttons Row - Shows on both mobile and desktop */}
        <div className="relative flex flex-wrap gap-2" id="UserBookingsSortButtonStyles">
            {/* Desktop: Date button sorts bookings */}
            {!isMobile && (
              <Button
                variant={sortBy === "booking_date" ? "default" : "outline"}
                onClick={() => handleSort("booking_date")}
                className="text-sm"
              >
                <span className="text-sm">Date</span>
                {sortBy === "booking_date" && (sortOrder === "asc" ? "↑" : "↓")}
              </Button>
            )}
            
            <Button
              variant={showTodayOnly ? "default" : "outline"}
              className="text-sm"
              onClick={() => setShowTodayOnly((prev) => !prev)}
            >
              {showTodayOnly
                ? `Show All`
                : `Today (${todayBookingsCount})`}
            </Button>

            {/* Timeslot Filter Button */}
            <div className="relative">
              <Button
                variant={selectedTimeslotId ? "default" : "outline"}
                onClick={() => setShowTimeslotFilter(!showTimeslotFilter)}
                className="text-sm"
              >
                {selectedTimeslotId
                  ? uniqueTimeslots.find((t) => t.id === selectedTimeslotId)?.displayName || "Timeslot"
                  : "Timeslot"}
              </Button>

              {/* Timeslot Filter Dropdown */}
              {showTimeslotFilter && (
                <div className="absolute z-10 left-0 top-full mt-2 w-[280px] p-4 border rounded-lg bg-background space-y-2 shadow-lg max-h-60 overflow-y-auto">
                <Button
                  variant={selectedTimeslotId === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedTimeslotId(null);
                    setShowTimeslotFilter(false);
                  }}
                  className="w-full justify-start text-xs"
                >
                  All Timeslots
                </Button>
                {uniqueTimeslots.map((timeslot) => (
                  <Button
                    key={timeslot.id}
                    variant={selectedTimeslotId === timeslot.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedTimeslotId(timeslot.id);
                      setShowTimeslotFilter(false);
                    }}
                    className="w-full justify-start text-xs"
                  >
                    {timeslot.displayName}
                  </Button>
                ))}
                </div>
              )}
            </div>

            {/* Activity Filter Button */}
            <div className="relative">
              <Button
                variant={selectedActivityId ? "default" : "outline"}
                onClick={() => setShowActivityFilter(!showActivityFilter)}
                className="text-sm"
              >
                {selectedActivityId
                  ? uniqueActivities.find((a) => a.id === selectedActivityId)?.name || "Activity"
                  : "Activity"}
              </Button>

              {/* Activity Filter Dropdown */}
              {showActivityFilter && (
                <div className="absolute z-10 left-0 top-full mt-2 w-[280px] p-4 border rounded-lg bg-background space-y-2 shadow-lg max-h-60 overflow-y-auto">
                <Button
                  variant={selectedActivityId === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedActivityId(null);
                    setShowActivityFilter(false);
                  }}
                  className="w-full justify-start text-xs"
                >
                  All Activities
                </Button>
                {uniqueActivities.map((activity) => (
                  <Button
                    key={activity.id}
                    variant={selectedActivityId === activity.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedActivityId(activity.id);
                      setShowActivityFilter(false);
                    }}
                    className="w-full justify-start text-xs"
                  >
                    {activity.name}
                  </Button>
                ))}
                </div>
              )}
            </div>
        </div>

        {/* Desktop Search Bar - Hidden on mobile */}
        {!isMobile && (
          <div className="flex sm:flex-row justify-between items-start sm:items-center py-1 gap-2">
            <Input
              placeholder="Search bookings..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm text-sm"
            />
          </div>
        )}
      </div>
      <br />
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
