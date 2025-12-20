import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Calendar,
  User,
  Phone,
  Users,
  Clock,
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  activity_id: string | null;
  experience_id: string;
}

interface Booking {
  id: string;
  booking_date: string;
  time_slot_id: string | null;
  total_participants: number;
  time_slots?: {
    id: string;
    activity_id: string | null;
    start_time: string;
    end_time: string;
  } | null;
}

interface Activity {
  id: string;
  name: string;
  experience_id: string;
}

interface SlotBookingData {
  slotId: string;
  booked: number;
  capacity: number;
  percentage: number;
}

interface DetailedBooking {
  id: string;
  booking_date: string;
  time_slot_id: string | null;
  total_participants: number;
  contact_person_name: string | null;
  contact_person_number: string | null;
  contact_person_email: string | null;
  booking_participants: Array<{
    name: string;
    email: string;
    phone_number: string;
  }>;
  time_slots: {
    start_time: string;
    end_time: string;
  } | null;
}

export const VendorCalendar = () => {
  const { user } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  const [selectedSlotDate, setSelectedSlotDate] = useState<{
    date: Date;
    timeRange: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch vendor's experiences
  const { data: experiences } = useQuery({
    queryKey: ["vendor-experiences", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("experiences")
        .select("id, title")
        .eq("vendor_id", user.id)
        .eq("is_active", true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch activities for the selected experience or all activities
  const { data: activities } = useQuery({
    queryKey: ["vendor-activities", user?.id, experiences],
    queryFn: async () => {
      if (!user?.id || !experiences || experiences.length === 0) return [];

      const experienceIds = experiences.map((exp) => exp.id);
      const { data, error } = await supabase
        .from("activities")
        .select("id, name, experience_id")
        .in("experience_id", experienceIds)
        .eq("is_active", true);

      if (error) throw error;
      return (data as Activity[]) || [];
    },
    enabled: !!user?.id && !!experiences && experiences.length > 0,
  });

  // Default select the first available activity (no "All Activities")
  useEffect(() => {
    if (!selectedActivityId && activities && activities.length > 0) {
      setSelectedActivityId(activities[0].id);
    }
  }, [activities, selectedActivityId]);

  // Fetch time slots for the selected activity
  const { data: timeSlots } = useQuery({
    queryKey: ["vendor-time-slots", user?.id, selectedActivityId, experiences],
    queryFn: async () => {
      if (
        !user?.id ||
        !experiences ||
        experiences.length === 0 ||
        !selectedActivityId
      )
        return [];

      const experienceIds = experiences.map((exp) => exp.id);
      const query = supabase
        .from("time_slots")
        .select("*")
        .in("experience_id", experienceIds)
        .eq("activity_id", selectedActivityId);

      const { data, error } = await query;
      if (error) throw error;
      return (data as TimeSlot[]) || [];
    },
    enabled:
      !!user?.id &&
      !!experiences &&
      experiences.length > 0 &&
      !!selectedActivityId,
  });

  // Fetch bookings for the current week
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const { data: bookings } = useQuery({
    queryKey: ["vendor-bookings", user?.id, currentWeekStart, experiences],
    queryFn: async () => {
      if (!user?.id || !experiences || experiences.length === 0) return [];

      const experienceIds = experiences.map((exp) => exp.id);
      // Use start and end of day for proper TIMESTAMP comparison
      const startDate = format(currentWeekStart, "yyyy-MM-dd") + "T00:00:00";
      const endDate =
        format(addDays(currentWeekStart, 6), "yyyy-MM-dd") + "T23:59:59";

      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          id, 
          booking_date, 
          time_slot_id, 
          total_participants,
          time_slots (
            id,
            activity_id,
            start_time,
            end_time
          )
        `
        )
        .in("experience_id", experienceIds)
        .gte("booking_date", startDate)
        .lte("booking_date", endDate)
        .neq("status", "cancelled");

      if (error) {
        console.error("Error fetching bookings for calendar:", error);
        throw error;
      }

      console.log("Calendar bookings fetched:", {
        count: data?.length || 0,
        startDate,
        endDate,
        bookings: data,
      });

      return (data as Booking[]) || [];
    },
    enabled: !!user?.id && !!experiences && experiences.length > 0,
  });

  // Helper function to format time from hh:mm:ss to hh:mm
  const formatTime = (time: string): string => {
    if (!time) return "";
    // Split by ':' and take only hours and minutes
    const parts = time.split(":");
    return `${parts[0]}:${parts[1]}`;
  };

  const timeToMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
    return (h || 0) * 60 + (m || 0);
  };

  const formatHourLabel = (hhmm: string) => {
    const [hStr, mStr] = hhmm.split(":");
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10) || 0;
    const isPm = h >= 12;
    const displayHour = ((h + 11) % 12) + 1;
    const suffix = isPm ? "PM" : "AM";
    if (m === 0) return `${displayHour} ${suffix}`;
    return `${displayHour}:${String(m).padStart(2, "0")} ${suffix}`;
  };

  // Generate unique time slots (combining all slots)
  const uniqueTimeRanges = useMemo(() => {
    if (!timeSlots) return [];

    const ranges = new Set<string>();
    timeSlots.forEach((slot) => {
      // Format times to hh:mm before creating range
      const formattedStart = formatTime(slot.start_time);
      const formattedEnd = formatTime(slot.end_time);
      ranges.add(`${formattedStart}-${formattedEnd}`);
    });

    return Array.from(ranges).sort((a, b) => {
      const [aStart] = a.split("-");
      const [bStart] = b.split("-");
      return timeToMinutes(aStart) - timeToMinutes(bStart);
    });
  }, [timeSlots]);

  // Fetch detailed bookings for selected slot
  const { data: detailedBookings } = useQuery({
    queryKey: [
      "detailed-bookings",
      selectedSlotDate?.date,
      selectedSlotDate?.timeRange,
      selectedActivityId,
      experiences,
    ],
    queryFn: async () => {
      if (
        !user?.id ||
        !experiences ||
        experiences.length === 0 ||
        !selectedSlotDate
      )
        return [];

      const [startTime, endTime] = selectedSlotDate.timeRange.split("-");
      const dateStr = format(selectedSlotDate.date, "yyyy-MM-dd");

      // Find matching time slots
      const matchingSlots =
        timeSlots?.filter((slot) => {
          const formattedSlotStart = formatTime(slot.start_time);
          const formattedSlotEnd = formatTime(slot.end_time);
          return (
            formattedSlotStart === startTime && formattedSlotEnd === endTime
          );
        }) || [];

      if (matchingSlots.length === 0) return [];

      const slotIds = matchingSlots.map((slot) => slot.id);

      // Use date range for TIMESTAMP comparison
      const startOfDay = dateStr + "T00:00:00";
      const endOfDay = dateStr + "T23:59:59";

      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          id,
          booking_date,
          time_slot_id,
          total_participants,
          booking_participants (
            name,
            email,
            phone_number
          ),
          time_slots (
            start_time,
            end_time
          )
        `
        )
        .in("time_slot_id", slotIds)
        .gte("booking_date", startOfDay)
        .lte("booking_date", endOfDay)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching detailed bookings:", error);
        throw error;
      }

      // Map the data to DetailedBooking format, handling optional contact fields
      const mappedData = (data || []).map((booking: any) => ({
        id: booking.id,
        booking_date: booking.booking_date,
        time_slot_id: booking.time_slot_id,
        total_participants: booking.total_participants,
        contact_person_name: booking.contact_person_name || null,
        contact_person_number: booking.contact_person_number || null,
        contact_person_email: booking.contact_person_email || null,
        booking_participants: booking.booking_participants || [],
        time_slots: booking.time_slots,
      }));

      return mappedData as DetailedBooking[];
    },
    enabled:
      !!user?.id &&
      !!experiences &&
      experiences.length > 0 &&
      !!selectedSlotDate &&
      !!selectedActivityId,
  });

  // Calculate booking data for each slot on each day
  const getSlotBookingData = (
    date: Date,
    timeRange: string
  ): SlotBookingData => {
    const [startTime, endTime] = timeRange.split("-");

    // Find all slots matching this time range (comparing formatted times)
    const matchingSlots =
      timeSlots?.filter((slot) => {
        const formattedSlotStart = formatTime(slot.start_time);
        const formattedSlotEnd = formatTime(slot.end_time);
        return formattedSlotStart === startTime && formattedSlotEnd === endTime;
      }) || [];

    if (matchingSlots.length === 0) {
      return { slotId: "", booked: 0, capacity: 0, percentage: 0 };
    }

    // Calculate total capacity and bookings
    let totalCapacity = 0;
    let totalBooked = 0;
    const dateStr = format(date, "yyyy-MM-dd");

    matchingSlots.forEach((slot) => {
      totalCapacity += slot.capacity;

      // Find bookings for this slot on this date
      const slotBookings =
        bookings?.filter((booking) => {
          if (!booking.time_slot_id || booking.time_slot_id !== slot.id) {
            return false;
          }

          // Handle both date formats: "yyyy-MM-dd" and potential timestamp
          let bookingDate: string;
          if (booking.booking_date.includes("T")) {
            bookingDate = booking.booking_date.split("T")[0]; // Extract date part if it's a timestamp
          } else {
            bookingDate = booking.booking_date.substring(0, 10); // Take first 10 chars for date
          }

          const matches = bookingDate === dateStr;

          if (matches) {
            console.log("Matched booking:", {
              bookingId: booking.id,
              bookingDate,
              dateStr,
              timeSlotId: booking.time_slot_id,
              slotId: slot.id,
              participants: booking.total_participants,
            });
          }

          return matches;
        }) || [];

      totalBooked += slotBookings.reduce(
        (sum, booking) => sum + booking.total_participants,
        0
      );
    });

    const percentage =
      totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0;

    return {
      slotId: matchingSlots[0]?.id || "",
      booked: totalBooked,
      capacity: totalCapacity,
      percentage,
    };
  };

  const handlePreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const handleToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  // Get progress bar color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-orange-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getCellTrackColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-50 dark:bg-red-950";
    if (percentage >= 70) return "bg-orange-50 dark:bg-orange-950";
    if (percentage >= 50) return "bg-yellow-50 dark:bg-yellow-950";
    return "bg-green-50 dark:bg-green-950";
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation + Activity Filter */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <h3 className="text-base sm:text-lg font-semibold text-center flex-1 sm:flex-none">
                {format(currentWeekStart, "MMM d")} -{" "}
                {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
              </h3>

              <Button variant="outline" size="sm" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="w-full sm:w-72">
              <Select
                value={selectedActivityId}
                onValueChange={setSelectedActivityId}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select Activity" />
                </SelectTrigger>
                <SelectContent>
                  {activities?.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id}>
                      {activity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card className="border-0 shadow-none">
        <CardContent className="p-0 bg-background">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header Row - Days */}
              <div className="grid grid-cols-8 border-b bg-background">
                <div className="p-5 font-semibold text-sm bg-background">
                  Time
                </div>
                {weekDates.map((date, index) => {
                  const isToday = isSameDay(date, new Date());
                  return (
                    <div key={index} className="p-5 text-center bg-background">
                      <div className="text-xs text-muted-foreground uppercase">
                        {format(date, "EEE")}
                      </div>
                      <div
                        className={`mx-auto mt-2 flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold ${
                          isToday
                            ? "bg-brand-primary text-white shadow-sm"
                            : "text-foreground"
                        }`}
                      >
                        {format(date, "d")}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time Slots Rows */}
              {uniqueTimeRanges.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No time slots available. Please create time slots for your
                  experiences.
                </div>
              ) : (
                uniqueTimeRanges.map((timeRange) => (
                  <div
                    key={timeRange}
                    className="grid grid-cols-8 border-b last:border-b-0 hover:bg-muted/10 transition-colors"
                  >
                    {/* Time Column */}
                    <div className="p-4 font-medium text-sm flex items-center bg-background">
                      {formatHourLabel(timeRange.split("-")[0])}
                    </div>

                    {/* Day Columns */}
                    {weekDates.map((date, index) => {
                      const slotData = getSlotBookingData(date, timeRange);

                      return (
                        <div key={index} className="p-3">
                          {slotData.capacity > 0 ? (
                            <div
                              className={`relative h-12 w-full overflow-hidden rounded-md cursor-pointer hover:opacity-90 transition-opacity ${getCellTrackColor(
                                slotData.percentage
                              )}`}
                              title={`${slotData.booked}/${slotData.capacity} - Click to view details`}
                              onClick={() => {
                                if (slotData.booked > 0) {
                                  setSelectedSlotDate({ date, timeRange });
                                  setIsModalOpen(true);
                                }
                              }}
                            >
                              <div
                                className={`absolute inset-y-0 left-0 ${getProgressColor(
                                  slotData.percentage
                                )} opacity-80 transition-all duration-300`}
                                style={{ width: `${slotData.percentage}%` }}
                              />
                              <div className="relative z-10 flex h-full items-center justify-center text-xs font-semibold text-foreground">
                                {slotData.booked}/{slotData.capacity}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-center text-muted-foreground">
                              -
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span>&lt; 50% filled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500" />
              <span>50-69% filled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500" />
              <span>70-89% filled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span>≥ 90% filled</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#6a0fb5]">
              Booking Details
            </DialogTitle>
            {selectedSlotDate && (
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(selectedSlotDate.date, "EEEE, MMMM d, yyyy")}
                  </span>
                </div>
                {detailedBookings?.[0]?.time_slots && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatHourLabel(
                        formatTime(detailedBookings[0].time_slots.start_time)
                      )}{" "}
                      -{" "}
                      {formatHourLabel(
                        formatTime(detailedBookings[0].time_slots.end_time)
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {!detailedBookings || detailedBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bookings found for this time slot.
              </div>
            ) : detailedBookings.length === 1 ? (
              // Single booking - display as card
              <Card className="border-2 border-[#940fdb]/20 hover:border-[#940fdb]/40 transition-colors">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold text-[#6a0fb5]">
                      <User className="h-5 w-5" />
                      <span>
                        {detailedBookings[0].contact_person_name ||
                          detailedBookings[0].booking_participants[0]?.name ||
                          "N/A"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-[#940fdb]" />
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Contact Number
                          </div>
                          <div className="font-medium">
                            {detailedBookings[0].contact_person_number ||
                              detailedBookings[0].booking_participants[0]
                                ?.phone_number ||
                              "N/A"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-[#940fdb]" />
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Participants
                          </div>
                          <div className="font-medium">
                            {detailedBookings[0].total_participants}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Multiple bookings - display as cards
              <div className="space-y-4">
                <div className="text-sm font-semibold text-[#6a0fb5]">
                  {detailedBookings.length} Booking
                  {detailedBookings.length > 1 ? "s" : ""}
                </div>
                {detailedBookings.map((booking) => (
                  <Card
                    key={booking.id}
                    className="border-2 border-[#940fdb]/20 hover:border-[#940fdb]/40 transition-colors"
                  >
                    <CardContent className="p-5">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 font-semibold text-[#6a0fb5]">
                          <User className="h-4 w-4" />
                          <span>
                            {booking.contact_person_name ||
                              booking.booking_participants[0]?.name ||
                              "N/A"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-[#940fdb]" />
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Contact
                              </div>
                              <div className="font-medium">
                                {booking.contact_person_number ||
                                  booking.booking_participants[0]
                                    ?.phone_number ||
                                  "N/A"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-[#940fdb]" />
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Participants
                              </div>
                              <div className="font-medium">
                                {booking.total_participants}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
