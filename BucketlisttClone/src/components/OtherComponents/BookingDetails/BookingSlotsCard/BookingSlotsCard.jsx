import React, { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, Badge, Button as AntButton, Popover, Tooltip } from "antd";
import { Calendar } from "@/components/ui/calendar";
import {
    Clock,
    Users,
    Calendar as CalendarIcon,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Bookmark,
    Star,
} from "lucide-react";
import { format, addDays, isSameDay } from "date-fns";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./BookingSlotsCard.css";

const BookingSlotsCard = ({
    experience,
    isMobile,
    selectedDate,
    selectedSlotId,
    selectedActivityId,
    participantCount,
    onDateChange,
    onSlotChange,
    onActivityChange,
}) => {
    const [showCalendar, setShowCalendar] = useState(false);
    const [expandedActivities, setExpandedActivities] = useState(new Set());
    const [showAllActivities, setShowAllActivities] = useState(false);
    const swiperRef = useRef(null);

    const toggleExpanded = (activityId) => {
        const next = new Set(expandedActivities);
        if (next.has(activityId)) next.delete(activityId);
        else next.add(activityId);
        setExpandedActivities(next);
    };

    const getNext7Days = () => {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 9; i++) days.push(addDays(today, i));
        return days;
    };

    const next7Days = getNext7Days();

    const { data: availableDates } = useQuery({
        queryKey: ["available-dates", experience?.id, participantCount],
        queryFn: async () => {
            const { data: slots, error: slotsError } = await supabase
                .from("time_slots")
                .select("*")
                .eq("experience_id", experience?.id);
            if (slotsError) throw slotsError;

            const { data: bookings, error: bookingsError } = await supabase
                .from("bookings")
                .select("time_slot_id, total_participants, booking_date")
                .eq("experience_id", experience?.id)
                .eq("status", "confirmed");
            if (bookingsError) throw bookingsError;

            const bookingsByDate = bookings.reduce((acc, booking) => {
                const dateStr = booking.booking_date.split("T")[0];
                if (!acc[dateStr]) acc[dateStr] = [];
                acc[dateStr].push(booking);
                return acc;
            }, {});

            const available = new Set();
            const today = new Date();
            for (let i = 0; i < 365; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() + i);
                const dateStr = checkDate.toISOString().split("T")[0];

                const hasAvailable = slots.some((slot) => {
                    const slotBookings =
                        bookingsByDate[dateStr]?.filter((b) => b.time_slot_id === slot.id) ||
                        [];
                    const bookedCount = slotBookings.reduce(
                        (sum, b) => sum + b.total_participants,
                        0
                    );
                    const availableSpots = slot.capacity - bookedCount;
                    return availableSpots >= participantCount;
                });

                if (hasAvailable) available.add(dateStr);
            }

            return available;
        },
        enabled: !!experience?.id,
    });

    const { data: activities } = useQuery({
        queryKey: ["activities", experience?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("activities")
                .select("*")
                .eq("experience_id", experience?.id)
                .eq("is_active", true)
                .order("display_order");
            if (error) throw error;
            return data;
        },
        enabled: !!experience?.id,
    });

    const { data: timeSlots, isLoading } = useQuery({
        queryKey: ["time-slots", experience?.id, selectedDate, selectedActivityId],
        queryFn: async () => {
            if (!selectedDate || !selectedActivityId) return [];

            const dateStr = selectedDate.toISOString().split("T")[0];
            const { data: slots, error: slotsError } = await supabase
                .from("time_slots")
                .select("*")
                .eq("experience_id", experience?.id)
                .eq("activity_id", selectedActivityId);
            if (slotsError) throw slotsError;

            const { data: bookings, error: bookingsError } = await supabase
                .from("bookings")
                .select("time_slot_id, total_participants")
                .eq("experience_id", experience?.id)
                .gte("booking_date", `${dateStr}T00:00:00`)
                .lt("booking_date", `${dateStr}T23:59:59`)
                .eq("status", "confirmed");
            if (bookingsError) throw bookingsError;

            const slotsWithAvailability = slots.map((slot) => {
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
            });

            return slotsWithAvailability;
        },
        enabled: !!experience?.id && !!selectedDate && !!selectedActivityId,
    });

    const formatTime = (time) => {
        const [hours, minutes] = time.split(":");
        const hour24 = parseInt(hours);
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const ampm = hour24 >= 12 ? "PM" : "AM";
        return `${hour12}:${minutes} ${ampm}`;
    };

    const isSlotAvailable = (slot) => slot.available_spots >= participantCount;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isDateDisabled = (date) => {
        if (date < today) return true;
        if (!availableDates) return false;
        const dateStr = date.toISOString().split("T")[0];
        return !availableDates.has(dateStr);
    };

    // Format currency
    const formatCurrency = (amount, currency) => {
        if (!amount) return "₹0";
        return currency === "INR" || currency === "USD" ? `₹${amount}` : `${currency} ${amount}`;
    };

    // Get activity image or fallback
    const getActivityImage = (activity) => {
        return activity?.image_url || experience?.image_url || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop";
    };

    return (
        <div className="booking-slots-card">
            <div className="booking-slots-card__body">
                {/* Activity selection - Desktop Swiper with new card design */}
                {!isMobile && (
                    <div className="activity-selection-container">
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
                )}

                {/* Mobile activity list - New card design */}
                {isMobile && (
                    <div className="activity-selection-container">
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

                            {activities && activities.length > 3 && !showAllActivities && (
                                <button
                                    className="show-more-btn"
                                    onClick={() => setShowAllActivities(true)}
                                >
                                    Show more activities ({activities.length - 3} more)
                                </button>
                            )}

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
                )}

                {/* Date & Time Selection Container */}
                {selectedActivityId && (
                    <div className="date-time-selection-container">
                        {/* Left Column - Date Selection */}
                        <div className="date-selection-column">
                            <h3 className="selection-title">Select a date</h3>
                            <div className="date-grid">
                                {next7Days.slice(0, 7).map((date) => {
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
            </div>
        </div>
    );
};

export default BookingSlotsCard;
