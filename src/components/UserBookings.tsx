// @ts-nocheck

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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Filter,
  X,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Edit,
  Save,
  XCircle,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { DatePicker, ConfigProvider } from "antd";
import dayjs from "dayjs";
import "./UserBookingsMobileCard.css";

interface BookingWithDueAmount {
  due_amount?: number;
  [key: string]: any;
}

export const UserBookings = () => {
  const { user } = useAuth();
  console.log("user", user);
  const { isAgent, isAdmin, isVendor } = useUserRole();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for editing admin notes
  const [editingAdminNote, setEditingAdminNote] = React.useState<{
    bookingId: string;
    note: string;
  } | null>(null);
  const [adminNoteDialogOpen, setAdminNoteDialogOpen] = React.useState(false);
  const [cancelBookingDialogOpen, setCancelBookingDialogOpen] =
    React.useState(false);
  const [bookingToCancel, setBookingToCancel] = React.useState<{
    id: string;
    title?: string;
  } | null>(null);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sortBy, setSortBy] = React.useState<
    number | "booking_date" | "title" | "status"
  >(22); // Default to Booking Created At column (index 22)
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [showTodayOnly, setShowTodayOnly] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<string>("");
  const [selectedEndDate, setSelectedEndDate] = React.useState<string>("");
  const [showDateRangePicker, setShowDateRangePicker] = React.useState(false);
  const [selectedActivityId, setSelectedActivityId] = React.useState<
    string | null
  >(null);
  const [showActivityFilter, setShowActivityFilter] = React.useState(false);
  const [selectedTimeslotId, setSelectedTimeslotId] = React.useState<
    string | null
  >(null);
  const [showTimeslotFilter, setShowTimeslotFilter] = React.useState(false);
  const [selectedExperienceId, setSelectedExperienceId] = React.useState<
    string | null
  >(null);
  const [showExperienceFilter, setShowExperienceFilter] = React.useState(false);
  const [selectedAgentId, setSelectedAgentId] = React.useState<string | null>(
    null
  );
  const [showAgentFilter, setShowAgentFilter] = React.useState(false);
  const [selectedVendorId, setSelectedVendorId] = React.useState<string | null>(
    null
  );
  const [showVendorFilter, setShowVendorFilter] = React.useState(false);
  const [selectedBookingType, setSelectedBookingType] = React.useState<
    "online" | "offline" | "canceled" | null
  >(null);
  const [showBookingTypeFilter, setShowBookingTypeFilter] =
    React.useState(false);
  const [cancelingBookingId, setCancelingBookingId] = React.useState<
    string | null
  >(null);

  // Excel-like column filters state
  const [columnFilters, setColumnFilters] = React.useState<
    Record<number, string[]>
  >({});
  const [openFilterDropdown, setOpenFilterDropdown] = React.useState<
    number | null
  >(null);
  const [filterDropdownPosition, setFilterDropdownPosition] = React.useState<{
    top: number;
    left: number;
  } | null>(null);
  const [filterSearchQueries, setFilterSearchQueries] = React.useState<
    Record<number, string>
  >({});
  const filterDropdownRefs = React.useRef<
    Record<number, HTMLDivElement | null>
  >({});
  const headerRefs = React.useRef<Record<number, HTMLTableCellElement | null>>(
    {}
  );

  // Column width state for resizable columns
  const columnCount = 24; // Total number of columns (added Admin Note)
  const [columnWidths, setColumnWidths] = React.useState<number[]>(
    Array(columnCount).fill(100) // Default width 100px for each column (compact)
  );

  // Column visibility state - default visible columns only
  // Default visible: Activity (1), Contact Name (3), Contact Number (2),
  // No. Of Participants (8), Payment to be collected by vendor (18),
  // Timeslot (6), Amount to be collected from vendor (20), Booking Type (10)
  // Index 11: "Official Price/ Original Price" (expectedFullPrice) - shifted by 1
  // Index 13: "Commission as per vendor" (commissionTotal/commissionPerVendor) - shifted by 1
  // Index 14: "Website Price" (discountedPrice) - shifted by 1
  // Index 15: "Discount Coupon" - shifted by 1
  const initialVisibility = React.useMemo(() => {
    const visibility = Array(columnCount).fill(false); // Start with all hidden
    // Set default visible columns
    visibility[1] = true; // Activity
    visibility[2] = true; // Contact Number
    visibility[3] = true; // Contact Name
    visibility[7] = true; // Date
    visibility[6] = true; // Timeslot
    visibility[8] = true; // No. Of Participants
    visibility[10] = true; // Booking Type
    // visibility[16] = true; // Advance paid to bucketlistt (10%)
    visibility[18] = true; // Payment to be collected by vendor (shifted by 1)
    visibility[20] = true; // Amount to be collected from vendor/ '- to be paid' (shifted by 1)
    visibility[21] = true; // Amount to be collected from vendor/ '- to be paid' (shifted by 1)

    // Admin Note - only visible to admins
    if (isAdmin) {
      visibility[23] = true; // Admin Note
    }

    // Ensure agent restrictions are applied
    if (isAgent) {
      visibility[11] = false; // Official Price/ Original Price (shifted by 1)
      visibility[13] = false; // Commission as per vendor (shifted by 1)
      visibility[14] = false; // Website Price (shifted by 1)
      visibility[15] = false; // Discount Coupon (shifted by 1)
      visibility[23] = false; // Admin Note - not visible to agents
    }
    return visibility;
  }, [isAgent, isAdmin, columnCount]);

  const [columnVisibility, setColumnVisibility] =
    React.useState<boolean[]>(initialVisibility);

  // Update column visibility when isAgent or isAdmin changes
  React.useEffect(() => {
    setColumnVisibility((prev) => {
      const newVisibility = [...prev];
      // Ensure agent restrictions are applied
      if (isAgent) {
        newVisibility[11] = false; // Official Price/ Original Price (shifted by 1)
        newVisibility[13] = false; // Commission as per vendor (shifted by 1)
        newVisibility[14] = false; // Website Price (shifted by 1)
        newVisibility[15] = false; // Discount Coupon (shifted by 1)
        newVisibility[23] = false; // Admin Note - not visible to agents
      }
      // Admin Note - only visible to admins
      if (isAdmin) {
        newVisibility[23] = true; // Admin Note
      } else if (!isAdmin) {
        newVisibility[23] = false; // Hide Admin Note for non-admins
      }
      return newVisibility;
    });
  }, [isAgent, isAdmin]);

  const [showColumnSelector, setShowColumnSelector] = React.useState(false);
  const columnSelectorRef = React.useRef<HTMLDivElement>(null);

  // Column order state for drag and drop
  const [columnOrder, setColumnOrder] = React.useState<number[]>(
    Array.from({ length: columnCount }, (_, i) => i)
  );
  const [draggedColumnIndex, setDraggedColumnIndex] = React.useState<
    number | null
  >(null);
  const [dragOverColumnIndex, setDragOverColumnIndex] = React.useState<
    number | null
  >(null);

  // Column headers array
  const columnHeaders = [
    "Title",
    "Activity",
    "Contact Number",
    "Contact Name",
    "Email",
    "Referred by",
    "Timeslot",
    "Date",
    "No. Of Participants",
    "Notes for guides",
    "Booking Type",
    "Official Price/ Original Price",
    "B2B Price",
    "Commission as per vendor",
    "Website Price",
    "Discount Coupon",
    "Ticket Price (customer cost)",
    "Advance paid",
    "Pending amount from customer",
    "Net Commission",
    "( - Net from agent) / to agent",
    "Advance + discount",
    "Booking Created At",
    "Admin Note",
  ];

  // Function to toggle column visibility
  const toggleColumnVisibility = (index: number) => {
    // Prevent agents from showing hidden columns
    if (
      isAgent &&
      (index === 10 || index === 12 || index === 13 || index === 14)
    ) {
      return; // Don't allow toggling these columns for agents
    }
    // Prevent non-admins from showing admin note
    if (index === 23 && !isAdmin) {
      return; // Don't allow toggling admin note for non-admins
    }
    const newVisibility = [...columnVisibility];
    newVisibility[index] = !newVisibility[index];
    setColumnVisibility(newVisibility);
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

  // Helper function to format currency
  const formatCurrency = (currency: string, amount: number) => {
    const symbol = currency === "INR" ? "₹" : currency;
    return `${symbol} ${Math.round(amount)}`;
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
  const renderCellContent = (
    columnIndex: number,
    booking: BookingWithDueAmount,
    profile: any,
    activityData: any,
    timeslot: any,
    experience: any,
    currency: string,
    officialPrice: number,
    b2bPriceTotal: number,
    commissionTotal: number,
    websitePrice: number,
    discountCoupon: number,
    ticketPrice: number,
    advancePaid10: number,
    paymentToCollectByVendor: number,
    actualCommissionNet: number,
    amountToCollectFromVendor: number,
    advancePlusDiscount: number
  ) => {
    // Check if this is an offline booking
    const isOfflineBooking = (booking as any)?.type === "offline";

    // If user is not an agent but booking is an agent booking, hide sensitive columns
    const hiddenColumnsForAgentBookings = [11, 13, 14, 15]; // Official Price, Commission, Website Price, Discount Coupon (shifted by 1)
    if (
      !isAgent &&
      (booking as any)?.isAgentBooking === true &&
      hiddenColumnsForAgentBookings.includes(columnIndex)
    ) {
      return "-";
    }

    // For offline bookings, show "-" for calculation columns except ticket price
    // But show all fields for admins viewing offline bookings
    const calculationColumns = [11, 12, 13, 14, 15, 17, 18, 19, 20, 21]; // Official Price, B2B Price, Commission, Website Price, Discount Coupon, Advance, Payment to collect, Commission Net, Amount to collect, Advance+Discount
    if (
      isOfflineBooking &&
      calculationColumns.includes(columnIndex) &&
      !isAdmin
    ) {
      return "-";
    }

    const cells = [
      () => experience?.title || "N/A",
      () => activityData?.name || "N/A",
      () =>
        booking.contact_person_number ||
        profile?.phone_number ||
        booking?.booking_participants?.[0]?.phone_number ? (
          <a
            href={`tel:${
              booking.contact_person_number ||
              profile?.phone_number ||
              booking?.booking_participants?.[0]?.phone_number
            }`}
            className="text-blue-600 hover:underline text-xs"
          >
            {booking.contact_person_number ||
              profile?.phone_number ||
              booking?.booking_participants?.[0]?.phone_number}
          </a>
        ) : (
          "N/A"
        ),
      () =>
        booking.contact_person_name || profile
          ? `${booking.contact_person_name || profile.first_name} `.trim()
          : booking?.booking_participants?.[0]?.name || "N/A",
      () =>
        booking.contact_person_email ||
        profile?.email ||
        booking?.booking_participants?.[0]?.email ||
        "N/A",
      () =>
        (booking as any)?.referral_code || (booking as any)?.referred_by || "-",
      () => {
        const bookingTypeRender = (booking as any)?.type || "online";
        if (bookingTypeRender === "canceled") return "Canceled";
        return timeslot?.start_time && timeslot?.end_time
          ? `${formatTime12Hour(timeslot.start_time)} - ${formatTime12Hour(
              timeslot.end_time
            )}`
          : isOfflineBooking
          ? "Offline"
          : "N/A";
      },
      () => format(new Date(booking.booking_date), "MMM d, yyyy"),
      () => booking?.total_participants || "N/A",
      () => booking.note_for_guide || "-",
      () => {
        // Inline logic to get booking type display
        const bookingType = (booking as any)?.type || "online";
        const bookedBy = (booking as any)?.booked_by;
        let bookingTypeDisplay = "";

        if (bookingType === "canceled") {
          bookingTypeDisplay = "Canceled";
        } else if (bookingType === "online") {
          bookingTypeDisplay = "Bucketlistt";
        } else if (bookingType === "offline" && bookedBy) {
          const bookedByRole = bookedByRoleMap?.[bookedBy];
          if (bookedByRole === "admin") {
            bookingTypeDisplay = "Admin-offline";
          } else if (bookedByRole === "vendor") {
            bookingTypeDisplay = "offline";
          } else if (
            bookedByRole === "agent" ||
            (booking as any)?.isAgentBooking
          ) {
            const bookedByProfile = bookedByProfileMap?.[bookedBy];
            bookingTypeDisplay =
              bookedByProfile?.first_name && bookedByProfile?.last_name
                ? `${bookedByProfile.first_name} ${bookedByProfile.last_name}`.trim()
                : bookedByProfile?.email ||
                  bookedByProfile?.first_name ||
                  "Agent";
          } else {
            bookingTypeDisplay = "offline";
          }
        } else {
          bookingTypeDisplay = "offline";
        }

        const isCanceled = bookingTypeDisplay === "Canceled";
        const isOffline =
          bookingTypeDisplay.includes("offline") ||
          bookingTypeDisplay.includes("Admin-offline");
        const isAgentBooking =
          !isCanceled && !isOffline && bookingTypeDisplay !== "Bucketlistt";

        return (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              isCanceled
                ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                : isOffline
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : isAgentBooking
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
            }`}
          >
            {bookingTypeDisplay}
          </span>
        );
      },
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
      () => {
        if (booking?.created_at) {
          return format(new Date(booking.created_at), "dd/MM/yyyy");
        }
        return "N/A";
      },
      () => {
        // Admin Note column - only visible/editable by admins
        if (!isAdmin) return "-";

        const adminNote = (booking as any)?.admin_note || "";

        // Debug log to check if admin_note is being accessed

        return (
          <div className="flex items-center gap-2">
            <span className="text-xs truncate max-w-[200px]" title={adminNote}>
              {adminNote || "-"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => {
                setEditingAdminNote({
                  bookingId: booking.id,
                  note: adminNote,
                });
                setAdminNoteDialogOpen(true);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        );
      },
    ];

    return cells[columnIndex] ? cells[columnIndex]() : "N/A";
  };

  // Resize handler for table columns
  const [resizingColumn, setResizingColumn] = React.useState<number | null>(
    null
  );
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
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingColumn, startX, startWidth, columnWidths]);

  // Click outside to close column selector
  React.useEffect(() => {
    if (!showColumnSelector) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        columnSelectorRef.current &&
        !columnSelectorRef.current.contains(target)
      ) {
        setShowColumnSelector(false);
      }
    };

    // Add a small delay to avoid catching the click that opened the dropdown
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showColumnSelector]);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["user-bookings", user?.id, isAdmin],
    queryFn: async () => {
      if (!user) return [];

      try {
        let query = supabase
          .from("bookings")
          .select(
            `
            *,
            admin_note,
            booked_by,
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
            activities (
              id,
              name,
              price,
              b2bPrice,
              discounted_price,
              discount_percentage,
              currency
            ),
            booking_participants (
              name,
              email,
              phone_number
            )
          `
          )
          .order("created_at", { ascending: false });

        // If admin, fetch all bookings (no filter)
        // If vendor, filter by vendor_id
        // Otherwise, filter by user_id
        if (isAdmin) {
          // No filter - get all bookings
          // RLS policy should allow admins to see all bookings
        } else if (user.user_metadata.role === "vendor") {
          query = query.eq("experiences.vendor_id", user.id);
        } else {
          query = query.eq("user_id", user.id);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching bookings:", error);
          console.error("Error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            isAdmin,
            userId: user.id,
          });
          throw error;
        }

        console.log("Bookings fetched successfully:", {
          count: data?.length || 0,
          isAdmin,
          userId: user.id,
        });

        // Debug: Log first booking to check if admin_note is present
        if (data && data.length > 0 && isAdmin) {
          console.log("Sample booking with admin_note:", {
            bookingId: data[0].id,
            hasAdminNote: !!(data[0] as any)?.admin_note,
            adminNote: (data[0] as any)?.admin_note,
            allKeys: Object.keys(data[0] || {}),
          });
        }

        return data || [];
      } catch (error) {
        console.error("Exception in bookings query:", error);
        throw error;
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

  // Fetch profiles for booked_by users (to get agent/admin names) - MOVED BEFORE filteredAndSortedBookings
  const bookedByUserIds = React.useMemo(() => {
    const userIds = bookings
      .map((booking) => (booking as any)?.booked_by)
      .filter(Boolean);
    return [...new Set(userIds)];
  }, [bookings]);

  const { data: bookedByProfiles = [] } = useQuery({
    queryKey: ["booked-by-profiles", bookedByUserIds],
    queryFn: async () => {
      if (bookedByUserIds.length === 0) return [];

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", bookedByUserIds);

      if (error) {
        console.error("Error fetching booked_by profiles:", error);
        return [];
      }

      return profiles || [];
    },
    enabled: bookedByUserIds.length > 0,
  });

  // Fetch roles for booked_by users
  const { data: bookedByRoles = [] } = useQuery({
    queryKey: ["booked-by-roles", bookedByUserIds],
    queryFn: async () => {
      if (bookedByUserIds.length === 0) return [];

      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", bookedByUserIds);

      if (error) {
        console.error("Error fetching booked_by roles:", error);
        return [];
      }

      return roles || [];
    },
    enabled: bookedByUserIds.length > 0,
  });

  // Create a map of booked_by user_id to profile
  const bookedByProfileMap = React.useMemo(() => {
    return bookedByProfiles.reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {} as Record<string, any>);
  }, [bookedByProfiles]);

  // Create a map of booked_by user_id to role
  const bookedByRoleMap = React.useMemo(() => {
    return bookedByRoles.reduce((acc, role) => {
      acc[role.user_id] = role.role;
      return acc;
    }, {} as Record<string, string>);
  }, [bookedByRoles]);

  // Filter and sort bookings
  const filteredAndSortedBookings = React.useMemo(() => {
    let filtered = bookings;

    // Apply today filter
    if (showTodayOnly) {
      filtered = filtered.filter((booking) =>
        isSameDay(new Date(booking.booking_date), new Date())
      );
    }

    // Apply date filter (supports range)
    if (selectedDate) {
      filtered = filtered.filter((booking) => {
        const bookingDate = format(
          new Date(booking.booking_date),
          "yyyy-MM-dd"
        );

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
        const activity = (booking.time_slots?.activities ||
          (booking as any).activities) as any;
        return activity?.id === selectedActivityId;
      });
    }

    // Apply experience filter (admin only)
    if (isAdmin && selectedExperienceId) {
      filtered = filtered.filter((booking) => {
        return booking.experiences?.id === selectedExperienceId;
      });
    }

    // Apply agent filter (admin only)
    if (isAdmin && selectedAgentId) {
      filtered = filtered.filter((booking) => {
        return booking.user_id === selectedAgentId;
      });
    }

    // Apply vendor filter (admin only)
    if (isAdmin && selectedVendorId) {
      filtered = filtered.filter((booking) => {
        return booking.experiences?.vendor_id === selectedVendorId;
      });
    }

    // Apply booking type filter
    if (selectedBookingType) {
      filtered = filtered.filter((booking) => {
        const bookingType = (booking as any)?.type || "online";

        // Handle filter matching
        if (selectedBookingType === "canceled") {
          return bookingType === "canceled";
        } else if (selectedBookingType === "offline") {
          // Match offline bookings (not canceled)
          return bookingType === "offline" && bookingType !== "canceled";
        } else if (selectedBookingType === "online") {
          return bookingType === "online";
        }
        return false;
      });
    }

    // Apply Excel-like column filters
    Object.keys(columnFilters).forEach((colIndexStr) => {
      const colIndex = parseInt(colIndexStr);
      const selectedValues = columnFilters[colIndex];
      if (selectedValues && selectedValues.length > 0) {
        filtered = filtered.filter((booking) => {
          const profile = profileMap[booking.user_id];
          // For offline bookings, activities are directly linked; for online, through time_slots
          const activity = (booking.time_slots?.activities ||
            (booking as any).activities) as any;
          const timeslot = booking.time_slots;
          const experience = booking.experiences;
          const currency =
            activity?.currency || booking?.experiences?.currency || "INR";

          // Get cell value for this column
          const getCellValue = (colIdx: number): string => {
            // Access maps from outer scope - these will be available when useMemo runs
            const roleMap = bookedByRoleMap || {};
            const profileMapForBookedBy = bookedByProfileMap || {};
            switch (colIdx) {
              case 0: // Title
                return experience?.title || "";
              case 1: // Activity
                return activity?.name || "";
              case 2: // Contact Number
                return (
                  (booking as any).contact_person_number ||
                  profile?.phone_number ||
                  booking?.booking_participants?.[0]?.phone_number ||
                  ""
                );
              case 3: // Contact Name
                return (
                  (booking as any).contact_person_name ||
                  (profile
                    ? `${profile.first_name} ${profile.last_name}`.trim()
                    : "") ||
                  booking?.booking_participants?.[0]?.name ||
                  ""
                );
              case 4: // Email
                return (
                  (booking as any).contact_person_email ||
                  profile?.email ||
                  booking?.booking_participants?.[0]?.email ||
                  ""
                );
              case 5: // Referred by
                return (
                  (booking as any)?.referral_code ||
                  (booking as any)?.referred_by ||
                  ""
                );
              case 6: {
                // Timeslot
                const bookingTypeFilter = (booking as any)?.type || "online";
                if (bookingTypeFilter === "canceled") return "Canceled";
                const isOfflineFilter = bookingTypeFilter === "offline";
                return timeslot?.start_time && timeslot?.end_time
                  ? `${formatTime12Hour(
                      timeslot.start_time
                    )} - ${formatTime12Hour(timeslot.end_time)}`
                  : isOfflineFilter
                  ? "Offline"
                  : "";
              }
              case 7: // Date
                return format(new Date(booking.booking_date), "MMM d, yyyy");
              case 8: // No. Of Participants
                return String(booking?.total_participants || "");
              case 9: // Notes for guides
                return booking.note_for_guide || "";
              case 10: {
                // Booking Type - use inline logic with maps from outer scope
                const bookingType = (booking as any)?.type || "online";
                const bookedBy = (booking as any)?.booked_by;

                if (bookingType === "canceled") return "Canceled";
                if (bookingType === "online") return "Bucketlistt";
                if (bookingType === "offline" && bookedBy) {
                  const bookedByRole = roleMap[bookedBy];
                  if (bookedByRole === "admin") return "Admin-offline";
                  if (bookedByRole === "vendor") return "offline";
                  if (
                    bookedByRole === "agent" ||
                    (booking as any)?.isAgentBooking
                  ) {
                    const bookedByProfile = profileMapForBookedBy[bookedBy];
                    return bookedByProfile?.first_name &&
                      bookedByProfile?.last_name
                      ? `${bookedByProfile.first_name} ${bookedByProfile.last_name}`.trim()
                      : bookedByProfile?.email ||
                          bookedByProfile?.first_name ||
                          "Agent";
                  }
                }
                return "offline";
              }
              case 11: // Official Price/ Original Price
                if ((booking as any)?.type === "offline" && !isAdmin)
                  return "-";
                const originalPrice = activity?.price || experience?.price || 0;
                return formatCurrency(
                  currency,
                  originalPrice * booking.total_participants
                );
              case 12: // B2B Price
                if ((booking as any)?.type === "offline" && !isAdmin)
                  return "-";
                const b2bPrice =
                  (booking as any).b2bPrice || activity?.b2bPrice || 0;
                return formatCurrency(
                  currency,
                  b2bPrice * booking.total_participants
                );
              case 13: // Commission as per vendor
                if ((booking as any)?.type === "offline" && !isAdmin)
                  return "-";
                const originalPrice2 =
                  activity?.price || experience?.price || 0;
                const b2bPrice2 =
                  (booking as any).b2bPrice || activity?.b2bPrice || 0;
                return formatCurrency(
                  currency,
                  (originalPrice2 - b2bPrice2) * booking.total_participants
                );
              case 14: // Website Price
                if ((booking as any)?.type === "offline" && !isAdmin)
                  return "-";
                const discountedPrice = activity?.discounted_price || 0;
                return formatCurrency(
                  currency,
                  discountedPrice * booking.total_participants
                );
              case 15: // Discount Coupon
                if ((booking as any)?.type === "offline" && !isAdmin)
                  return "-";
                const originalPrice3 =
                  activity?.price || experience?.price || 0;
                const officialPrice =
                  originalPrice3 * booking.total_participants;
                const bookingAmount = (booking as any)?.booking_amount || 0;
                const discountCoupon =
                  officialPrice - bookingAmount > 0
                    ? officialPrice - bookingAmount
                    : 0;
                return formatCurrency(currency, discountCoupon);
              case 16: // Ticket Price (customer cost)
                return formatCurrency(
                  currency,
                  (booking as any)?.booking_amount || 0
                );
              case 17: // Advance paid to bucketlistt (10%)
                if ((booking as any)?.type === "offline" && !isAdmin)
                  return "-";
                const bookingAmount2 = (booking as any)?.booking_amount || 0;
                const dueAmount = (booking as any)?.due_amount || 0;
                return formatCurrency(currency, bookingAmount2 - dueAmount);
              case 18: // Payment to be collected by vendor
                if ((booking as any)?.type === "offline" && !isAdmin)
                  return "-";
                const bookingAmount3 = (booking as any)?.booking_amount || 0;
                const dueAmount2 = (booking as any)?.due_amount || 0;
                return formatCurrency(
                  currency,
                  bookingAmount3 - (bookingAmount3 - dueAmount2)
                );
              case 19: // Actual Commission to bucketlistt (Net profit)
                if ((booking as any)?.type === "offline" && !isAdmin)
                  return "-";
                const bookingAmount4 = (booking as any)?.booking_amount || 0;
                const b2bPrice3 =
                  (booking as any).b2bPrice || activity?.b2bPrice || 0;
                return formatCurrency(
                  currency,
                  bookingAmount4 - b2bPrice3 * booking.total_participants
                );
              case 20: // Amount to be collected from vendor/ '- to be paid'
                if ((booking as any)?.type === "offline" && !isAdmin)
                  return "-";
                const bookingAmount5 = (booking as any)?.booking_amount || 0;
                const b2bPrice4 =
                  (booking as any).b2bPrice || activity?.b2bPrice || 0;
                const dueAmount3 = (booking as any)?.due_amount || 0;
                return formatCurrency(
                  currency,
                  bookingAmount5 -
                    b2bPrice4 * booking.total_participants -
                    (bookingAmount5 - dueAmount3)
                );
              case 21: // Advance + discount (vendor needs this)
                if ((booking as any)?.type === "offline" && !isAdmin)
                  return "-";
                const bookingAmount6 = (booking as any)?.booking_amount || 0;
                const dueAmount4 = (booking as any)?.due_amount || 0;
                const originalPrice4 =
                  activity?.price || experience?.price || 0;
                const officialPrice2 =
                  originalPrice4 * booking.total_participants;
                const discountCoupon2 =
                  officialPrice2 - bookingAmount6 > 0
                    ? officialPrice2 - bookingAmount6
                    : 0;
                return formatCurrency(
                  currency,
                  bookingAmount6 - dueAmount4 + discountCoupon2
                );
              case 22: // Booking Created At
                if (booking?.created_at) {
                  return format(new Date(booking.created_at), "dd/MM/yyyy");
                }
                return "";
              case 23: // Admin Note
                if (!isAdmin) return "";
                return (booking as any)?.admin_note || "";
              default:
                return "";
            }
          };

          const cellValue = getCellValue(colIndex);
          return selectedValues.includes(cellValue);
        });
      }
    });

    // Apply search filter
    if (globalFilter) {
      filtered = filtered.filter((booking) => {
        const searchTerm = globalFilter.toLowerCase();
        return (
          booking.experiences?.title?.toLowerCase().includes(searchTerm) ||
          (
            (booking.time_slots?.activities ||
              (booking as any).activities) as any
          )?.name
            ?.toLowerCase()
            .includes(searchTerm) ||
          booking.status?.toLowerCase().includes(searchTerm) ||
          (booking as any)?.contact_person_name
            ?.toLowerCase()
            .includes(searchTerm) ||
          (booking as any)?.contact_person_email
            ?.toLowerCase()
            .includes(searchTerm) ||
          (booking as any)?.contact_person_number
            ?.toLowerCase()
            .includes(searchTerm)
        );
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      // Handle column index sorting
      if (typeof sortBy === "number") {
        const profileA = profileMap[a.user_id];
        const profileB = profileMap[b.user_id];
        // For offline bookings, activities are directly linked; for online, through time_slots
        const activityA = (a.time_slots?.activities ||
          (a as any).activities) as any;
        const activityB = (b.time_slots?.activities ||
          (b as any).activities) as any;
        const timeslotA = a.time_slots;
        const timeslotB = b.time_slots;
        const experienceA = a.experiences;
        const experienceB = b.experiences;
        const currency =
          activityA?.currency || a.experiences?.currency || "INR";

        // Calculate values for all columns
        const getCellValue = (
          booking: any,
          profile: any,
          activity: any,
          timeslot: any,
          experience: any,
          colIndex: number
        ) => {
          // Access maps from outer scope
          const roleMap = bookedByRoleMap || {};
          const profileMapForBookedBy = bookedByProfileMap || {};
          switch (colIndex) {
            case 0: // Title
              return experience?.title || "";
            case 1: // Activity
              return activity?.name || "";
            case 2: // Contact Number
              return (
                booking.contact_person_number ||
                profile?.phone_number ||
                booking?.booking_participants?.[0]?.phone_number ||
                ""
              );
            case 3: // Contact Name
              return (
                booking.contact_person_name ||
                (profile
                  ? `${profile.first_name} ${profile.last_name}`.trim()
                  : "") ||
                booking?.booking_participants?.[0]?.name ||
                ""
              );
            case 4: // Email
              return (
                booking.contact_person_email ||
                profile?.email ||
                booking?.booking_participants?.[0]?.email ||
                ""
              );
            case 5: // Referred by
              return (
                (booking as any)?.referral_code ||
                (booking as any)?.referred_by ||
                ""
              );
            case 6: // Timeslot
              const bookingTypeSort = (booking as any)?.type || "online";
              if (bookingTypeSort === "canceled") return "Canceled";
              return timeslot?.start_time && timeslot?.end_time
                ? `${formatTime12Hour(
                    timeslot.start_time
                  )} - ${formatTime12Hour(timeslot.end_time)}`
                : "";
            case 7: // Date
              return new Date(booking.booking_date).getTime();
            case 8: // No. Of Participants
              return booking?.total_participants || 0;
            case 9: // Notes for guides
              return booking.note_for_guide || "";
            case 10: {
              // Booking Type - use inline logic
              const bookingType = (booking as any)?.type || "online";
              const bookedBy = (booking as any)?.booked_by;

              if (bookingType === "canceled") return "Canceled";
              if (bookingType === "online") return "Bucketlistt";
              if (bookingType === "offline" && bookedBy) {
                const bookedByRole = roleMap[bookedBy];
                if (bookedByRole === "admin") return "Admin-offline";
                if (bookedByRole === "vendor") return "offline";
                if (
                  bookedByRole === "agent" ||
                  (booking as any)?.isAgentBooking
                ) {
                  const bookedByProfile = profileMapForBookedBy[bookedBy];
                  return bookedByProfile?.first_name &&
                    bookedByProfile?.last_name
                    ? `${bookedByProfile.first_name} ${bookedByProfile.last_name}`.trim()
                    : bookedByProfile?.email ||
                        bookedByProfile?.first_name ||
                        "Agent";
                }
              }
              return "offline";
            }
            case 11: // Official Price/ Original Price
              if ((booking as any)?.type === "offline" && !isAdmin) return "";
              const originalPriceA = activity?.price || experience?.price || 0;
              return originalPriceA * booking.total_participants;
            case 12: // B2B Price
              if ((booking as any)?.type === "offline" && !isAdmin) return "";
              const b2bPriceA = booking.b2bPrice || activity?.b2bPrice || 0;
              return b2bPriceA * booking.total_participants;
            case 13: // Commission as per vendor
              if ((booking as any)?.type === "offline" && !isAdmin) return "";
              const originalPriceA2 = activity?.price || experience?.price || 0;
              const b2bPriceA2 = booking.b2bPrice || activity?.b2bPrice || 0;
              return (
                (originalPriceA2 - b2bPriceA2) * booking.total_participants
              );
            case 14: // Website Price
              if ((booking as any)?.type === "offline" && !isAdmin) return "";
              const discountedPriceA = activity?.discounted_price || 0;
              return discountedPriceA * booking.total_participants;
            case 15: // Discount Coupon
              if ((booking as any)?.type === "offline" && !isAdmin) return "";
              const originalPriceA3 = activity?.price || experience?.price || 0;
              const officialPriceA =
                originalPriceA3 * booking.total_participants;
              const bookingAmountA = (booking as any)?.booking_amount || 0;
              return officialPriceA - bookingAmountA > 0
                ? officialPriceA - bookingAmountA
                : 0;
            case 16: // Ticket Price (customer cost)
              return (booking as any)?.booking_amount || 0;
            case 17: // Advance paid to bucketlistt (10%)
              if ((booking as any)?.type === "offline" && !isAdmin) return "";
              const bookingAmountA2 = (booking as any)?.booking_amount || 0;
              const dueAmountA = booking?.due_amount || 0;
              return bookingAmountA2 - dueAmountA;
            case 18: // Payment to be collected by vendor
              if ((booking as any)?.type === "offline" && !isAdmin) return "";
              const bookingAmountA3 = (booking as any)?.booking_amount || 0;
              const dueAmountA2 = booking?.due_amount || 0;
              return bookingAmountA3 - (bookingAmountA3 - dueAmountA2);
            case 19: // Actual Commission to bucketlistt (Net profit)
              if ((booking as any)?.type === "offline" && !isAdmin) return "";
              const bookingAmountA4 = (booking as any)?.booking_amount || 0;
              const b2bPriceA3 = booking.b2bPrice || activity?.b2bPrice || 0;
              return bookingAmountA4 - b2bPriceA3 * booking.total_participants;
            case 20: // Amount to be collected from vendor/ '- to be paid'
              if ((booking as any)?.type === "offline" && !isAdmin) return "";
              const bookingAmountA5 = (booking as any)?.booking_amount || 0;
              const b2bPriceA4 = booking.b2bPrice || activity?.b2bPrice || 0;
              const dueAmountA3 = booking?.due_amount || 0;
              return (
                bookingAmountA5 -
                b2bPriceA4 * booking.total_participants -
                (bookingAmountA5 - dueAmountA3)
              );
            case 21: // Advance + discount (vendor needs this)
              if ((booking as any)?.type === "offline" && !isAdmin) return "";
              const bookingAmountA6 = (booking as any)?.booking_amount || 0;
              const dueAmountA4 = booking?.due_amount || 0;
              const originalPriceA4 = activity?.price || experience?.price || 0;
              const officialPriceA2 =
                originalPriceA4 * booking.total_participants;
              const discountCouponA =
                officialPriceA2 - bookingAmountA6 > 0
                  ? officialPriceA2 - bookingAmountA6
                  : 0;
              return bookingAmountA6 - dueAmountA4 + discountCouponA;
            case 22: // Booking Created At
              if (booking?.created_at) {
                return new Date(booking.created_at).getTime();
              }
              return 0;
            case 23: // Admin Note
              if (!isAdmin) return "";
              return (booking as any)?.admin_note || "";
            default:
              return "";
          }
        };

        // Get values for comparison
        aValue = getCellValue(
          a,
          profileA,
          activityA,
          timeslotA,
          experienceA,
          sortBy
        );
        bValue = getCellValue(
          b,
          profileB,
          activityB,
          timeslotB,
          experienceB,
          sortBy
        );

        aValue = getCellValue(
          a,
          profileA,
          activityA,
          timeslotA,
          experienceA,
          sortBy
        );
        bValue = getCellValue(
          b,
          profileB,
          activityB,
          timeslotB,
          experienceB,
          sortBy
        );
      } else {
        // Handle legacy string-based sorting
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
      }

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = "";
      if (bValue === null || bValue === undefined) bValue = "";

      // Compare values
      if (typeof aValue === "number" && typeof bValue === "number") {
        if (sortOrder === "asc") {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      } else {
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        if (sortOrder === "asc") {
          return aStr > bStr ? 1 : aStr < bStr ? -1 : 0;
        } else {
          return aStr < bStr ? 1 : aStr > bStr ? -1 : 0;
        }
      }
    });

    return filtered;
  }, [
    bookings,
    showTodayOnly,
    selectedDate,
    selectedEndDate,
    selectedTimeslotId,
    selectedActivityId,
    selectedExperienceId,
    selectedAgentId,
    selectedVendorId,
    selectedBookingType,
    isAdmin,
    globalFilter,
    sortBy,
    sortOrder,
    profileMap,
    isMobile,
    columnFilters,
  ]);

  // Get unique activities from bookings - only from active experiences
  const uniqueActivities = React.useMemo(() => {
    const activities = new Map();
    bookings.forEach((booking) => {
      // Only include activities from active experiences
      if (booking.experiences?.is_active === true) {
        // For offline bookings, activities are directly linked; for online, through time_slots
        const activity = (booking.time_slots?.activities ||
          (booking as any).activities) as any;
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

  // Get unique experiences from bookings (for admin filter)
  const uniqueExperiences = React.useMemo(() => {
    const experiences = new Map();
    bookings.forEach((booking) => {
      const experience = booking.experiences;
      if (experience && experience.id && experience.title) {
        experiences.set(experience.id, {
          id: experience.id,
          title: experience.title,
        });
      }
    });
    return Array.from(experiences.values());
  }, [bookings]);

  // Fetch all vendors from user_roles and their profiles (admin only)
  const { data: vendorProfiles = [] } = useQuery({
    queryKey: ["vendor-profiles-all"],
    queryFn: async () => {
      if (!isAdmin) return [];

      // First get all vendor user IDs from user_roles
      const { data: vendorRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "vendor");

      if (rolesError) {
        console.error("Error fetching vendor roles:", rolesError);
        return [];
      }

      if (!vendorRoles || vendorRoles.length === 0) return [];

      // Get vendor user IDs
      const vendorUserIds = vendorRoles.map((role) => role.user_id);

      // Fetch profiles for all vendors
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", vendorUserIds);

      if (profilesError) {
        console.error("Error fetching vendor profiles:", profilesError);
        return [];
      }

      return profiles || [];
    },
    enabled: isAdmin,
  });

  // Fetch all agents from user_roles and their profiles (admin only)
  const { data: agentProfiles = [] } = useQuery({
    queryKey: ["agent-profiles-all"],
    queryFn: async () => {
      if (!isAdmin) return [];

      // First get all agent user IDs from user_roles
      // Note: Using type assertion since 'agent' may not be in TypeScript enum but exists in DB
      const { data: agentRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "agent" as any);

      if (rolesError) {
        console.error("Error fetching agent roles:", rolesError);
        return [];
      }

      if (!agentRoles || agentRoles.length === 0) return [];

      // Get agent user IDs
      const agentUserIds = agentRoles.map((role) => role.user_id);

      // Fetch profiles for all agents
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", agentUserIds);

      if (profilesError) {
        console.error("Error fetching agent profiles:", profilesError);
        return [];
      }

      return profiles || [];
    },
    enabled: isAdmin,
  });

  // Get unique agents from profiles (admin only)
  const uniqueAgents = React.useMemo(() => {
    if (!isAdmin) return [];
    return agentProfiles.map((profile: any) => ({
      id: profile.id,
      name:
        `${profile.first_name} ${profile.last_name}`.trim() ||
        profile.email ||
        profile.id,
      email: profile.email || profile.id,
    }));
  }, [agentProfiles, isAdmin]);

  // Get unique vendors from profiles (admin only)
  const uniqueVendors = React.useMemo(() => {
    if (!isAdmin) return [];
    return vendorProfiles.map((profile: any) => ({
      id: profile.id,
      name:
        `${profile.first_name} ${profile.last_name}`.trim() ||
        profile.email ||
        profile.id,
      email: profile.email || profile.id,
    }));
  }, [vendorProfiles, isAdmin]);

  // Helper function to get booking type display
  const getBookingTypeDisplay = React.useCallback(
    (booking: BookingWithDueAmount): string => {
      const bookingType = (booking as any)?.type || "online";
      const bookedBy = (booking as any)?.booked_by;

      // If canceled, return "Canceled"
      if (bookingType === "canceled") {
        return "Canceled";
      }

      // If online booking, return "Bucketlistt"
      if (bookingType === "online") {
        return "Bucketlistt";
      }

      // If offline booking, check who booked it
      if (bookingType === "offline" && bookedBy) {
        const bookedByRole = bookedByRoleMap[bookedBy];

        // Check if admin
        if (bookedByRole === "admin") {
          return "Admin-offline";
        }

        // Check if vendor
        if (bookedByRole === "vendor") {
          return "offline";
        }

        // Check if agent
        if (bookedByRole === "agent" || (booking as any)?.isAgentBooking) {
          const bookedByProfile = bookedByProfileMap[bookedBy];
          const agentName =
            bookedByProfile?.first_name && bookedByProfile?.last_name
              ? `${bookedByProfile.first_name} ${bookedByProfile.last_name}`.trim()
              : bookedByProfile?.email ||
                bookedByProfile?.first_name ||
                "Agent";
          return agentName;
        }
      }

      // Default for offline bookings
      return "offline";
    },
    [bookedByRoleMap, bookedByProfileMap]
  );

  // Filter and sort bookings

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

  // Cancel booking function (admin only)
  const handleCancelBooking = async (bookingId: string) => {
    if (!isAdmin) {
      toast({
        title: "Unauthorized",
        description: "Only admins can cancel bookings.",
        variant: "destructive",
      });
      return;
    }

    setCancelingBookingId(bookingId);

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ type: "canceled" })
        .eq("id", bookingId);

      if (error) {
        console.error("Error canceling booking:", error);
        throw error;
      }

      toast({
        title: "Booking canceled",
        description: "The booking has been canceled successfully.",
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["user-bookings"],
      });

      // Close dialog after successful cancellation
      setCancelBookingDialogOpen(false);
      setBookingToCancel(null);
    } catch (error) {
      console.error("Error canceling booking:", error);
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancelingBookingId(null);
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

  // Excel-like sorting by column index
  const handleColumnSort = (columnIndex: number) => {
    if (sortBy === columnIndex) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(columnIndex);
      setSortOrder("asc");
    }
  };

  // Get sort indicator for column
  const getSortIndicator = (columnIndex: number) => {
    if (sortBy === columnIndex) {
      return sortOrder === "asc" ? "↑" : "↓";
    }
    return "⇅"; // Default indicator showing sortable
  };

  // Get unique values for a column (for filter dropdown) - use all bookings, not filtered
  const getUniqueColumnValues = React.useMemo(() => {
    const valuesMap: Record<number, string[]> = {};

    bookings.forEach((booking) => {
      const profile = profileMap[booking.user_id];
      // For offline bookings, activities are directly linked; for online, through time_slots
      const activity = (booking.time_slots?.activities ||
        (booking as any).activities) as any;
      const timeslot = booking.time_slots;
      const experience = booking.experiences;
      const currency =
        activity?.currency || booking?.experiences?.currency || "INR";

      for (let colIndex = 0; colIndex <= 22; colIndex++) {
        if (!valuesMap[colIndex]) {
          valuesMap[colIndex] = [];
        }

        const getCellValue = (colIdx: number): string => {
          const isOffline = (booking as any)?.type === "offline";
          switch (colIdx) {
            case 0:
              return experience?.title || "";
            case 1:
              return activity?.name || "";
            case 2:
              return (
                (booking as any).contact_person_number ||
                profile?.phone_number ||
                booking?.booking_participants?.[0]?.phone_number ||
                ""
              );
            case 3:
              return (
                (booking as any).contact_person_name ||
                (profile
                  ? `${profile.first_name} ${profile.last_name}`.trim()
                  : "") ||
                booking?.booking_participants?.[0]?.name ||
                ""
              );
            case 4:
              return (
                (booking as any).contact_person_email ||
                profile?.email ||
                booking?.booking_participants?.[0]?.email ||
                ""
              );
            case 5:
              return (
                (booking as any)?.referral_code ||
                (booking as any)?.referred_by ||
                ""
              );
            case 6:
              const bookingTypeUnique = (booking as any)?.type || "online";
              if (bookingTypeUnique === "canceled") return "Canceled";
              return timeslot?.start_time && timeslot?.end_time
                ? `${formatTime12Hour(
                    timeslot.start_time
                  )} - ${formatTime12Hour(timeslot.end_time)}`
                : isOffline
                ? "Offline"
                : "";
            case 7:
              return format(new Date(booking.booking_date), "MMM d, yyyy");
            case 8:
              return String(booking?.total_participants || "");
            case 9:
              return booking.note_for_guide || "";
            case 10: {
              // Booking Type - use inline logic
              const bookingType = (booking as any)?.type || "online";
              const bookedBy = (booking as any)?.booked_by;

              if (bookingType === "canceled") return "Canceled";
              if (bookingType === "online") return "Bucketlistt";
              if (bookingType === "offline" && bookedBy) {
                const bookedByRole = bookedByRoleMap[bookedBy];
                if (bookedByRole === "admin") return "Admin-offline";
                if (bookedByRole === "vendor") return "offline";
                if (
                  bookedByRole === "agent" ||
                  (booking as any)?.isAgentBooking
                ) {
                  const bookedByProfile = bookedByProfileMap[bookedBy];
                  return bookedByProfile?.first_name &&
                    bookedByProfile?.last_name
                    ? `${bookedByProfile.first_name} ${bookedByProfile.last_name}`.trim()
                    : bookedByProfile?.email ||
                        bookedByProfile?.first_name ||
                        "Agent";
                }
              }
              return "offline";
            }
            case 11: {
              if (isOffline && !isAdmin) return "-";
              const originalPrice = activity?.price || experience?.price || 0;
              return formatCurrency(
                currency,
                originalPrice * booking.total_participants
              );
            }
            case 12: {
              if (isOffline && !isAdmin) return "-";
              const b2bPrice =
                (booking as any).b2bPrice || activity?.b2bPrice || 0;
              return formatCurrency(
                currency,
                b2bPrice * booking.total_participants
              );
            }
            case 13: {
              if (isOffline && !isAdmin) return "-";
              const originalPrice = activity?.price || experience?.price || 0;
              const b2bPrice =
                (booking as any).b2bPrice || activity?.b2bPrice || 0;
              return formatCurrency(
                currency,
                (originalPrice - b2bPrice) * booking.total_participants
              );
            }
            case 14: {
              if (isOffline && !isAdmin) return "-";
              const discountedPrice = activity?.discounted_price || 0;
              return formatCurrency(
                currency,
                discountedPrice * booking.total_participants
              );
            }
            case 15: {
              if (isOffline && !isAdmin) return "-";
              const originalPrice = activity?.price || experience?.price || 0;
              const officialPrice = originalPrice * booking.total_participants;
              const bookingAmount = (booking as any)?.booking_amount || 0;
              const discountCoupon =
                officialPrice - bookingAmount > 0
                  ? officialPrice - bookingAmount
                  : 0;
              return formatCurrency(currency, discountCoupon);
            }
            case 16:
              return formatCurrency(
                currency,
                (booking as any)?.booking_amount || 0
              );
            case 17: {
              if (isOffline && !isAdmin) return "-";
              const bookingAmount = (booking as any)?.booking_amount || 0;
              const dueAmount = (booking as any)?.due_amount || 0;
              return formatCurrency(currency, bookingAmount - dueAmount);
            }
            case 18: {
              if (isOffline && !isAdmin) return "-";
              const bookingAmount = (booking as any)?.booking_amount || 0;
              const dueAmount = (booking as any)?.due_amount || 0;
              return formatCurrency(
                currency,
                bookingAmount - (bookingAmount - dueAmount)
              );
            }
            case 19: {
              if (isOffline && !isAdmin) return "-";
              const bookingAmount = (booking as any)?.booking_amount || 0;
              const b2bPrice =
                (booking as any).b2bPrice || activity?.b2bPrice || 0;
              return formatCurrency(
                currency,
                bookingAmount - b2bPrice * booking.total_participants
              );
            }
            case 20: {
              if (isOffline && !isAdmin) return "-";
              const bookingAmount = (booking as any)?.booking_amount || 0;
              const b2bPrice =
                (booking as any).b2bPrice || activity?.b2bPrice || 0;
              const dueAmount = (booking as any)?.due_amount || 0;
              return formatCurrency(
                currency,
                bookingAmount -
                  b2bPrice * booking.total_participants -
                  (bookingAmount - dueAmount)
              );
            }
            case 21: {
              if (isOffline && !isAdmin) return "-";
              const bookingAmount = (booking as any)?.booking_amount || 0;
              const dueAmount = (booking as any)?.due_amount || 0;
              const originalPrice = activity?.price || experience?.price || 0;
              const officialPrice = originalPrice * booking.total_participants;
              const discountCoupon =
                officialPrice - bookingAmount > 0
                  ? officialPrice - bookingAmount
                  : 0;
              return formatCurrency(
                currency,
                bookingAmount - dueAmount + discountCoupon
              );
            }
            case 22: {
              if (booking?.created_at) {
                return format(new Date(booking.created_at), "dd/MM/yyyy");
              }
              return "";
            }
            case 23: {
              if (!isAdmin) return "";
              return (booking as any)?.admin_note || "";
            }
            default:
              return "";
          }
        };

        const value = getCellValue(colIndex);
        if (value && !valuesMap[colIndex].includes(value)) {
          valuesMap[colIndex].push(value);
        }
      }
    });

    // Sort values for each column
    Object.keys(valuesMap).forEach((key) => {
      valuesMap[parseInt(key)].sort();
    });

    return valuesMap;
  }, [bookings, profileMap]);

  // Handle filter toggle
  const handleFilterToggle = (columnIndex: number, value: string) => {
    setColumnFilters((prev) => {
      const currentFilters = prev[columnIndex] || [];
      const newFilters = currentFilters.includes(value)
        ? currentFilters.filter((v) => v !== value)
        : [...currentFilters, value];

      return {
        ...prev,
        [columnIndex]: newFilters.length > 0 ? newFilters : undefined,
      };
    });
  };

  // Clear filter for a column
  const handleClearColumnFilter = (columnIndex: number) => {
    setColumnFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[columnIndex];
      return newFilters;
    });
    setFilterSearchQueries((prev) => {
      const newQueries = { ...prev };
      delete newQueries[columnIndex];
      return newQueries;
    });
  };

  // Select all values for a column
  const handleSelectAll = (columnIndex: number) => {
    const allValues = getUniqueColumnValues[columnIndex] || [];
    const searchQuery = filterSearchQueries[columnIndex]?.toLowerCase() || "";
    const filteredValues = allValues.filter((value) =>
      value.toLowerCase().includes(searchQuery)
    );
    setColumnFilters((prev) => ({
      ...prev,
      [columnIndex]: filteredValues,
    }));
  };

  // Deselect all values for a column
  const handleDeselectAll = (columnIndex: number) => {
    setColumnFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[columnIndex];
      return newFilters;
    });
  };

  // Check if all visible values are selected
  const areAllVisibleSelected = (columnIndex: number): boolean => {
    const allValues = getUniqueColumnValues[columnIndex] || [];
    const searchQuery = filterSearchQueries[columnIndex]?.toLowerCase() || "";
    const filteredValues = allValues.filter((value) =>
      value.toLowerCase().includes(searchQuery)
    );
    if (filteredValues.length === 0) return false;
    const selectedValues = columnFilters[columnIndex] || [];
    return filteredValues.every((value) => selectedValues.includes(value));
  };

  // Click outside handler for filter dropdowns
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openFilterDropdown !== null) {
        const ref = filterDropdownRefs.current[openFilterDropdown];
        const filterIcon = (event.target as HTMLElement).closest(
          ".filter-icon"
        );
        if (ref && !ref.contains(event.target as Node) && !filterIcon) {
          setOpenFilterDropdown(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openFilterDropdown]);

  // Update dropdown position when scrolling or resizing
  React.useEffect(() => {
    if (openFilterDropdown !== null) {
      const updatePosition = () => {
        const headerElement = headerRefs.current[openFilterDropdown];
        if (headerElement) {
          const rect = headerElement.getBoundingClientRect();
          setFilterDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
          });
        }
      };

      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();

      // Use capture phase to catch scroll events in all containers
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);

      // Initial position update
      updatePosition();

      return () => {
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [openFilterDropdown]);

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
    // For offline bookings, activities are directly linked; for online, through time_slots
    const activity = (booking.time_slots?.activities ||
      (booking as any).activities) as any;
    const price = activity?.price || booking?.experiences?.price || 0;
    const currency =
      activity?.currency || booking?.experiences?.currency || "INR";
    const bookingAmount = booking?.booking_amount || "N/A";
    const dueAmount = booking?.due_amount || 0;
    const isCanceled = (booking as any)?.type === "canceled";

    return (
      <Card
        className={`h-full ${
          isCanceled ? "bg-red-50 border-red-200 dark:bg-red-950/20" : ""
        }`}
        id=""
      >
        <CardHeader className="pb-0 p-0">
          <div className="flex justify-between items-start">
            {/* <CardTitle className="text-base font-semibold line-clamp-2">
              <span
                className="cursor-pointer hover:text-brand-primary"
                onClick={() => {
                  // Use url_name if available, otherwise fall back to generating slug from title
                  const experienceName = booking.experiences?.url_name || (booking.experiences?.title || "")
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
        <CardContent className="mobile-booking-card-content">
          <div className="mobile-card-section">
            <div className="mobile-info-grid">
              <div className="mobile-info-item">
                <span className="mobile-info-label">Activity</span>
                <span className="mobile-info-value">
                  {(booking.time_slots?.activities as any)?.name || "N/A"}
                </span>
              </div>
              <div className="mobile-info-item">
                <span className="mobile-info-label">Date</span>
                <span className="mobile-info-value">
                  {format(new Date(booking.booking_date), "MMM d, yyyy")}
                </span>
              </div>
              <div className="mobile-info-item">
                <span className="mobile-info-label">Start Time</span>
                <span className="mobile-info-value">
                  {formatTime12Hour(booking.time_slots?.start_time || "")}
                </span>
              </div>
              <div className="mobile-info-item">
                <span className="mobile-info-label">Participants</span>
                <span className="mobile-info-value">
                  {booking?.total_participants || "N/A"}
                </span>
              </div>
              <div className="mobile-info-item">
                <span className="mobile-info-label">Customer</span>
                <span className="mobile-info-value">
                  {booking.contact_person_name ||
                    (profile
                      ? `${profile.first_name} ${profile.last_name}`.trim()
                      : booking?.booking_participants?.[0]?.name || "N/A")}
                </span>
              </div>
              <div className="mobile-info-item">
                <span className="mobile-info-label">Contact</span>
                <span className="mobile-info-value">
                  {booking.contact_person_number ||
                  profile?.phone_number ||
                  booking?.booking_participants?.[0]?.phone_number ? (
                    <a
                      href={`tel:${
                        booking.contact_person_number ||
                        profile?.phone_number ||
                        booking?.booking_participants?.[0]?.phone_number
                      }`}
                      className="mobile-contact-link"
                    >
                      {booking.contact_person_number ||
                        profile?.phone_number ||
                        booking?.booking_participants?.[0]?.phone_number}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </span>
              </div>
            </div>
          </div>

          <div>
            {/* Advance + Discount - Visible for vendors and admin only */}

            <div className="FlexMobileSection">
              {(isVendor || isAdmin) && (
                <div>
                  <div className="mobile-card-section">
                    <div className="mobile-vendor-collection">
                      <span className="mobile-vendor-collection-label">
                        Advance + Discount:
                      </span>
                      <span className="mobile-vendor-collection-value">
                        {(() => {
                          const bookingAmountVal =
                            (booking as any)?.booking_amount || 0;
                          const dueAmountVal = booking?.due_amount || 0;
                          const originalPriceVal =
                            activity?.price || booking?.experiences?.price || 0;
                          const officialPriceVal =
                            originalPriceVal * booking.total_participants;

                          // Calculate Discount: Official Price - Booking Amount (if positive)
                          const discountCouponVal =
                            officialPriceVal - bookingAmountVal > 0
                              ? officialPriceVal - bookingAmountVal
                              : 0;

                          // Algorithm: Advance Paid + Discount
                          // Advance Paid = Booking Amount - Due Amount
                          const advancePaid = bookingAmountVal - dueAmountVal;
                          const val = advancePaid + discountCouponVal;

                          return formatCurrency(currency, val);
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div className="mobile-card-section">
                <div
                  className="mobile-pending-payment"
                  style={{
                    backgroundColor: dueAmount > 0 ? "#940fdb" : "#16a34a",
                  }}
                >
                  <span className="mobile-pending-label">
                    {dueAmount > 0 ? "PENDING PAYMENT:" : "PAYMENT STATUS:"}
                  </span>
                  <span className="mobile-pending-amount">
                    {dueAmount > 0
                      ? formatCurrency(currency, dueAmount)
                      : "FULL PAID"}
                  </span>
                </div>
              </div>
            </div>

            {booking.note_for_guide && (
              <div className="mobile-notes-section">
                <span className="mobile-notes-label">Notes for Guide</span>
                <p className="mobile-notes-content">{booking.note_for_guide}</p>
              </div>
            )}

            {/* Admin Note Section - Only visible to admins */}
            {isAdmin && (
              <div className="mobile-notes-section mobile-admin-note-section">
                <div className="flex items-center justify-between mb-1">
                  <span className="mobile-notes-label mobile-admin-note-label">
                    Admin Note
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-purple-100"
                    onClick={() => {
                      setEditingAdminNote({
                        bookingId: booking.id,
                        note: (booking as any)?.admin_note || "",
                      });
                      setAdminNoteDialogOpen(true);
                    }}
                  >
                    <Edit className="h-3 w-3 text-purple-600" />
                  </Button>
                </div>
                <p className="mobile-notes-content">
                  {(booking as any)?.admin_note || (
                    <span className="text-gray-400 italic">No admin note</span>
                  )}
                </p>
              </div>
            )}

            {/* Cancel Booking Button - Admin Only */}
            {isAdmin && (
              <div className="mobile-card-section">
                {!isCanceled ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      setBookingToCancel({
                        id: booking.id,
                        title: booking.experiences?.title || "this booking",
                      });
                      setCancelBookingDialogOpen(true);
                    }}
                    disabled={cancelingBookingId === booking.id}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {cancelingBookingId === booking.id
                      ? "Canceling..."
                      : "Cancel Booking"}
                  </Button>
                ) : (
                  <div className="w-full px-3 py-2 bg-red-100 text-red-700 rounded text-sm font-medium text-center">
                    Booking Canceled
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Vendor Money Calculation Section - Hidden on mobile */}
          {!isMobile &&
            user?.user_metadata?.role === "vendor" &&
            booking.time_slots?.activities?.b2bPrice &&
            bookingAmount != "N/A" && (
              <div className="mobile-vendor-section">
                <div className="mobile-vendor-container">
                  <div className="mobile-vendor-title">Money Calculation</div>
                  <div className="mobile-vendor-grid">
                    <div className="mobile-vendor-item">
                      <span className="mobile-vendor-label">B2B Price</span>
                      <span className="mobile-vendor-value">
                        {formatCurrency(
                          currency,
                          (booking.b2bPrice ||
                            booking.time_slots?.activities?.b2bPrice) *
                            booking.total_participants
                        )}
                      </span>
                    </div>
                    <div className="mobile-vendor-item">
                      <span className="mobile-vendor-label">
                        Original Price
                      </span>
                      <span className="mobile-vendor-value">
                        {formatCurrency(
                          currency,
                          booking.time_slots?.activities?.price *
                            booking.total_participants
                        )}
                      </span>
                    </div>
                    <div className="mobile-vendor-item">
                      <span className="mobile-vendor-label">Commission</span>
                      <span className="mobile-vendor-value">
                        {formatCurrency(
                          currency,
                          (booking.time_slots?.activities?.price -
                            (booking.b2bPrice ||
                              booking.time_slots?.activities?.b2bPrice)) *
                            booking.total_participants
                        )}
                      </span>
                    </div>
                    <div className="mobile-vendor-item">
                      <span className="mobile-vendor-label">Customer Cost</span>
                      <span className="mobile-vendor-value">
                        {formatCurrency(currency, Number(bookingAmount))}
                      </span>
                    </div>
                    <div className="mobile-vendor-item">
                      <span className="mobile-vendor-label">Advance Paid</span>
                      <span className="mobile-vendor-value">
                        {formatCurrency(
                          currency,
                          Number(bookingAmount) - dueAmount
                        )}
                      </span>
                    </div>
                    <div className="mobile-vendor-item">
                      <span className="mobile-vendor-label">To Be Paid</span>
                      <span className="mobile-vendor-value">
                        {formatCurrency(
                          currency,
                          Number(bookingAmount) -
                            (Number(bookingAmount) - dueAmount)
                        )}
                      </span>
                    </div>
                    <div className="mobile-vendor-item">
                      <span className="mobile-vendor-label">
                        Collect from Vendor
                      </span>
                      <span className="mobile-vendor-value">
                        {formatCurrency(
                          currency,
                          Number(bookingAmount) -
                            (booking.b2bPrice ||
                              booking.time_slots?.activities?.b2bPrice) *
                              booking.total_participants -
                            (Number(bookingAmount) - dueAmount)
                        )}
                      </span>
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
          </div>
        )}

        {/* Filter Buttons Row - Shows on both mobile and desktop - HIDDEN for Vendors/Users */}
        {(isAdmin || isAgent || isVendor) && (
          <div
            className="relative flex flex-wrap gap-2"
            id="UserBookingsSortButtonStyles"
          >
            {/* Today's Button - KEEP */}
            <Button
              variant={showTodayOnly ? "default" : "outline"}
              className="text-sm"
              onClick={() => setShowTodayOnly((prev) => !prev)}
            >
              {showTodayOnly ? `Show All` : `Today (${todayBookingsCount})`}
            </Button>

            {/* Columns Button - KEEP */}
            <div
              className="mb-2 flex justify-end"
              id="UserBookingsColumnSelectorStyles"
            >
              <div className="relative" ref={columnSelectorRef}>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const newState = !showColumnSelector;
                    setShowColumnSelector(newState);
                    if (newState) {
                      setShowActivityFilter(false);
                      setShowTimeslotFilter(false);
                      setShowDateRangePicker(false);
                    }
                  }}
                  // className="px-4 py-2 text-sm border border-border rounded-md bg-background hover:bg-accent hover:text-accent-foreground"
                >
                  Columns
                </Button>

                {/* Column Selector Dropdown */}
                {showColumnSelector && (
                  <div
                    className="absolute right-0 left-2 mt-2 w-[300px] p-4 border border-blue-500 rounded-lg bg-white shadow-lg max-h-96 overflow-y-auto z-50"
                    style={{ minHeight: "200px" }}
                  >
                    <div className="text-sm font-semibold mb-3 text-gray-900">
                      Select Columns to Display
                    </div>
                    <div className="space-y-2">
                      {columnHeaders.map((header, index) => {
                        const isHiddenForAgent =
                          isAgent &&
                          (index === 10 ||
                            index === 12 ||
                            index === 13 ||
                            index === 14);
                        return (
                          <label
                            key={index}
                            className={`flex items-center gap-2 p-2 rounded ${
                              isHiddenForAgent
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer hover:bg-muted/30"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={columnVisibility[index]}
                              onChange={() => toggleColumnVisibility(index)}
                              disabled={isHiddenForAgent}
                              className="cursor-pointer"
                            />
                            <span className="text-sm">{header}</span>
                          </label>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newVisibility = Array(columnCount).fill(true);
                          // Keep hidden columns hidden for agents
                          if (isAgent) {
                            newVisibility[10] = false; // Official Price/ Original Price
                            newVisibility[12] = false; // Commission as per vendor
                            newVisibility[13] = false; // Website Price
                            newVisibility[14] = false; // Discount Coupon
                            newVisibility[23] = false; // Admin Note
                          }
                          // Hide admin note for non-admins
                          if (!isAdmin) {
                            newVisibility[23] = false; // Admin Note
                          }
                          setColumnVisibility(newVisibility);
                        }}
                        className="text-xs flex-1"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setColumnVisibility(Array(columnCount).fill(false))
                        }
                        className="text-xs flex-1"
                      >
                        Deselect All
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Export to Excel Button Container - KEEP */}
            <div className="export-to-excel-container">
              {/* Export to Excel button will be added here */}
            </div>

            {/* COMMENTED OUT BUTTONS - DO NOT DELETE */}
            {/* Desktop: Date button sorts bookings */}
            {/* {!isMobile && (
          <Button
              variant={sortBy === "booking_date" ? "default" : "outline"}
              onClick={() => handleSort("booking_date")}
            className="text-sm"
          >
              <span className="text-sm">Date</span>
              {sortBy === "booking_date" && (sortOrder === "asc" ? "↑" : "↓")}
          </Button>
          )} */}

            {/* Timeslot Filter Button */}
            <div className="relative">
              <Popover
                open={showTimeslotFilter}
                onOpenChange={(open) => {
                  setShowTimeslotFilter(open);
                  if (open) {
                    setShowActivityFilter(false);
                    setShowDateRangePicker(false);
                    setShowColumnSelector(false); // Close other popovers
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant={selectedTimeslotId ? "default" : "outline"}
                    className="text-sm"
                  >
                    {selectedTimeslotId
                      ? uniqueTimeslots.find((t) => t.id === selectedTimeslotId)
                          ?.displayName || "Timeslot"
                      : "Timeslot"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-4" align="start">
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    <Button
                      variant={
                        selectedTimeslotId === null ? "default" : "outline"
                      }
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
                        variant={
                          selectedTimeslotId === timeslot.id
                            ? "default"
                            : "outline"
                        }
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
                </PopoverContent>
              </Popover>
            </div>

            {/* Activity Filter Button */}
            <div className="relative">
              <Popover
                open={showActivityFilter}
                onOpenChange={(open) => {
                  setShowActivityFilter(open);
                  if (open) {
                    setShowTimeslotFilter(false);
                    setShowDateRangePicker(false);
                    setShowColumnSelector(false); // Close other popovers
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant={selectedActivityId ? "default" : "outline"}
                    className="text-sm"
                  >
                    {selectedActivityId
                      ? uniqueActivities.find(
                          (a) => a.id === selectedActivityId
                        )?.name || "Activity"
                      : "Activity"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-4" align="start">
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    <Button
                      variant={
                        selectedActivityId === null ? "default" : "outline"
                      }
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
                        variant={
                          selectedActivityId === activity.id
                            ? "default"
                            : "outline"
                        }
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
                </PopoverContent>
              </Popover>
            </div>

            {/* Booking Type Filter Button */}
            <div className="relative">
              <Popover
                open={showBookingTypeFilter}
                onOpenChange={(open) => {
                  setShowBookingTypeFilter(open);
                  if (open) {
                    setShowTimeslotFilter(false);
                    setShowActivityFilter(false);
                    setShowDateRangePicker(false);
                    setShowColumnSelector(false);
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant={selectedBookingType ? "default" : "outline"}
                    className="text-sm"
                  >
                    {selectedBookingType
                      ? selectedBookingType === "canceled"
                        ? "Canceled"
                        : selectedBookingType === "offline"
                        ? "Offline"
                        : "Bucketlistt"
                      : "Booking Type"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-4" align="start">
                  <div className="space-y-2">
                    <Button
                      variant={
                        selectedBookingType === null ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setSelectedBookingType(null);
                        setShowBookingTypeFilter(false);
                      }}
                      className="w-full justify-start text-xs"
                    >
                      All Types
                    </Button>
                    <Button
                      variant={
                        selectedBookingType === "online" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setSelectedBookingType("online");
                        setShowBookingTypeFilter(false);
                      }}
                      className="w-full justify-start text-xs"
                    >
                      Bucketlistt
                    </Button>
                    <Button
                      variant={
                        selectedBookingType === "offline"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setSelectedBookingType("offline");
                        setShowBookingTypeFilter(false);
                      }}
                      className="w-full justify-start text-xs"
                    >
                      Offline
                    </Button>
                    <Button
                      variant={
                        selectedBookingType === "canceled"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setSelectedBookingType("canceled");
                        setShowBookingTypeFilter(false);
                      }}
                      className="w-full justify-start text-xs"
                    >
                      Canceled
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="relative">
              <ConfigProvider
                theme={{
                  token: {
                    colorPrimary: "#9b87f5",
                    borderRadius: 6,
                  },
                }}
              >
                {isMobile ? (
                  <div className="flex flex-col gap-2 w-full">
                    <DatePicker
                      placeholder="Start Date"
                      value={selectedDate ? dayjs(selectedDate) : null}
                      onChange={(date, dateString) => {
                        if (dateString) {
                          setSelectedDate(dateString as string);
                        } else {
                          setSelectedDate("");
                        }
                      }}
                      format="YYYY-MM-DD"
                      className="h-9 text-sm"
                      allowClear
                    />
                    <DatePicker
                      placeholder="End Date"
                      value={selectedEndDate ? dayjs(selectedEndDate) : null}
                      onChange={(date, dateString) => {
                        if (dateString) {
                          setSelectedEndDate(dateString as string);
                        } else {
                          setSelectedEndDate("");
                        }
                      }}
                      format="YYYY-MM-DD"
                      className="h-9 text-sm"
                      allowClear
                    />
                  </div>
                ) : (
                  <DatePicker.RangePicker
                    value={
                      selectedDate
                        ? [
                            dayjs(selectedDate),
                            selectedEndDate
                              ? dayjs(selectedEndDate)
                              : dayjs(selectedDate),
                          ]
                        : null
                    }
                    onChange={(dates, dateStrings) => {
                      if (dates && dates[0] && dates[1]) {
                        setSelectedDate(dateStrings[0]);
                        setSelectedEndDate(dateStrings[1]);
                      } else if (dates && dates[0]) {
                        setSelectedDate(dateStrings[0]);
                        setSelectedEndDate("");
                      } else {
                        handleClearDateFilter();
                      }
                    }}
                    format="YYYY-MM-DD"
                    placeholder={["Start", "End"]}
                    className="h-9 text-sm border-gray-200 hover:border-brand-primary focus:border-brand-primary"
                    style={{ width: "240px" }}
                    variant="outlined"
                    allowClear
                  />
                )}
              </ConfigProvider>
            </div>
            {/* Experience Filter Button (Admin only) */}
            {/* {isAdmin && (
            <div className="relative">
              <Button
                variant={selectedExperienceId ? "default" : "outline"}
                onClick={() => setShowExperienceFilter(!showExperienceFilter)}
                className="text-sm"
              >
                {selectedExperienceId
                  ? uniqueExperiences.find((e) => e.id === selectedExperienceId)
                      ?.title || "Experience"
                  : "Experience"}
              </Button>

              {showExperienceFilter && (
                <div
                  className="absolute left-0 top-full mt-2 w-[280px] p-4 border rounded-lg bg-background space-y-2 shadow-lg max-h-60 overflow-y-auto"
                  style={{ zIndex: 1000 }}
                >
                  <Button
                    variant={
                      selectedExperienceId === null ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => {
                      setSelectedExperienceId(null);
                      setShowExperienceFilter(false);
                    }}
                    className="w-full justify-start text-xs"
                  >
                    All Experiences
                  </Button>
                  {uniqueExperiences.map((experience) => (
                    <Button
                      key={experience.id}
                      variant={
                        selectedExperienceId === experience.id
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setSelectedExperienceId(experience.id);
                        setShowExperienceFilter(false);
                      }}
                      className="w-full justify-start text-xs"
                    >
                      {experience.title}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )} */}

            {/* Agent Filter Button (Admin only) */}
            {/* {isAdmin && (
            <div className="relative">
              <Button
                variant={selectedAgentId ? "default" : "outline"}
                onClick={() => setShowAgentFilter(!showAgentFilter)}
                className="text-sm"
              >
                {selectedAgentId
                  ? uniqueAgents.find((a) => a.id === selectedAgentId)?.name ||
                    "Agent"
                  : "Agent"}
              </Button>

              {showAgentFilter && (
                <div
                  className="absolute left-0 top-full mt-2 w-[280px] p-4 border rounded-lg bg-background space-y-2 shadow-lg max-h-60 overflow-y-auto"
                  style={{ zIndex: 1000 }}
                >
                  <Button
                    variant={selectedAgentId === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedAgentId(null);
                      setShowAgentFilter(false);
                    }}
                    className="w-full justify-start text-xs"
                  >
                    All Agents
                  </Button>
                  {uniqueAgents.map((agent) => (
                    <Button
                      key={agent.id}
                      variant={
                        selectedAgentId === agent.id ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setSelectedAgentId(agent.id);
                        setShowAgentFilter(false);
                      }}
                      className="w-full justify-start text-xs"
                    >
                      {agent.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )} */}

            {/* Vendor Filter Button (Admin only) */}
            {/* {isAdmin && (
            <div className="relative">
              <Button
                variant={selectedVendorId ? "default" : "outline"}
                onClick={() => setShowVendorFilter(!showVendorFilter)}
                className="text-sm"
              >
                {selectedVendorId
                  ? uniqueVendors.find((v) => v.id === selectedVendorId)
                      ?.name || "Vendor"
                  : "Vendor"}
              </Button>

              {showVendorFilter && (
                <div
                  className="absolute left-0 top-full mt-2 w-[280px] p-4 border rounded-lg bg-background space-y-2 shadow-lg max-h-60 overflow-y-auto"
                  style={{ zIndex: 1000 }}
                >
                  <Button
                    variant={selectedVendorId === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedVendorId(null);
                      setShowVendorFilter(false);
                    }}
                    className="w-full justify-start text-xs"
                  >
                    All Vendors
                  </Button>
                  {uniqueVendors.map((vendor) => (
                    <Button
                      key={vendor.id}
                      variant={
                        selectedVendorId === vendor.id ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setSelectedVendorId(vendor.id);
                        setShowVendorFilter(false);
                      }}
                      className="w-full justify-start text-xs"
                    >
                      {vendor.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )} */}
          </div>
        )}

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
      {/* <br /> */}
      {filteredAndSortedBookings.length > 0 ? (
        <>
          {/* Mobile: Card Layout */}
          <div
            id="UserBookingsMobileLayout"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2"
          >
            {filteredAndSortedBookings.map((booking, index) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                index={index}
                isMobile={isMobile}
              />
            ))}
          </div>

          {/* Desktop: Table Layout */}
          <div id="UserBookingsDesktopLayout" className="hidden">
            {/* Column Selector Button */}

            <div className="overflow-x-auto overflow-y-visible">
              <table
                className="w-full text-xs"
                style={{ tableLayout: "fixed" }}
              >
                <thead>
                  <tr>
                    {columnOrder.map(
                      (originalIndex) =>
                        columnVisibility[originalIndex] && (
                          <th
                            key={originalIndex}
                            ref={(el) => {
                              headerRefs.current[originalIndex] = el;
                            }}
                            data-column-index={originalIndex}
                            className={`px-1 py-0.5 text-left font-medium text-xs whitespace-nowrap relative cursor-pointer hover:bg-gray-100 select-none ${
                              draggedColumnIndex === originalIndex
                                ? "opacity-50"
                                : ""
                            } ${
                              dragOverColumnIndex === originalIndex
                                ? "border-2 border-blue-500"
                                : ""
                            } ${sortBy === originalIndex ? "bg-blue-50" : ""}`}
                            style={{ width: columnWidths[originalIndex] }}
                            draggable={true}
                            onDragStart={() =>
                              handleColumnDragStart(originalIndex)
                            }
                            onDragOver={(e) =>
                              handleColumnDragOver(e, originalIndex)
                            }
                            onDrop={(e) => handleColumnDrop(e, originalIndex)}
                            onDragEnd={handleColumnDragEnd}
                            onClick={(e) => {
                              // Only sort if not dragging and not clicking on filter icon
                              if (
                                draggedColumnIndex === null &&
                                !(e.target as HTMLElement).closest(
                                  ".filter-icon"
                                )
                              ) {
                                e.stopPropagation();
                                handleColumnSort(originalIndex);
                              }
                            }}
                          >
                            <span className="flex items-center gap-1 w-full">
                              <svg
                                className="w-3 h-3 cursor-move opacity-50 hover:opacity-100 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                              </svg>
                              <span className="flex-1 truncate">
                                {columnHeaders[originalIndex]}
                              </span>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <span
                                  className="filter-icon cursor-pointer hover:bg-gray-200 rounded p-0.5 transition-colors duration-150"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (openFilterDropdown === originalIndex) {
                                      setOpenFilterDropdown(null);
                                    } else {
                                      const headerElement =
                                        headerRefs.current[originalIndex];
                                      if (headerElement) {
                                        const rect =
                                          headerElement.getBoundingClientRect();
                                        setFilterDropdownPosition({
                                          top: rect.bottom + 4,
                                          left: rect.left,
                                        });
                                      }
                                      setOpenFilterDropdown(originalIndex);
                                    }
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "#e5e7eb";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "transparent";
                                  }}
                                  title="Filter"
                                >
                                  <Filter
                                    className={`w-3 h-3 ${
                                      columnFilters[originalIndex] &&
                                      columnFilters[originalIndex].length > 0
                                        ? "text-blue-600"
                                        : "text-gray-400"
                                    }`}
                                  />
                                </span>
                              </div>
                            </span>
                            {/* Filter Dropdown */}
                            {openFilterDropdown === originalIndex &&
                              filterDropdownPosition && (
                                <div
                                  ref={(el) => {
                                    filterDropdownRefs.current[originalIndex] =
                                      el;
                                  }}
                                  className="fixed border border-gray-300 rounded-lg shadow-xl z-[9999] min-w-[250px] max-w-[350px] max-h-[400px] overflow-hidden"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseEnter={(e) => e.stopPropagation()}
                                  onMouseLeave={(e) => e.stopPropagation()}
                                  style={{
                                    position: "fixed",
                                    top: `${filterDropdownPosition.top}px`,
                                    left: `${filterDropdownPosition.left}px`,
                                    backgroundColor: "#ffffff",
                                    opacity: 1,
                                  }}
                                >
                                  <div className="p-2 border-b border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-semibold text-gray-900">
                                        Filter by {columnHeaders[originalIndex]}
                                      </span>
                                      {columnFilters[originalIndex] &&
                                        columnFilters[originalIndex].length >
                                          0 && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs hover:bg-gray-200"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleClearColumnFilter(
                                                originalIndex
                                              );
                                            }}
                                          >
                                            <X className="w-3 h-3 mr-1" />
                                            Clear
                                          </Button>
                                        )}
                                    </div>
                                    {/* Sort Buttons */}
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-6 px-2 text-xs flex-1 ${
                                          sortBy === originalIndex &&
                                          sortOrder === "asc"
                                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                            : "hover:bg-gray-200"
                                        }`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (
                                            sortBy === originalIndex &&
                                            sortOrder === "asc"
                                          ) {
                                            setSortBy(7); // Reset to default
                                            setSortOrder("desc");
                                          } else {
                                            setSortBy(originalIndex);
                                            setSortOrder("asc");
                                          }
                                        }}
                                        title="Sort Ascending"
                                      >
                                        <ArrowUp className="w-3 h-3 mr-1" />
                                        Sort ↑
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-6 px-2 text-xs flex-1 ${
                                          sortBy === originalIndex &&
                                          sortOrder === "desc"
                                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                            : "hover:bg-gray-200"
                                        }`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (
                                            sortBy === originalIndex &&
                                            sortOrder === "desc"
                                          ) {
                                            setSortBy(7); // Reset to default
                                            setSortOrder("desc");
                                          } else {
                                            setSortBy(originalIndex);
                                            setSortOrder("desc");
                                          }
                                        }}
                                        title="Sort Descending"
                                      >
                                        <ArrowDown className="w-3 h-3 mr-1" />
                                        Sort ↓
                                      </Button>
                                    </div>
                                  </div>
                                  {/* Search Input */}
                                  <div className="p-2 border-b border-gray-200 bg-white">
                                    <div className="relative">
                                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                                      <Input
                                        type="text"
                                        placeholder="Search..."
                                        value={
                                          filterSearchQueries[originalIndex] ||
                                          ""
                                        }
                                        onChange={(e) => {
                                          setFilterSearchQueries((prev) => ({
                                            ...prev,
                                            [originalIndex]: e.target.value,
                                          }));
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="pl-7 h-7 text-xs"
                                      />
                                    </div>
                                  </div>
                                  {/* Select All / Deselect All */}
                                  <div className="p-2 border-b border-gray-200 bg-white">
                                    <div className="flex items-center gap-2">
                                      {areAllVisibleSelected(originalIndex) ? (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 px-2 text-xs hover:bg-gray-100 flex-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeselectAll(originalIndex);
                                          }}
                                        >
                                          Deselect All
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 px-2 text-xs hover:bg-gray-100 flex-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectAll(originalIndex);
                                          }}
                                        >
                                          Select All
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  {/* Filter Options List */}
                                  <div className="p-2 max-h-[200px] overflow-y-auto bg-white">
                                    {getUniqueColumnValues[originalIndex] &&
                                    getUniqueColumnValues[originalIndex]
                                      .length > 0 ? (
                                      (() => {
                                        const searchQuery =
                                          filterSearchQueries[
                                            originalIndex
                                          ]?.toLowerCase() || "";
                                        const filteredValues =
                                          getUniqueColumnValues[
                                            originalIndex
                                          ].filter((value) =>
                                            value
                                              .toLowerCase()
                                              .includes(searchQuery)
                                          );

                                        if (filteredValues.length === 0) {
                                          return (
                                            <div className="text-xs text-gray-500 p-2 text-center">
                                              No matching values
                                            </div>
                                          );
                                        }

                                        return filteredValues.map(
                                          (value, idx) => {
                                            const isChecked =
                                              columnFilters[
                                                originalIndex
                                              ]?.includes(value) || false;
                                            return (
                                              <label
                                                key={idx}
                                                className="flex items-center gap-2 p-1.5 hover:bg-blue-50 active:bg-blue-100 cursor-pointer text-xs rounded transition-colors duration-150"
                                                onMouseEnter={(e) => {
                                                  e.currentTarget.style.backgroundColor =
                                                    "#eff6ff";
                                                }}
                                                onMouseLeave={(e) => {
                                                  e.currentTarget.style.backgroundColor =
                                                    "transparent";
                                                }}
                                              >
                                                <Checkbox
                                                  checked={isChecked}
                                                  onCheckedChange={() =>
                                                    handleFilterToggle(
                                                      originalIndex,
                                                      value
                                                    )
                                                  }
                                                />
                                                <span className="truncate flex-1 text-gray-900">
                                                  {value || "(empty)"}
                                                </span>
                                              </label>
                                            );
                                          }
                                        );
                                      })()
                                    ) : (
                                      <div className="text-xs text-gray-500 p-2">
                                        No values available
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
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
                    {/* Cancel Button Column Header - Admin Only */}
                    {isAdmin && (
                      <th className="px-1 py-0.5 text-left font-medium text-xs whitespace-nowrap">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedBookings.map(
                    (booking: BookingWithDueAmount, index) => {
                      const profile = profileMap[booking.user_id];
                      // For offline bookings, activities are directly linked; for online, through time_slots
                      const activity = (booking.time_slots?.activities ||
                        (booking as any).activities) as any;
                      const timeslot = booking.time_slots;
                      const experience = booking.experiences;
                      const bookingAmount =
                        (booking as any)?.booking_amount || 0;
                      const dueAmount = (booking as any)?.due_amount || 0;
                      const currency =
                        activity?.currency ||
                        booking?.experiences?.currency ||
                        "INR";

                      // Calculate all money values from API data
                      const activityData = activity;
                      const originalPrice =
                        activityData?.price || experience?.price || 0;
                      const officialPrice =
                        originalPrice * booking.total_participants;
                      const b2bPrice =
                        booking.b2bPrice || activityData?.b2bPrice || 0;
                      const b2bPriceTotal =
                        b2bPrice * booking.total_participants;
                      const commissionPerVendor = originalPrice - b2bPrice;
                      const commissionTotal =
                        commissionPerVendor * booking.total_participants;
                      const discountedPrice =
                        activityData?.discounted_price || 0;
                      const websitePrice =
                        discountedPrice * booking.total_participants;
                      // Calculate discount from booking_amount vs expected price
                      const expectedFullPrice = officialPrice;
                      const discountCoupon =
                        expectedFullPrice - bookingAmount > 0
                          ? expectedFullPrice - bookingAmount
                          : 0;
                      const ticketPrice = bookingAmount; // Ticket Price = Website Price - Discount Coupon
                      const advancePaid10 = bookingAmount - dueAmount;
                      const paymentToCollectByVendor =
                        ticketPrice - advancePaid10; // Payment to be collected by vendor = ticketPrice - Advance paid (10%)
                      const actualCommissionNet = ticketPrice - b2bPriceTotal; // Actual Commission (Net profit) = Ticket Price - B2B Price
                      const amountToCollectFromVendor =
                        bookingAmount -
                        b2bPriceTotal -
                        (bookingAmount - dueAmount);
                      const advancePlusDiscount =
                        advancePaid10 + discountCoupon;

                      const isCanceled = (booking as any)?.type === "canceled";

                      return (
                        <tr
                          key={booking.id}
                          className={
                            isCanceled
                              ? "bg-red-50 hover:bg-red-100 dark:bg-red-950/20"
                              : ""
                          }
                        >
                          {columnOrder.map(
                            (originalIndex) =>
                              columnVisibility[originalIndex] && (
                                <td
                                  key={originalIndex}
                                  className="px-1 py-0.5 text-xs text-left"
                                  title={
                                    originalIndex === 0
                                      ? experience?.title || ""
                                      : originalIndex === 9
                                      ? booking.note_for_guide || ""
                                      : ""
                                  }
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
                          {/* Cancel Button Column - Admin Only */}
                          {isAdmin && (
                            <td className="px-1 py-0.5 text-xs text-left">
                              {!isCanceled ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    setBookingToCancel({
                                      id: booking.id,
                                      title:
                                        experience?.title || "this booking",
                                    });
                                    setCancelBookingDialogOpen(true);
                                  }}
                                  disabled={cancelingBookingId === booking.id}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  {cancelingBookingId === booking.id
                                    ? "Canceling..."
                                    : "Cancel"}
                                </Button>
                              ) : (
                                <span className="text-xs text-red-600 font-medium">
                                  Canceled
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    }
                  )}
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

      {/* Single Admin Note Dialog - Rendered once outside the loop */}
      {isAdmin && (
        <Dialog
          open={adminNoteDialogOpen}
          onOpenChange={(open) => {
            setAdminNoteDialogOpen(open);
            if (!open) {
              setEditingAdminNote(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Admin Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Admin Note
                </label>
                <Textarea
                  value={editingAdminNote?.note || ""}
                  onChange={(e) => {
                    if (editingAdminNote) {
                      setEditingAdminNote({
                        ...editingAdminNote,
                        note: e.target.value,
                      });
                    }
                  }}
                  placeholder="Enter admin note..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAdminNoteDialogOpen(false);
                    setEditingAdminNote(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!editingAdminNote) return;

                    try {
                      console.log("Updating admin note:", {
                        bookingId: editingAdminNote.bookingId,
                        note: editingAdminNote.note,
                        isAdmin: isAdmin,
                      });

                      const { data: updateData, error } = await supabase
                        .from("bookings")
                        .update({
                          admin_note: editingAdminNote.note || null,
                        })
                        .eq("id", editingAdminNote.bookingId)
                        .select("admin_note")
                        .single();

                      if (error) {
                        console.error("Update error details:", {
                          message: error.message,
                          details: error.details,
                          hint: error.hint,
                          code: error.code,
                        });
                        throw error;
                      }

                      console.log(
                        "Admin note updated successfully:",
                        updateData
                      );

                      toast({
                        title: "Admin note updated",
                        description:
                          "The admin note has been saved successfully.",
                      });

                      // Invalidate queries to refresh data
                      queryClient.invalidateQueries({
                        queryKey: ["user-bookings"],
                      });

                      setAdminNoteDialogOpen(false);
                      setEditingAdminNote(null);
                    } catch (error) {
                      console.error("Error updating admin note:", error);
                      toast({
                        title: "Error",
                        description:
                          "Failed to update admin note. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Cancel Booking Confirmation Dialog */}
      {isAdmin && (
        <Dialog
          open={cancelBookingDialogOpen}
          onOpenChange={(open) => {
            setCancelBookingDialogOpen(open);
            if (!open) {
              setBookingToCancel(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Cancel Booking
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-sm text-gray-700">
                Are you sure you want to cancel this booking?
                {bookingToCancel?.title && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <span className="font-medium">Booking:</span>{" "}
                    {bookingToCancel.title}
                  </div>
                )}
              </div>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-xs text-red-800">
                  <strong>Note:</strong> This action cannot be undone. The
                  booking will be marked as canceled.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCancelBookingDialogOpen(false);
                  setBookingToCancel(null);
                }}
                disabled={cancelingBookingId === bookingToCancel?.id}
              >
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (bookingToCancel?.id) {
                    handleCancelBooking(bookingToCancel.id);
                  }
                }}
                disabled={cancelingBookingId === bookingToCancel?.id}
                className="bg-red-600 hover:bg-red-700"
              >
                {cancelingBookingId === bookingToCancel?.id ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2 animate-spin" />
                    Canceling...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Booking
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
