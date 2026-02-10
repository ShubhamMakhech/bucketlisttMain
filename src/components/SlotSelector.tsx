// @ts-nocheck
// @ts-nocheck
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, Badge, Button, Popover, Tooltip } from "antd";
import { Calendar } from "@/components/ui/calendar";
import {
  Clock,
  Users,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format, addDays, isSameDay } from "date-fns";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface SlotSelectorProps {
  experienceId: string;
  selectedDate: Date | undefined;
  selectedSlotId: string | undefined;
  selectedActivityId: string | undefined; // Add this
  participantCount: number;
  onDateChange: (date: Date | undefined) => void;
  onSlotChange: (slotId: string | undefined) => void;
  onActivityChange: (activityId: string | undefined) => void; // Add this
  showOnlyActivitySelection?: boolean; // New prop for mobile step 1
  showOnlyDateAndTime?: boolean; // New prop for mobile step 2
}

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  available_spots: number;
}

interface Activity {
  id: string;
  name: string;
  price: number;
  currency: string;
  distance?: string;
  discounted_price?: number | null;
}

// Add before the SlotSelector component
export const SlotSelector = ({
  experienceId,
  selectedDate,
  experienceTitle,
  selectedSlotId,
  selectedActivityId, // Add this
  participantCount,
  onDateChange,
  onSlotChange,
  onActivityChange, // Add this
  showOnlyActivitySelection = false,
  showOnlyDateAndTime = false,
}: SlotSelectorProps) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [isDistanceExpanded, setIsDistanceExpanded] = useState(false);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(
    new Set()
  );
  const [showAllActivities, setShowAllActivities] = useState(false);

  // Toggle expanded state for activity descriptions
  const toggleExpanded = (activityId: string) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  // Generate next 4 days for horizontal date picker
  const getNext4Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 4; i++) {
      days.push(addDays(today, i));
    }
    return days;
  };

  const next4Days = getNext4Days();

  // Query to get available dates (dates with available slots)
  const { data: availableDates } = useQuery({
    queryKey: ["available-dates", experienceId, participantCount, selectedActivityId],
    queryFn: async () => {
      // Get time slots for the experience (and activity if selected)
      let query = supabase
        .from("time_slots")
        .select("*")
        .eq("experience_id", experienceId);

      if (selectedActivityId) {
        query = query.eq("activity_id", selectedActivityId);
      }

      const { data: slots, error: slotsError } = await query;

      if (slotsError) throw slotsError;

      // Get all bookings for this experience
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("time_slot_id, total_participants, booking_date")
        .eq("experience_id", experienceId)
        .eq("status", "confirmed");

      if (bookingsError) throw bookingsError;

      // Group bookings by date
      const bookingsByDate = bookings.reduce((acc, booking) => {
        const dateStr = booking.booking_date.split("T")[0];
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(booking);
        return acc;
      }, {} as Record<string, any[]>);

      // Check each date from today onwards for the next 365 days
      const availableDates = new Set<string>();
      const today = new Date();

      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        const dateStr = checkDate.toISOString().split("T")[0];

        // Check if any slot has availability for this date
        const hasAvailableSlot = slots.some((slot) => {
          const slotBookings =
            bookingsByDate[dateStr]?.filter(
              (booking) => booking.time_slot_id === slot.id
            ) || [];
          const bookedCount = slotBookings.reduce(
            (sum, booking) => sum + booking.total_participants,
            0
          );
          const availableSpots = slot.capacity - bookedCount;

          // For today, we also need to check if the slot hasn't already started
          if (i === 0) {
            const currentTimeIST = getCurrentTimeIST();
            const currentTimeMinutes = currentTimeIST.getHours() * 60 + currentTimeIST.getMinutes();
            const slotStartMinutes = timeToMinutes(slot.start_time);
            if (slotStartMinutes < currentTimeMinutes) return false;
          }

          return availableSpots >= participantCount;
        });

        if (hasAvailableSlot) {
          availableDates.add(dateStr);
        }
      }

      return availableDates;
    },
    enabled: !!experienceId,
  });

  // Reset/Auto-select date if current one is unavailable for the selected activity
  React.useEffect(() => {
    if (availableDates && availableDates.size > 0 && selectedActivityId) {
      const dateStr = selectedDate ? selectedDate.toISOString().split("T")[0] : null;

      // If no date is selected OR the current selected date is no longer available
      if (!selectedDate || (dateStr && !availableDates.has(dateStr))) {
        // Find the first available date from today onwards (up to 365 days)
        const todayAtMidnight = new Date();
        todayAtMidnight.setHours(0, 0, 0, 0);

        for (let i = 0; i < 365; i++) {
          const checkDate = addDays(todayAtMidnight, i);
          const checkDateStr = checkDate.toISOString().split("T")[0];
          if (availableDates.has(checkDateStr)) {
            onDateChange(checkDate);
            break;
          }
        }
      }
    } else if (availableDates && availableDates.size === 0 && selectedDate) {
      // If no dates are available at all for this activity, clear the selection
      onDateChange(undefined);
    }
  }, [selectedActivityId, availableDates, selectedDate, onDateChange]);

  // Add query for activities
  const { data: activities } = useQuery({
    queryKey: ["activities", experienceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("experience_id", experienceId)
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data as Activity[];
    },
  });

  // Helper function to get current time in IST (UTC+5:30)
  const getCurrentTimeIST = () => {
    const now = new Date();
    // Convert to IST: Get UTC time and add 5:30 hours
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istTime = new Date(utcTime + istOffset);
    return istTime;
  };

  // Helper function to check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const dateStr = date.toISOString().split("T")[0];
    return todayStr === dateStr;
  };

  // Helper function to convert time string (HH:mm) to minutes for comparison
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Update time slots query to filter by activity
  const { data: timeSlots, isLoading } = useQuery({
    queryKey: ["time-slots", experienceId, selectedDate, selectedActivityId],
    queryFn: async () => {
      if (!selectedDate || !selectedActivityId) return [];

      const dateStr = selectedDate.toISOString().split("T")[0];

      // Get time slots for the experience
      const { data: slots, error: slotsError } = await supabase
        .from("time_slots")
        .select("*")
        .eq("experience_id", experienceId)
        .eq("activity_id", selectedActivityId);

      if (slotsError) throw slotsError;

      // Get bookings for this specific date
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("time_slot_id, total_participants")
        .eq("experience_id", experienceId)
        .gte("booking_date", `${dateStr}T00:00:00`)
        .lt("booking_date", `${dateStr}T23:59:59`)
        .eq("status", "confirmed");

      if (bookingsError) throw bookingsError;

      // Get current time in IST if selected date is today
      const currentTimeIST = isToday(selectedDate) ? getCurrentTimeIST() : null;
      const currentTimeMinutes = currentTimeIST
        ? currentTimeIST.getHours() * 60 + currentTimeIST.getMinutes()
        : null;

      // Calculate availability for each slot and filter out past slots for today
      const slotsWithAvailability = slots
        .map((slot) => {
          const slotBookings = bookings.filter(
            (booking) => booking.time_slot_id === slot.id
          );
          const bookedCount = slotBookings.reduce(
            (sum, booking) => sum + booking.total_participants,
            0
          );
          const availableSpots = slot.capacity - bookedCount;

          return {
            ...slot,
            booked_count: bookedCount,
            available_spots: Math.max(0, availableSpots),
          };
        })
        .filter((slot) => {
          // If it's today, filter out slots that have already started
          if (currentTimeMinutes !== null) {
            const slotStartMinutes = timeToMinutes(slot.start_time);
            return slotStartMinutes >= currentTimeMinutes;
          }
          // For future dates, include all slots
          return true;
        })
        .sort((a, b) => {
          // Sort by start_time in ascending order
          return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
        });

      return slotsWithAvailability as TimeSlot[];
    },
    enabled: !!experienceId && !!selectedDate && !!selectedActivityId,
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  };

  const isSlotAvailable = (slot: TimeSlot) => {
    return slot.available_spots >= participantCount;
  };

  const getSlotStatusBadge = (slot: TimeSlot) => {
    if (slot.available_spots === 0) {
      return <Badge color="red">Fully Booked</Badge>;
    }
    if (slot.available_spots < participantCount) {
      return <Badge color="var(--brand-color)">Not Enough Spots</Badge>;
    }
    if (slot.available_spots <= 3) {
      return <Badge color="orange">Few Spots Left</Badge>;
    }
    return "";
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Function to check if a date should be disabled
  const isDateDisabled = (date: Date) => {
    // Disable past dates
    if (date < today) return true;

    // If availableDates is not loaded yet, don't disable any future dates
    if (!availableDates) return false;

    // Disable dates that don't have available slots
    const dateStr = date.toISOString().split("T")[0];
    return !availableDates.has(dateStr);
  };

  return (
    <div className="slot-selector-main-container space-y-6">
      {/* Selected Activity Summary (Compact) */}
      {selectedActivityId && (
        <div className="selected-activity-summary-banner">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Activity Selection</span>
              <h4 className="text-sm font-bold text-gray-800 m-0">
                {activities?.find(a => a.id === selectedActivityId)?.name || "Selected Activity"}
              </h4>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Price</span>
              <div className="text-sm font-bold text-[var(--brand-color)]">
                {(() => {
                  const activity = activities?.find(a => a.id === selectedActivityId);
                  if (!activity) return "";
                  const sym = activity.currency === "INR" || activity.currency === "USD" ? "₹" : activity.currency;
                  return `${sym} ${activity.discounted_price || activity.price}`;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Selection - Show only if not in date/time only mode */}
      {!showOnlyDateAndTime && (
        <>
          {/* Add Activity Selector */}
          <Card className="ContainerBorderSet" bodyStyle={{ padding: "10px" }}>
            <label className="text-base font-semibold mb-3 block textSmall">
              Select Activity
            </label>

            {/* Desktop Activity Swiper Slider */}
            <div className="activity-swiper-container hidden md:block">
              <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={16}
                slidesPerView="auto"
                navigation={true}
                pagination={{
                  clickable: true,
                  dynamicBullets: true,
                }}
                className="activity-swiper"
              >
                {activities?.map((activity) => (
                  <SwiperSlide key={activity.id} className="activity-slide">
                    <Tooltip
                      title={activity.distance || "Description not available"}
                      placement="top"
                      overlayStyle={{ maxWidth: "300px" }}
                    >
                      <Card
                        className={`activity-card cursor-pointer transition-all duration-200 ${selectedActivityId === activity.id
                          ? "border-[var(--brand-color)] bg-orange-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                          }`}
                        onClick={() => {
                          onActivityChange(activity.id);
                          onSlotChange(undefined); // Reset slot when activity changes
                        }}
                        style={{
                          width: "280px",
                          minHeight: "200px",
                          height: "100%",
                        }}
                      >
                        <div className="flex flex-col h-full p-3">
                          {/* Title */}
                          <div className="mb-3">
                            <h3
                              className={`text-lg font-bold ${selectedActivityId === activity.id
                                ? "text-gray-800"
                                : "text-gray-800"
                                }`}
                            >
                              {activity.name}
                            </h3>
                          </div>

                          {/* Price */}
                          <div className="mb-4">
                            {activity.discounted_price &&
                              activity.discounted_price !== activity.price ? (
                              <div className="flex gap-2">
                                <div className="text-lg text-muted-foreground line-through opacity-50">
                                  {activity.currency === "USD"
                                    ? "₹"
                                    : activity.currency === "INR"
                                      ? "₹"
                                      : activity.currency}{" "}
                                  {activity.price}
                                </div>
                                <div
                                  className={`text-2xl font-bold ${selectedActivityId === activity.id
                                    ? "text-green-600"
                                    : "text-green-600"
                                    }`}
                                >
                                  {activity.currency === "USD"
                                    ? "₹"
                                    : activity.currency === "INR"
                                      ? "₹"
                                      : activity.currency}{" "}
                                  {activity.discounted_price}
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`text-2xl font-bold ${selectedActivityId === activity.id
                                  ? "text-[var(--brand-color)]"
                                  : "text-gray-800"
                                  }`}
                              >
                                {activity.currency === "USD"
                                  ? "₹"
                                  : activity.currency === "INR"
                                    ? "₹"
                                    : activity.currency}{" "}
                                {activity.price}
                              </div>
                            )}
                          </div>

                          {/* Select Button */}
                          <div className="mb-4">
                            <Button
                              className={`w-full rounded-lg border-1 font-semibold ${selectedActivityId === activity.id
                                ? "border-[var(--brand-color)] bg-[var(--brand-color)] text-white hover:opacity-90"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onActivityChange(activity.id);
                                onSlotChange(undefined);
                              }}
                            >
                              {selectedActivityId === activity.id
                                ? "Selected"
                                : "Select"}
                            </Button>
                          </div>

                          {/* Distance Content */}
                          <div className="mt-auto">
                            <div className="border-t border-dashed border-gray-300 pt-3">
                              <div className="text-xs text-gray-600">
                                <div className="font-medium mb-1">
                                  Description:
                                </div>
                                <div className="text-gray-500">
                                  {activity.distance
                                    ? activity.distance.length > 80
                                      ? `${activity.distance.substring(
                                        0,
                                        80
                                      )}...`
                                      : activity.distance
                                    : "Distance information not available"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Tooltip>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Mobile Activity Cards */}
            <div className="md:hidden space-y-3 MobileActivityCardsContainer">
              {(showAllActivities ? activities : activities?.slice(0, 3))?.map(
                (activity) => {
                  const isExpanded = expandedActivities.has(activity.id);
                  const isSelected = selectedActivityId === activity.id;
                  const descriptionWords = activity.distance
                    ? activity.distance.split(" ")
                    : [];
                  const shouldShowReadMore = descriptionWords.length > 20;

                  return (
                    <Card
                      key={activity.id}
                      className={`cursor-pointer transition-all duration-200 ${isSelected
                        ? "border-[var(--brand-color)] bg-orange-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      onClick={() => {
                        onActivityChange(activity.id);
                        onSlotChange(undefined);
                      }}
                    >
                      <div className="p-0">
                        {/* Header Row */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <h3
                              className={`text-sm font-semibold ${isSelected ? "text-gray-800" : "text-gray-800"
                                }`}
                            >
                              {activity.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              {activity.discounted_price &&
                                activity.discounted_price !== activity.price ? (
                                <div className="flex flex-col items-end">
                                  <div className="text-xs text-muted-foreground line-through">
                                    {activity.currency === "USD"
                                      ? "₹"
                                      : activity.currency === "INR"
                                        ? "₹"
                                        : activity.currency}{" "}
                                    {activity.price}
                                  </div>
                                  <div
                                    className={`text-base font-bold ${isSelected
                                      ? "text-green-600"
                                      : "text-green-600"
                                      }`}
                                  >
                                    {activity.currency === "USD"
                                      ? "₹"
                                      : activity.currency === "INR"
                                        ? "₹"
                                        : activity.currency}{" "}
                                    {activity.discounted_price}
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`text-base font-bold ${isSelected
                                    ? "text-[var(--brand-color)]"
                                    : "text-gray-800"
                                    }`}
                                >
                                  {activity.currency === "USD"
                                    ? "₹"
                                    : activity.currency === "INR"
                                      ? "₹"
                                      : activity.currency}{" "}
                                  {activity.price}
                                </div>
                              )}
                            </div>
                            <Button
                              size="small"
                              className={`px-3 py-1 text-xs font-medium rounded ${isSelected
                                ? "bg-[var(--brand-color)] text-white"
                                : "bg-gray-100 text-gray-700"
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onActivityChange(activity.id);
                                onSlotChange(undefined);
                              }}
                            >
                              {isSelected ? "Selected" : "Select"}
                            </Button>
                          </div>
                        </div>

                        {/* Description Section */}
                        {activity.distance && (
                          <div className="border-t border-gray-200 pt-2">
                            {/* Show first 2 lines */}
                            <div className="text-xs text-gray-600 leading-relaxed mb-2">
                              {isExpanded ? (
                                activity.distance
                              ) : (
                                <>
                                  {descriptionWords.slice(0, 20).join(" ")}
                                  {shouldShowReadMore && "..."}
                                </>
                              )}
                            </div>

                            {/* Read more button */}
                            {shouldShowReadMore && (
                              <div
                                className="flex items-center justify-between cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpanded(activity.id);
                                }}
                              >
                                <span className="text-xs text-gray-600">
                                  {isExpanded ? "Read less" : "Read more"}
                                </span>
                                <div className="text-gray-400">
                                  {isExpanded ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                }
              )}

              {/* Show More Activities Button */}
              {activities && activities.length > 3 && !showAllActivities && (
                <div className="pt-2">
                  <Button
                    type="default"
                    className="w-full text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowAllActivities(true)}
                  >
                    Show more activities ({activities.length - 3} more)
                  </Button>
                </div>
              )}

              {/* Show Less Button */}
              {showAllActivities && activities && activities.length > 3 && (
                <div className="pt-2">
                  <Button
                    type="default"
                    className="w-full text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowAllActivities(false)}
                  >
                    Show less
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {/* Date and Time Selection - Show only if not in activity only mode */}
      {!showOnlyActivitySelection && (
        <>
          {/* Existing Calendar and Time Slots components */}
          {selectedActivityId && (
            <>
              <div className="date-selection-container">
                <div className="section-header-compact">
                  <label className="section-label-minimal">
                    {experienceTitle === "Bike on Rent in Rishikesh"
                      ? "Select Pickup Date"
                      : "Select Date"}
                  </label>
                </div>

                {/* Horizontal Date Picker */}
                <div className="minimal-date-grid">
                  {next4Days.map((date) => {
                    const isSelected =
                      selectedDate && isSameDay(date, selectedDate);
                    const isDisabled = isDateDisabled(date);

                    return (
                      <div
                        key={date.toISOString()}
                        className={`minimal-date-card ${isSelected ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
                        onClick={() => !isDisabled && onDateChange(date)}
                      >
                        <span className="minimal-date-day">{format(date, "EEE")}</span>
                        <span className="minimal-date-number">{format(date, "MMM d")}</span>
                      </div>
                    );
                  })}

                  {/* More Dates Button */}
                  <Popover
                    content={
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          onDateChange(date);
                          setShowCalendar(false);
                        }}
                        disabled={isDateDisabled}
                        className="rounded-md border"
                      />
                    }
                    title="Select Date"
                    trigger="click"
                    open={showCalendar}
                    onOpenChange={setShowCalendar}
                    placement="bottomRight"
                  >
                    <div className="minimal-date-card more-dates-card">
                      <CalendarIcon className="h-4 w-4" />
                      <span className="minimal-date-day">More</span>
                    </div>
                  </Popover>
                </div>
              </div>
              {selectedDate && (
                <div className="time-selection-container mt-6">
                  <div className="section-header-compact">
                    <label className="section-label-minimal">
                      Available Time Slots
                    </label>
                  </div>

                  {isLoading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-12 bg-gray-50 animate-pulse rounded-xl"></div>
                      ))}
                    </div>
                  ) : timeSlots && timeSlots.length > 0 ? (
                    <div className="minimal-slot-grid">
                      {timeSlots.map((slot) => {
                        const available = isSlotAvailable(slot);
                        const isSelected = selectedSlotId === slot.id;

                        return (
                          <div
                            key={slot.id}
                            className={`minimal-slot-pill ${isSelected ? "selected" : ""} ${!available ? "disabled" : ""}`}
                            onClick={() => available && onSlotChange(isSelected ? undefined : slot.id)}
                          >
                            <span className="minimal-slot-time">{formatTime(slot.start_time)}</span>
                            {!available && <span className="minimal-slot-status">Full</span>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-state-minimal">
                      No time slots available for this date
                    </div>
                  )}
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
