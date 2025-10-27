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

  // Column width state for resizable columns
  const columnCount = 20; // Total number of columns
  const [columnWidths, setColumnWidths] = React.useState<number[]>(
    Array(columnCount).fill(150) // Default width 150px for each column
  );

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = React.useState<boolean[]>(
    Array(columnCount).fill(true) // All columns visible by default
  );

  const [showColumnSelector, setShowColumnSelector] = React.useState(false);
  const columnSelectorRef = React.useRef<HTMLDivElement>(null);
  
  // Column order state for drag and drop
  const [columnOrder, setColumnOrder] = React.useState<number[]>(
    Array.from({ length: columnCount }, (_, i) => i)
  );
  const [draggedColumnIndex, setDraggedColumnIndex] = React.useState<number | null>(null);
  const [dragOverColumnIndex, setDragOverColumnIndex] = React.useState<number | null>(null);

  // Column headers array
  const columnHeaders = [
    "Title", "Activity", "Contact Number", "Contact Name", "Email",
    "Referred by", "Timeslot", "Date", "No. Of Participants",
    "Notes for guides", "Official Price/ Original Price", "B2B Price",
    "Commission as per vendor", "Website Price", "Discount Coupon",
    "Ticket Price (customer cost)", "Advance paid to bucketlistt (10%)",
    "Payment to be collected by vendor", "Actual Commission to bucketlistt (Net profit)",
    "Amount to be collected from vendor/ '- to be paid'", "Advance + discount (vendor needs this)"
  ];

  // Function to toggle column visibility
  const toggleColumnVisibility = (index: number) => {
    const newVisibility = [...columnVisibility];
    newVisibility[index] = !newVisibility[index];
    setColumnVisibility(newVisibility);
  };

  // Helper function to format currency
  const formatCurrency = (currency: string, amount: number) => {
    const symbol = currency === "INR" ? "₹" : currency;
    return `${symbol} ${amount}`;
  };
  
  // Column drag handlers
  const handleColumnDragStart = (columnIndex: number) => {
    setDraggedColumnIndex(columnIndex);
  };
  
  const handleColumnDragOver = (e: React.DragEvent, columnIndex: number) => {
    e.preventDefault();
    setDragOverColumnIndex(columnIndex);
  };
  
  const handleColumnDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedColumnIndex === null) return;
    
    const newOrder = [...columnOrder];
    const draggedIndexInOrder = newOrder.indexOf(draggedColumnIndex);
    const targetIndexInOrder = newOrder.indexOf(targetIndex);
    
    // Remove dragged item and insert at target position
    newOrder.splice(draggedIndexInOrder, 1);
    newOrder.splice(targetIndexInOrder, 0, draggedColumnIndex);
    
    setColumnOrder(newOrder);
    setDraggedColumnIndex(null);
    setDragOverColumnIndex(null);
  };
  
  const handleColumnDragEnd = () => {
    setDraggedColumnIndex(null);
    setDragOverColumnIndex(null);
  };

  // Function to render cell content based on column index
  const renderCellContent = (columnIndex: number, booking: BookingWithDueAmount, profile: any, activityData: any, timeslot: any, experience: any, currency: string, officialPrice: number, b2bPriceTotal: number, commissionTotal: number, websitePrice: number, discountCoupon: number, ticketPrice: number, advancePaid10: number, paymentToCollectByVendor: number, actualCommissionNet: number, amountToCollectFromVendor: number, advancePlusDiscount: number) => {
    const cells = [
      () => experience?.title || "N/A",
      () => activityData?.name || "N/A",
      () => profile?.phone_number || booking?.booking_participants?.[0]?.phone_number ? (
        <a href={`tel:${profile?.phone_number || booking?.booking_participants?.[0]?.phone_number}`} className="text-blue-600 hover:underline">
          {profile?.phone_number || booking?.booking_participants?.[0]?.phone_number}
        </a>
      ) : "N/A",
      () => profile ? `${profile.first_name} ${profile.last_name}`.trim() : booking?.booking_participants?.[0]?.name || "N/A",
      () => profile?.email || booking?.booking_participants?.[0]?.email || "N/A",
      () => (booking as any)?.referral_code || (booking as any)?.referred_by || "-",
      () => timeslot?.start_time && timeslot?.end_time ? `${formatTime12Hour(timeslot.start_time)} - ${formatTime12Hour(timeslot.end_time)}` : "N/A",
      () => format(new Date(booking.booking_date), "MMM d, yyyy"),
      () => booking?.total_participants || "N/A",
      () => booking.note_for_guide || "-",
      () => formatCurrency(currency, officialPrice),
      () => formatCurrency(currency, b2bPriceTotal),
      () => formatCurrency(currency, commissionTotal),
      () => formatCurrency(currency, websitePrice),
      () => formatCurrency(currency, discountCoupon),
      () => formatCurrency(currency, ticketPrice),
      () => formatCurrency(currency, advancePaid10),
      () => formatCurrency(currency, paymentToCollectByVendor),
      () => formatCurrency(currency, actualCommissionNet),
      () => formatCurrency(currency, amountToCollectFromVendor),
      () => formatCurrency(currency, advancePlusDiscount),
    ];

    return cells[columnIndex] ? cells[columnIndex]() : "N/A";
  };

  // Resize handler for table columns
  const [resizingColumn, setResizingColumn] = React.useState<number | null>(null);
  const [startX, setStartX] = React.useState(0);
  const [startWidth, setStartWidth] = React.useState(0);

  const handleMouseDown = (e: React.MouseEvent, columnIndex: number) => {
    e.preventDefault();
    setResizingColumn(columnIndex);
    setStartX(e.clientX);
    setStartWidth(columnWidths[columnIndex]);
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingColumn !== null) {
        const diff = e.clientX - startX;
        const newWidths = [...columnWidths];
        newWidths[resizingColumn] = Math.max(50, startWidth + diff); // Minimum width 50px
        setColumnWidths(newWidths);
      }
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    if (resizingColumn !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, startX, startWidth, columnWidths]);

  // Click outside to close column selector
  React.useEffect(() => {
    if (!showColumnSelector) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(target)) {
        console.log("Click outside detected, closing column selector");
        setShowColumnSelector(false);
      }
    };

    // Add a small delay to avoid catching the click that opened the dropdown
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showColumnSelector]);

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
              b2bPrice,
              discounted_price,
              discount_percentage,
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
              b2bPrice,
              discounted_price,
              discount_percentage,
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
        return (booking.time_slots?.activities as any)?.id === selectedActivityId;
      });
    }

    // Apply search filter
    if (globalFilter) {
      filtered = filtered.filter((booking) => {
        const searchTerm = globalFilter.toLowerCase();
        return (
          booking.experiences?.title?.toLowerCase().includes(searchTerm) ||
          (booking.time_slots?.activities as any)?.name
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
        const activity = booking.time_slots?.activities as any;
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
    isMobile,
  }: {
    booking: BookingWithDueAmount;
    index: number;
    isMobile: boolean;
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
                {(booking.time_slots?.activities as any)?.name || "N/A"}
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

          {/* Vendor Money Calculation Section - Hidden on mobile */}
          {!isMobile &&
            user?.user_metadata?.role === "vendor" &&
            booking.time_slots?.activities?.b2bPrice &&
            bookingAmount !=
            "N/A" && (
              <div className="border-t pt-3 mt-3">
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 space-y-2">
                  <div className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Money Calculation
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {/* Space reserved for vendor money calculations */}
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        B2B Price:
                      </span>
                      <p className="font-medium">
                        {currency}{" "}
                        {booking.time_slots?.activities?.b2bPrice *
                          booking.total_participants}
                      </p>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Original Price:
                      </span>
                      <p className="font-medium">
                        {currency}{" "}
                        {booking.time_slots?.activities?.price *
                          booking.total_participants}
                      </p>
                    </div>
                    {/* <div className="text-sm">
                      <span className="text-muted-foreground">
                        Website Price:
                      </span>
                      <p className="font-medium">
                        {currency}{" "}
                        {booking.time_slots?.activities?.discounted_price *
                          booking.total_participants}
                      </p>
                    </div> */}
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Commission:
                      </span>
                      <p className="font-medium">
                        {currency}{" "}
                        {(booking.time_slots?.activities?.price -
                          booking.time_slots?.activities?.b2bPrice) *
                          booking.total_participants}
                      </p>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Customer Cost:
                      </span>
                      <p className="font-medium">
                        {currency} {bookingAmount}
                      </p>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Advance Paid:
                      </span>
                      <p className="font-medium">
                        {currency} {bookingAmount - dueAmount}
                      </p>
                    </div>
                    <div className="text-sm">
                      {" "}
                      <span className="text-muted-foreground">
                        Amount to be paid:
                      </span>
                      <p className="font-medium">
                        {currency}{" "}
                        {bookingAmount - (bookingAmount - dueAmount)}
                      </p>
                    </div>
                    <div className="text-sm">
                      {" "}
                      <span className="text-muted-foreground">
                        Amount to be collected from vendor:
                      </span>
                      <p className="font-medium">
                        {currency}{" "}
                        {bookingAmount -
                          booking.time_slots?.activities?.b2bPrice *
                          booking.total_participants -
                          (bookingAmount - dueAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    );
  };

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
              <div className="absolute  left-0 top-full mt-2 w-[280px] p-4 border rounded-lg bg-background space-y-2 shadow-lg max-h-60 overflow-y-auto" style={{ zIndex: 1000 }}>
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
              <div className="absolute  left-0 top-full mt-2 w-[280px] p-4 border rounded-lg bg-background space-y-2 shadow-lg max-h-60 overflow-y-auto" style={{ zIndex: 1000 }}>
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
          <div className="mb-2 flex justify-end" id="UserBookingsColumnSelectorStyles">
            <div className="relative" ref={columnSelectorRef}>
              <Button
                variant="outline"
                onClick={(e) => {
                  console.log("Column button clicked");
                  e.preventDefault();
                  e.stopPropagation();
                  setShowColumnSelector(!showColumnSelector);
                }}
              // className="px-4 py-2 text-sm border border-border rounded-md bg-background hover:bg-accent hover:text-accent-foreground"
              >
                Columns
              </Button>

              {/* Column Selector Dropdown */}
              {showColumnSelector && (
                <div
                  className="absolute right-0 mt-2 w-[300px] p-4 border border-blue-500 rounded-lg bg-white shadow-lg max-h-96 overflow-y-auto z-50"
                  style={{ minHeight: '200px' }}
                >
                  <div className="text-sm font-semibold mb-3 text-gray-900">Select Columns to Display</div>
                  <div className="space-y-2">
                    {columnHeaders.map((header, index) => (
                      <label key={index} className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={columnVisibility[index]}
                          onChange={() => toggleColumnVisibility(index)}
                          className="cursor-pointer"
                        />
                        <span className="text-sm">{header}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setColumnVisibility(Array(columnCount).fill(true))}
                      className="text-xs flex-1"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setColumnVisibility(Array(columnCount).fill(false))}
                      className="text-xs flex-1"
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>
              )}
            </div>
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
        <>
          {/* Mobile: Card Layout */}
          <div id="UserBookingsMobileLayout" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedBookings.map((booking, index) => (
              <BookingCard key={booking.id} booking={booking} index={index} isMobile={isMobile} />
            ))}
          </div>

          {/* Desktop: Table Layout */}
          <div id="UserBookingsDesktopLayout" className="hidden">
            {/* Column Selector Button */}


            <div className="overflow-x-auto">
              <table className="w-full" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    {columnOrder.map((originalIndex) =>
                      columnVisibility[originalIndex] && (
                        <th
                          key={originalIndex}
                          className={`p-3 text-left font-semibold text-xs whitespace-nowrap relative ${draggedColumnIndex === originalIndex ? 'opacity-50' : ''} ${dragOverColumnIndex === originalIndex ? 'border-2 border-blue-500' : ''}`}
                          style={{ width: columnWidths[originalIndex] }}
                          draggable={true}
                          onDragStart={() => handleColumnDragStart(originalIndex)}
                          onDragOver={(e) => handleColumnDragOver(e, originalIndex)}
                          onDrop={(e) => handleColumnDrop(e, originalIndex)}
                          onDragEnd={handleColumnDragEnd}
                        >
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 cursor-move opacity-50 hover:opacity-100" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                            </svg>
                            {columnHeaders[originalIndex]}
                          </span>
                          <div
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleMouseDown(e, originalIndex);
                            }}
                          />
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedBookings.map((booking: BookingWithDueAmount, index) => {
                    const profile = profileMap[booking.user_id];
                    const activity = booking.time_slots?.activities;
                    const timeslot = booking.time_slots;
                    const experience = booking.experiences;
                    const bookingAmount = (booking as any)?.booking_amount || 0;
                    const dueAmount = booking?.due_amount || 0;
                    const currency = activity?.currency || booking?.experiences?.currency || "INR";

                    // Calculate all money values from API data
                    const activityData = activity as any;
                    const originalPrice = activityData?.price || experience?.price || 0;
                    const officialPrice = originalPrice * booking.total_participants;
                    const b2bPrice = activityData?.b2bPrice || 0;
                    const b2bPriceTotal = b2bPrice * booking.total_participants;
                    const commissionPerVendor = originalPrice - b2bPrice;
                    const commissionTotal = commissionPerVendor * booking.total_participants;
                    const discountedPrice = activityData?.discounted_price || 0;
                    const websitePrice = discountedPrice * booking.total_participants;
                    // Calculate discount from booking_amount vs expected price
                    const expectedFullPrice = officialPrice;
                    const discountCoupon = expectedFullPrice - bookingAmount > 0 ? expectedFullPrice - bookingAmount : 0;
                    const ticketPrice = websitePrice - discountCoupon; // Ticket Price = Website Price - Discount Coupon
                    const advancePaid10 = Math.round(bookingAmount * 0.1);
                    const paymentToCollectByVendor = ticketPrice - advancePaid10; // Payment to be collected by vendor = ticketPrice - Advance paid (10%)
                    const actualCommissionNet = ticketPrice - b2bPriceTotal; // Actual Commission (Net profit) = Ticket Price - B2B Price
                    const amountToCollectFromVendor = (bookingAmount - b2bPriceTotal - (bookingAmount - dueAmount));
                    const advancePlusDiscount = advancePaid10 + discountCoupon;

                    return (
                      <tr key={booking.id}>
                        {columnOrder.map((originalIndex) =>
                          columnVisibility[originalIndex] && (
                            <td
                              key={originalIndex}
                              className="p-3 text-sm"
                              title={originalIndex === 0 ? experience?.title || "" : originalIndex === 9 ? booking.note_for_guide || "" : ""}
                            >
                              {renderCellContent(
                                originalIndex,
                                booking,
                                profile,
                                activityData,
                                timeslot,
                                experience,
                                currency,
                                officialPrice,
                                b2bPriceTotal,
                                commissionTotal,
                                websitePrice,
                                discountCoupon,
                                ticketPrice,
                                advancePaid10,
                                paymentToCollectByVendor,
                                actualCommissionNet,
                                amountToCollectFromVendor,
                                advancePlusDiscount
                              )}
                            </td>
                          )
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          {showTodayOnly ? "No bookings for today." : "No bookings found."}
        </div>
      )}
    </div>
  );
};
