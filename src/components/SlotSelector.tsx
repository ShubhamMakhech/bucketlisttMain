// @ts-nocheck
import React, { useState, useRef } from "react";
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
  ArrowLeft,
  Home,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  Star,
} from "lucide-react";
import { format, addDays, isSameDay } from "date-fns";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { useNavigate } from "react-router-dom";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "@/components/GlobalCss/ExperienceDetailGallery.css";

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
  experienceTitle?: string; // Add experience title for breadcrumb
  onClose?: () => void; // Add onClose handler for breadcrumb
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
  selectedSlotId,
  selectedActivityId, // Add this
  participantCount,
  onDateChange,
  onSlotChange,
  onActivityChange, // Add this
  showOnlyActivitySelection = false,
  showOnlyDateAndTime = false,
  experienceTitle,
  onClose,
}: SlotSelectorProps) => {
  const navigate = useNavigate();
  const swiperRef = useRef<any>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isDistanceExpanded, setIsDistanceExpanded] = useState(false);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(
    new Set()
  );
  const [showAllActivities, setShowAllActivities] = useState(false);

  // Fetch experience data if not provided
  const { data: experience } = useQuery({
    queryKey: ["experience-data", experienceId],
    queryFn: async () => {
      if (!experienceId) return null;
      const { data, error } = await supabase
        .from("experiences")
        .select("title, image_url")
        .eq("id", experienceId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!experienceId && !experienceTitle,
  });

  const displayTitle = experienceTitle || experience?.title || "Booking Details";

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

  // Generate next 9 days for date picker
  const getNext9Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 9; i++) {
      days.push(addDays(today, i));
    }
    return days;
  };

  const next9Days = getNext9Days();

  // Query to get available dates (dates with available slots)
  const { data: availableDates } = useQuery({
    queryKey: ["available-dates", experienceId, participantCount],
    queryFn: async () => {
      // Get all time slots for the experience
      const { data: slots, error: slotsError } = await supabase
        .from("time_slots")
        .select("*")
        .eq("experience_id", experienceId);

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

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    if (!amount) return "₹0";
    return currency === "INR" || currency === "USD" ? `₹${amount}` : `${currency} ${amount}`;
  };

  // Get activity image or fallback
  const getActivityImage = (activity: Activity) => {
    return activity?.image_url || experience?.image_url || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop";
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
    return ("")
  }

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
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="booking-breadcrumb">
        <button
          className="breadcrumb-back-button"
          onClick={() => {
            if (onClose) {
              onClose();
            } else {
              navigate(-1);
            }
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Activity</span>
        </button>
        <div className="breadcrumb-divider"></div>
        <button className="breadcrumb-item" onClick={() => navigate('/')}>
          <Home size={14} />
          <span>Home</span>
        </button>
        <ChevronRight size={12} className="breadcrumb-separator" />
        <button
          className="breadcrumb-item"
          onClick={() => {
            if (onClose) {
              onClose();
            } else {
              navigate(-1);
            }
          }}
        >
          <span>Activities</span>
        </button>
        <ChevronRight size={12} className="breadcrumb-separator" />
        <span className="breadcrumb-item active">
          {displayTitle}
        </span>
      </div>

      {/* Activity Selection - Show only if not in date/time only mode */}
      {!showOnlyDateAndTime && (
        <>
          {/* Add Activity Selector */}
          <div style={{ marginTop: "5px" }}>
            {/* <label className="text-base font-semibold mb-3 block textSmall">Select Activity</label> */}

            {/* Desktop Activity Swiper Slider */}
            <div className="activity-selection-container hidden md:block">
              <h3 className="activity-selection-title">Select Activity</h3>
              <div className="activity-swiper-wrapper">
                <div className="activity-swiper-controls">
                  <button
                    className="swiper-nav-btn prev"
                    onClick={() => swiperRef.current?.slidePrev()}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    className="swiper-nav-btn next"
                    onClick={() => swiperRef.current?.slideNext()}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <Swiper
                  modules={[Navigation, Pagination]}
                  spaceBetween={13}
                  slidesPerView="auto"
                  onSwiper={(swiper) => (swiperRef.current = swiper)}
                  className="activity-swiper-new"
                >
                  {activities?.map((activity) => {
                    const isSelected = selectedActivityId === activity.id;
                    const hasDiscount = activity.discounted_price && activity.discounted_price !== activity.price;
                    const displayPrice = hasDiscount ? activity.discounted_price : activity.price;
                    const rating = activity.rating || 4.71;

                    return (
                      <SwiperSlide key={activity.id} className="activity-slide-new">
                        <div
                          className={`activity-card-new ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            onActivityChange(activity.id);
                            onSlotChange(undefined);
                          }}
                        >
                          {/* Image Section */}
                          <div className="activity-card-new__image">
                            <img
                              src={getActivityImage(activity)}
                              alt={activity.name}
                              loading="lazy"
                            />
                            {/* Date Badge */}
                            {selectedDate && (
                              <div className="activity-card-new__date-badge">
                                <span className="month">{format(selectedDate, "MMM").toUpperCase()}</span>
                                <span className="day">{format(selectedDate, "d")}</span>
                                <span className="dow">{format(selectedDate, "EEE").toUpperCase()}</span>
                              </div>
                            )}
                            {/* Bookmark */}
                            <button className="activity-card-new__bookmark">
                              <Bookmark size={18} />
                            </button>
                          </div>

                          {/* Content Section */}
                          <div className="activity-card-new__content">
                            {/* Rating & Avatars */}
                            <div className="activity-card-new__meta">
                              <div className="rating">
                                <Star size={13} fill="#000" />
                                <span>{rating.toFixed(2)}</span>
                              </div>
                              <div className="avatars">
                                <div className="avatar">A</div>
                                <div className="avatar">B</div>
                                <div className="avatar pill">+5</div>
                              </div>
                              <span className="joined">joined</span>
                            </div>

                            {/* Title */}
                            <h4 className="activity-card-new__title">{activity.name}</h4>

                            {/* Description */}
                            <p className="activity-card-new__desc">
                              {activity.distance
                                ? activity.distance.length > 80
                                  ? `${activity.distance.substring(0, 80)}...`
                                  : activity.distance
                                : "Experience the thrill with trusted guides."}
                            </p>

                            {/* Price & CTA Row */}
                            <div className="activity-card-new__footer">
                              <div className="price-section">
                                {hasDiscount ? (
                                  <>
                                    <div className="price-original">
                                      {formatCurrency(activity.price, activity.currency)}
                                    </div>
                                    <div className="price-discounted">
                                      {formatCurrency(displayPrice, activity.currency)}
                                    </div>
                                  </>
                                ) : (
                                  <div className="price">
                                    {formatCurrency(displayPrice, activity.currency)}
                                  </div>
                                )}
                              </div>
                              <button
                                className={`activity-card-new__cta ${isSelected ? "selected" : ""}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onActivityChange(activity.id);
                                  onSlotChange(undefined);
                                }}
                              >
                                {isSelected ? "✓ Selected" : "Reserve your booking"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              </div>
            </div>

            {/* Mobile Activity Cards */}
            <div className="md:hidden activity-selection-container">
              <h3 className="activity-selection-title">Select Activity</h3>
              <div className="mobile-activity-list-new">
                {(showAllActivities ? activities : activities?.slice(0, 3))?.map(
                  (activity) => {
                    const isExpanded = expandedActivities.has(activity.id);
                    const isSelected = selectedActivityId === activity.id;
                    const hasDiscount = activity.discounted_price && activity.discounted_price !== activity.price;
                    const displayPrice = hasDiscount ? activity.discounted_price : activity.price;
                    const rating = activity.rating || 4.71;
                    const descriptionWords = activity.distance ? activity.distance.split(" ") : [];
                    const shouldShowReadMore = descriptionWords.length > 12;

                    return (
                      <div
                        key={activity.id}
                        className={`activity-card-mobile-new ${isSelected ? "selected" : ""}`}
                        onClick={() => {
                          onActivityChange(activity.id);
                          onSlotChange(undefined);
                        }}
                      >
                        {/* Image Section */}
                        <div className="activity-card-mobile-new__image">
                          <img
                            src={getActivityImage(activity)}
                            alt={activity.name}
                            loading="lazy"
                          />
                          {/* Date Badge */}
                          {selectedDate && (
                            <div className="activity-card-mobile-new__date-badge">
                              <span className="month">{format(selectedDate, "MMM").toUpperCase()}</span>
                              <span className="day">{format(selectedDate, "d")}</span>
                              <span className="dow">{format(selectedDate, "EEE").toUpperCase()}</span>
                            </div>
                          )}
                          {/* Bookmark */}
                          <button
                            className="activity-card-mobile-new__bookmark"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Bookmark size={16} />
                          </button>
                        </div>

                        {/* Content Section */}
                        <div className="activity-card-mobile-new__content">
                          {/* Rating & Avatars */}
                          <div className="activity-card-mobile-new__meta">
                            <div className="rating">
                              <Star size={11} fill="#000" />
                              <span>{rating.toFixed(2)}</span>
                            </div>
                            <div className="avatars">
                              <div className="avatar">A</div>
                              <div className="avatar">B</div>
                              <div className="avatar pill">+5</div>
                            </div>
                            <span className="joined">joined</span>
                          </div>

                          {/* Title */}
                          <h4 className="activity-card-mobile-new__title">{activity.name}</h4>

                          {/* Description */}
                          <p className="activity-card-mobile-new__desc">
                            {isExpanded
                              ? activity.distance || "Experience the thrill with trusted guides."
                              : activity.distance
                                ? `${descriptionWords.slice(0, 12).join(" ")}${shouldShowReadMore ? "..." : ""}`
                                : "Experience the thrill with trusted guides."}
                          </p>

                          {shouldShowReadMore && (
                            <button
                              className="read-more-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(activity.id);
                              }}
                            >
                              {isExpanded ? "Read less" : "Read more"}
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          )}

                          {/* Price & CTA Row */}
                          <div className="activity-card-mobile-new__footer">
                            <div className="price-section">
                              {hasDiscount ? (
                                <>
                                  <div className="price-original">
                                    {formatCurrency(activity.price, activity.currency)}
                                  </div>
                                  <div className="price-discounted">
                                    {formatCurrency(displayPrice, activity.currency)}
                                  </div>
                                </>
                              ) : (
                                <div className="price">
                                  {formatCurrency(displayPrice, activity.currency)}
                                </div>
                              )}
                            </div>
                            <button
                              className={`activity-card-mobile-new__cta ${isSelected ? "selected" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onActivityChange(activity.id);
                                onSlotChange(undefined);
                              }}
                            >
                              {isSelected ? "✓ Selected" : "Reserve your booking"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}

                {/* Show More Activities Button */}
                {activities && activities.length > 3 && !showAllActivities && (
                  <button
                    className="show-more-btn"
                    onClick={() => setShowAllActivities(true)}
                  >
                    Show more activities ({activities.length - 3} more)
                  </button>
                )}

                {/* Show Less Button */}
                {showAllActivities && activities && activities.length > 3 && (
                  <button
                    className="show-more-btn"
                    onClick={() => setShowAllActivities(false)}
                  >
                    Show less
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Date and Time Selection - Show only if not in activity only mode */}
      {!showOnlyActivitySelection && (
        <>
          {/* Date & Time Selection Container */}
          {selectedActivityId && (
            <div className="date-time-selection-container" style={{ marginTop: "5px" }}>
              {/* Left Column - Date Selection */}
              <div className="date-selection-column">
                <h3 className="selection-title">Select a date</h3>
                <div className="date-grid">
                  {next9Days.slice(0, 9).map((date) => {
                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                    const isDisabled = isDateDisabled(date);
                    return (
                      <div
                        key={date.toISOString()}
                        className={`date-cube ${isDisabled ? "disabled" : ""} ${isSelected ? "selected" : ""}`}
                        onClick={() => !isDisabled && onDateChange(date)}
                      >
                        <div className="date-cube__day">{format(date, "EEE")}</div>
                        <div className="date-cube__date">{format(date, "MMM d")}</div>
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
                    placement="bottomLeft"
                  >
                    <div className="date-cube more-dates">
                      <CalendarIcon size={20} />
                      <div className="more-dates__text">More<br />dates</div>
                    </div>
                  </Popover>
                </div>
              </div>

              {/* Right Column - Time Slots */}
              {selectedDate && (
                <div className="timeslot-selection-column">
                  <h3 className="selection-title">Select Timeslots</h3>
                  {isLoading ? (
                    <div className="time-slots-skeleton">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="skeleton-item" />
                      ))}
                    </div>
                  ) : timeSlots && timeSlots.length > 0 ? (
                    <div className="time-slot-grid-new">
                      {timeSlots.map((slot) => {
                        const available = isSlotAvailable(slot);
                        const isSelected = selectedSlotId === slot.id;
                        return (
                          <div
                            key={slot.id}
                            className={`time-slot-cube ${isSelected ? "selected" : ""} ${!available ? "disabled" : ""}`}
                            onClick={() => available && onSlotChange(isSelected ? undefined : slot.id)}
                          >
                            <Clock size={16} />
                            <span>{formatTime(slot.start_time)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="time-slot-empty">
                      No time slots available for this date
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
