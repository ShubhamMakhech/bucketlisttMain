import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
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
  time_slot_id: string;
  total_participants: number;
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

export const VendorCalendar = () => {
  const { user } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [selectedActivityId, setSelectedActivityId] = useState<string>("all");

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
      return data as Activity[] || [];
    },
    enabled: !!user?.id && !!experiences && experiences.length > 0,
  });

  // Fetch time slots for the selected activity or all activities
  const { data: timeSlots } = useQuery({
    queryKey: ["vendor-time-slots", user?.id, selectedActivityId, experiences],
    queryFn: async () => {
      if (!user?.id || !experiences || experiences.length === 0) return [];

      const experienceIds = experiences.map((exp) => exp.id);
      let query = supabase
        .from("time_slots")
        .select("*")
        .in("experience_id", experienceIds);

      if (selectedActivityId !== "all") {
        query = query.eq("activity_id", selectedActivityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TimeSlot[] || [];
    },
    enabled: !!user?.id && !!experiences && experiences.length > 0,
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
      const startDate = format(currentWeekStart, "yyyy-MM-dd");
      const endDate = format(addDays(currentWeekStart, 6), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("bookings")
        .select("id, booking_date, time_slot_id, total_participants")
        .in("experience_id", experienceIds)
        .gte("booking_date", startDate)
        .lte("booking_date", endDate)
        .neq("status", "cancelled");

      if (error) throw error;
      return data as Booking[] || [];
    },
    enabled: !!user?.id && !!experiences && experiences.length > 0,
  });

  // Helper function to format time from hh:mm:ss to hh:mm
  const formatTime = (time: string): string => {
    if (!time) return "";
    // Split by ':' and take only hours and minutes
    const parts = time.split(':');
    return `${parts[0]}:${parts[1]}`;
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
    
    return Array.from(ranges).sort();
  }, [timeSlots]);

  // Calculate booking data for each slot on each day
  const getSlotBookingData = (date: Date, timeRange: string): SlotBookingData => {
    const [startTime, endTime] = timeRange.split("-");
    
    // Find all slots matching this time range (comparing formatted times)
    const matchingSlots = timeSlots?.filter(
      (slot) => {
        const formattedSlotStart = formatTime(slot.start_time);
        const formattedSlotEnd = formatTime(slot.end_time);
        return formattedSlotStart === startTime && formattedSlotEnd === endTime;
      }
    ) || [];

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
      const slotBookings = bookings?.filter(
        (booking) => {
          // Handle both date formats: "yyyy-MM-dd" and potential timestamp
          const bookingDate = booking.booking_date.split('T')[0]; // Extract date part if it's a timestamp
          return booking.time_slot_id === slot.id && bookingDate === dateStr;
        }
      ) || [];

      totalBooked += slotBookings.reduce((sum, booking) => sum + booking.total_participants, 0);
    });

    const percentage = totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0;

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

  const getProgressContainerColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-100 dark:bg-red-950";
    if (percentage >= 70) return "bg-orange-100 dark:bg-orange-950";
    if (percentage >= 50) return "bg-yellow-100 dark:bg-yellow-950";
    return "bg-green-100 dark:bg-green-950";
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Booking Calendar</h2>
          <p className="text-sm text-muted-foreground">
            Manage and view your weekly bookings
          </p>
        </div>

        {/* Activity Filter */}
        <div className="w-full sm:w-64">
          <Select value={selectedActivityId} onValueChange={setSelectedActivityId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Activity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              {activities?.map((activity) => (
                <SelectItem key={activity.id} value={activity.id}>
                  {activity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handleToday}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Today
              </Button>
              <h3 className="text-lg font-semibold">
                {format(currentWeekStart, "MMM d")} -{" "}
                {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
              </h3>
            </div>

            <Button variant="outline" size="sm" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header Row - Days */}
              <div className="grid grid-cols-8 border-b bg-muted/50">
                <div className="p-4 font-semibold text-sm border-r">
                  Time
                </div>
                {weekDates.map((date, index) => {
                  const isToday = isSameDay(date, new Date());
                  return (
                    <div
                      key={index}
                      className={`p-4 text-center border-r last:border-r-0 ${
                        isToday ? "bg-primary/10" : ""
                      }`}
                    >
                      <div className="text-xs text-muted-foreground uppercase">
                        {format(date, "EEE")}
                      </div>
                      <div
                        className={`text-lg font-semibold ${
                          isToday ? "text-primary" : ""
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
                  No time slots available. Please create time slots for your experiences.
                </div>
              ) : (
                uniqueTimeRanges.map((timeRange) => (
                  <div
                    key={timeRange}
                    className="grid grid-cols-8 border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    {/* Time Column */}
                    <div className="p-4 font-medium text-sm border-r flex items-center">
                      {timeRange}
                    </div>

                    {/* Day Columns */}
                    {weekDates.map((date, index) => {
                      const slotData = getSlotBookingData(date, timeRange);
                      const isToday = isSameDay(date, new Date());

                      return (
                        <div
                          key={index}
                          className={`p-3 border-r last:border-r-0 ${
                            isToday ? "bg-primary/5" : ""
                          }`}
                        >
                          {slotData.capacity > 0 ? (
                            <div className="space-y-2">
                              {/* Progress Bar */}
                              <div className={`rounded-full overflow-hidden h-2 ${getProgressContainerColor(slotData.percentage)}`}>
                                <div
                                  className={`h-full transition-all duration-300 ${getProgressColor(slotData.percentage)}`}
                                  style={{ width: `${slotData.percentage}%` }}
                                />
                              </div>

                              {/* Booking Count */}
                              <div className="text-xs text-center font-medium">
                                <span className={slotData.percentage >= 90 ? "text-red-600" : "text-foreground"}>
                                  {slotData.booked}/{slotData.capacity}
                                </span>
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
    </div>
  );
};
