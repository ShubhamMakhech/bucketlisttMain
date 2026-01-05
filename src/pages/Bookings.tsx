// @ts-nocheck
import { Header } from "@/components/Header";
import { UserBookings } from "@/components/UserBookings";
import { OfflineBookingDialog } from "@/components/OfflineBookingDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Download, Plus, BookOpen } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useQueryClient } from "@tanstack/react-query";


const Bookings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isVendor, isAgent, isAdmin } = useUserRole();
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [isOfflineBookingDialogOpen, setIsOfflineBookingDialogOpen] =
    useState(false);

  const userBookingsRef = useRef<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      // Build query for bookings with all necessary fields
      let query = supabase.from("bookings").select(
        `
          *,
          booked_by,
          admin_note,
          experiences (
            id,
            title,
            location,
            location2,
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
      );

      // For vendors: filter by vendor_id in experiences
      // For agents: filter by bookings they created (booked_by or user_id)
      // For admins: no filter - export all bookings
      if (isVendor) {
        query = query.eq("experiences.vendor_id", user.id);
      } else if (isAgent) {
        // Agents can see bookings they created (offline bookings)
        // Filter by user_id (which will be agent's ID for offline bookings they create)
        query = query.eq("user_id", user.id);
      }
      // For admins, no filter - they can export all bookings

      const { data: bookings, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      // Fetch profiles and roles for booked_by users (for booking type display)
      const bookedByUserIds = [
        ...new Set(
          bookings?.map((b: any) => b.booked_by).filter(Boolean) || []
        ),
      ];

      let bookedByProfilesMap: Record<string, any> = {};
      let bookedByRolesMap: Record<string, string> = {};

      if (bookedByUserIds.length > 0) {
        // Fetch profiles
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", bookedByUserIds);
        bookedByProfilesMap = (profiles || []).reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, any>);

        // Fetch roles
        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", bookedByUserIds);
        bookedByRolesMap = (roles || []).reduce((acc, role) => {
          acc[role.user_id] = role.role;
          return acc;
        }, {} as Record<string, string>);
      }

      // Helper function to format time
      const formatTime12Hour = (timeString: string) => {
        if (!timeString) return "N/A";
        try {
          const timeParts = timeString.split(":");
          const hours = parseInt(timeParts[0]);
          const minutes = timeParts[1];
          if (isNaN(hours)) return timeString;
          const period = hours >= 12 ? "PM" : "AM";
          const displayHours =
            hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
          return `${displayHours}:${minutes} ${period}`;
        } catch {
          return timeString;
        }
      };

      // Helper function to get booking type display
      const getBookingTypeDisplay = (booking: any): string => {
        const bookingType = booking?.type || "online";
        const bookedBy = booking?.booked_by;

        if (bookingType === "canceled") return "Canceled";
        if (bookingType === "online") return "Bucketlistt";
        if (bookingType === "offline" && bookedBy) {
          const bookedByRole = bookedByRolesMap[bookedBy];
          if (bookedByRole === "admin") return "Admin-offline";
          if (bookedByRole === "vendor") return "offline";
          if (bookedByRole === "agent" || booking?.isAgentBooking) {
            const bookedByProfile = bookedByProfilesMap[bookedBy];
            return bookedByProfile?.first_name && bookedByProfile?.last_name
              ? `${bookedByProfile.first_name} ${bookedByProfile.last_name}`.trim()
              : bookedByProfile?.email ||
                  bookedByProfile?.first_name ||
                  "Agent";
          }
        }
        return "offline";
      };

      // Column headers mapping (matching UserBookings.tsx columnHeaders array)
      const columnHeaders = [
        "Title",
        "Activity",
        "Contact Number",
        "Contact Name",
        "Email",
        "Referred by",
        "Timeslot",
        "Activity Date",
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
        "Actions", // This won't be exported, but included for index alignment
      ];

      // Determine column visibility based on role (matching UserBookings.tsx logic)
      const getColumnVisibility = (): boolean[] => {
        const columnCount = 25;
        const visibility = Array(columnCount).fill(false);

        // Default visible columns
        visibility[1] = true; // Activity
        visibility[2] = true; // Contact Number
        visibility[3] = true; // Contact Name
        visibility[7] = true; // Activity Date
        visibility[6] = true; // Timeslot
        visibility[8] = true; // No. Of Participants
        visibility[10] = true; // Booking Type
        visibility[18] = true; // Payment to be collected by vendor
        visibility[20] = true; // Amount to be collected from vendor
        visibility[21] = true; // Advance + discount

        // Admin-only columns
        if (isAdmin) {
          visibility[23] = true; // Admin Note
          visibility[24] = true; // Actions (won't be exported)
        }

        // Agent restrictions
        if (isAgent) {
          visibility[10] = false; // Booking Type
          visibility[11] = false; // Official Price/ Original Price
          visibility[13] = false; // Commission as per vendor
          visibility[14] = false; // Website Price
          visibility[15] = false; // Discount Coupon
          visibility[23] = false; // Admin Note
          visibility[24] = false; // Actions
        }

        return visibility;
      };

      // Default column order (matching UserBookings.tsx default columnOrder)
      const defaultColumnOrder = Array.from({ length: 25 }, (_, i) => i);

      // Get column visibility and order from UserBookings component
      const columnVisibility = userBookingsRef.current?.getColumnVisibility() || getColumnVisibility();
      const columnOrder = userBookingsRef.current?.getColumnOrder() || defaultColumnOrder;

      // Prepare data for Excel
      const excelDataRaw =
        bookings?.map((booking: any) => {
          const customer = booking.booking_participants?.[0];
          const activity = booking.time_slots?.activities || booking.activities;
          const experience = booking.experiences;
          const timeslot = booking.time_slots;
          const isOffline = booking.type === "offline";
          const isCanceled = booking.type === "canceled";

          const currency = activity?.currency || experience?.currency || "INR";
          const originalPrice = activity?.price || experience?.price || 0;
          const officialPrice =
            originalPrice * (booking.total_participants || 1);
          const b2bPrice = booking.b2bPrice || activity?.b2bPrice || 0;
          const b2bPriceTotal = b2bPrice * (booking.total_participants || 1);
          const commissionTotal =
            (originalPrice - b2bPrice) * (booking.total_participants || 1);
          const discountedPrice = activity?.discounted_price || 0;
          const websitePrice =
            discountedPrice * (booking.total_participants || 1);
          const bookingAmount = booking.booking_amount || 0;
          const discountCoupon =
            officialPrice - bookingAmount > 0
              ? officialPrice - bookingAmount
              : 0;
          const ticketPrice = bookingAmount;
          const dueAmount = booking.due_amount || 0;
          const advancePaid = bookingAmount - dueAmount;
          const paymentToCollectByVendor = bookingAmount - advancePaid;
          const actualCommissionNet = bookingAmount - b2bPriceTotal;
          const amountToCollectFromVendor =
            bookingAmount - b2bPriceTotal - advancePaid;
          const advancePlusDiscount = advancePaid + discountCoupon;

          // Build all data in an array matching column indices
          // Index mapping: 0=Title, 1=Activity, 2=Contact Number, etc.
          const allColumnData: (string | number)[] = Array(25).fill(null);

          allColumnData[0] = experience?.title || "N/A"; // Title
          allColumnData[1] = activity?.name || "N/A"; // Activity
          allColumnData[2] =
            booking.contact_person_number || customer?.phone_number || "N/A"; // Contact Number
          allColumnData[3] =
            booking.contact_person_name || customer?.name || "N/A"; // Contact Name
          allColumnData[4] =
            booking.contact_person_email || customer?.email || "N/A"; // Email
          allColumnData[5] =
            booking.referral_code || booking.referred_by || "-"; // Referred by
          allColumnData[6] = isCanceled
            ? "Canceled"
            : timeslot?.start_time && timeslot?.end_time
            ? `${formatTime12Hour(timeslot.start_time)} - ${formatTime12Hour(
                timeslot.end_time
              )}`
            : isOffline
            ? "Offline"
            : "N/A"; // Timeslot
          allColumnData[7] = new Date(booking.booking_date).toLocaleDateString(
            "en-GB",
            { day: "2-digit", month: "short", year: "numeric" }
          ); // Activity Date
          allColumnData[8] = booking.total_participants || 0; // No. Of Participants
          allColumnData[9] = booking.note_for_guide || "-"; // Notes for guides
          allColumnData[10] = isAgent ? null : getBookingTypeDisplay(booking); // Booking Type
          allColumnData[11] = null; // Official Price/ Original Price (will be set if visible)
          allColumnData[12] = null; // B2B Price (will be set if visible)
          allColumnData[13] = null; // Commission as per vendor (will be set if visible)
          allColumnData[14] = null; // Website Price (will be set if visible)
          allColumnData[15] = null; // Discount Coupon (will be set if visible)
          allColumnData[16] = bookingAmount; // Ticket Price (customer cost)
          allColumnData[17] = null; // Advance paid (will be set if visible)
          allColumnData[18] = null; // Payment to be collected by vendor (will be set if visible)
          allColumnData[19] = null; // Net Commission (will be set if visible)
          allColumnData[20] = null; // Amount to be collected from vendor (will be set if visible)
          allColumnData[21] = null; // Advance + discount (will be set if visible)
          allColumnData[22] = booking.created_at
            ? new Date(booking.created_at).toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            : "N/A"; // Booking Created At
          allColumnData[23] = isAdmin ? booking.admin_note || "-" : null; // Admin Note
          allColumnData[24] = null; // Actions (not exported)

          // Add role-based financial columns (exclude for agents viewing agent bookings)
          const isAgentBooking = booking.isAgentBooking;
          const shouldShowFinancialColumns =
            isAdmin ||
            (isVendor && (!isOffline || isAdmin)) ||
            (isAgent && !isOffline && !isAgentBooking);

          if (shouldShowFinancialColumns) {
            allColumnData[11] = isOffline && !isAdmin ? "-" : officialPrice; // Official Price/ Original Price
            allColumnData[12] = isOffline && !isAdmin ? "-" : b2bPriceTotal; // B2B Price
            allColumnData[13] = isOffline && !isAdmin ? "-" : commissionTotal; // Commission as per vendor
            allColumnData[14] = isOffline && !isAdmin ? "-" : websitePrice; // Website Price
            allColumnData[15] = isOffline && !isAdmin ? "-" : discountCoupon; // Discount Coupon
            allColumnData[17] = isOffline && !isAdmin ? "-" : advancePaid; // Advance paid
            allColumnData[18] =
              isOffline && !isAdmin ? "-" : paymentToCollectByVendor; // Payment to be collected by vendor
            allColumnData[19] =
              isOffline && !isAdmin ? "-" : actualCommissionNet; // Net Commission
            allColumnData[20] =
              isOffline && !isAdmin ? "-" : amountToCollectFromVendor; // Amount to be collected from vendor
            allColumnData[21] =
              isOffline && !isAdmin ? "-" : advancePlusDiscount; // Advance + discount
          }

          return allColumnData;
        }) || [];

      // Filter and reorder columns based on visibility and order
      let visibleColumnIndices = columnOrder.filter(
        (index) => columnVisibility[index] && index !== 24 // Exclude Actions column
      );

      // Always include Booking Created At (index 22) as compulsory
      if (!visibleColumnIndices.includes(22)) {
        visibleColumnIndices.push(22);
      }

      // Convert array data to object format with only visible columns, maintaining order
      // Include Booking ID as first column for reference
      const excelData = excelDataRaw.map((rowData: any[], rowIndex: number) => {
        const row: Record<string, any> = {
          "Booking ID": bookings?.[rowIndex]?.id || "",
        };
        visibleColumnIndices.forEach((colIndex) => {
          const columnName = columnHeaders[colIndex];
          if (
            columnName &&
            rowData[colIndex] !== null &&
            rowData[colIndex] !== undefined
          ) {
            row[columnName] = rowData[colIndex];
          }
        });
        return row;
      });

      // Calculate summary totals
      const totalBookings = bookings?.length || 0;
      const totalRevenue =
        bookings?.reduce((sum, booking) => {
          const bookingAmount = booking.booking_amount || 0;
          return sum + bookingAmount;
        }, 0) || 0;

      // Create summary rows with visible columns only
      const summaryRow: Record<string, any> = {};
      visibleColumnIndices.forEach((colIndex) => {
        const columnName = columnHeaders[colIndex];
        if (columnName) {
          summaryRow[columnName] = "";
        }
      });

      // Find column names for summary (check if they're visible)
      const titleColName = visibleColumnIndices.includes(0)
        ? columnHeaders[0]
        : "Title";
      const participantsColName = visibleColumnIndices.includes(8)
        ? columnHeaders[8]
        : "No. Of Participants";
      const ticketPriceColName = visibleColumnIndices.includes(16)
        ? columnHeaders[16]
        : "Ticket Price (customer cost)";
      const createdAtColName = visibleColumnIndices.includes(22)
        ? columnHeaders[22]
        : "Booking Created At";

      const summaryData = [
        {}, // Empty row
        {
          ...summaryRow,
          "Booking ID": "SUMMARY",
          [titleColName]: "SUMMARY",
        },
        {
          ...summaryRow,
          "Booking ID": "Total Bookings:",
          [titleColName]: "Total Bookings:",
          [participantsColName]: totalBookings,
        },
        {
          ...summaryRow,
          "Booking ID": "Total Revenue:",
          [titleColName]: "Total Revenue:",
          [ticketPriceColName]: totalRevenue,
        },
        {
          ...summaryRow,
          "Booking ID": "Export Date:",
          [titleColName]: "Export Date:",
          [createdAtColName]: new Date().toLocaleString(),
        },
      ];

      // Get column order based on visible columns (Booking ID first, then visible columns)
      const exportColumnOrder = [
        "Booking ID",
        ...visibleColumnIndices
          .map((index) => columnHeaders[index])
          .filter(Boolean),
      ];

      // Combine data and summary
      const allData = [...excelData, ...summaryData];

      // Create workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(allData);

      // Define column widths for known columns
      const widthMap: Record<string, number> = {
        "Booking ID": 15,
        Title: 30,
        Activity: 25,
        "Contact Number": 20,
        "Contact Name": 25,
        Email: 30,
        "Referred by": 15,
        Timeslot: 20,
        "Activity Date": 15,
        "No. Of Participants": 18,
        "Notes for guides": 30,
        "Booking Type": 20,
        "Official Price/ Original Price": 25,
        "B2B Price": 15,
        "Commission as per vendor": 25,
        "Website Price": 15,
        "Discount Coupon": 15,
        "Ticket Price (customer cost)": 20,
        "Advance paid": 15,
        "Pending amount from customer": 25,
        "Net Commission": 15,
        "( - Net from agent) / to agent": 25,
        "Advance + discount": 18,
        "Booking Created At": 20,
        "Admin Note": 30,
        Currency: 10,
      };

      // Set column widths based on actual exported columns (in order)
      const colWidths = exportColumnOrder.map((key) => ({
        wch: widthMap[key] || 15,
      }));
      worksheet["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings Data");

      // Generate filename
      const fileName = `bookings_export_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      // Generate and download file
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Export Successful!",
        description: `Bookings data exported to ${fileName}`,
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export bookings data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-1 py-2">
        <div className="mb-0">
          {/* <Button
            variant="ghost"
            onClick={() => navigate("/profile")}
            className="mb-0"
            id="BookingsBackButtonStyles"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button> */}
          <div className="mb-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-brand-primary/10">
                  <Calendar className="calenderIcon text-brand-primary" />
                </div>
                <div>
                  <div className="MybookingHeading">My Bookings</div>
                  <p className="text-sm text-muted-foreground OnlyMobileParaGraph">
                    {isVendor
                      ? "Manage all bookings for your experiences"
                      : isAgent
                      ? "Manage all bookings and create offline bookings"
                      : isAdmin
                      ? "Manage all bookings and create offline bookings"
                      : "View and manage your bookings"}
                  </p>
                </div>
              </div>
              {(isVendor || isAgent || isAdmin) && (
                <div className="flex items-center gap-2">
                  {isVendor && (
                    <Button
                      onClick={() => navigate("/profile/calendar")}
                      variant="outline"
                      className="border-brand-primary text-brand-primary hover:bg-brand-primary/10 CalenderBtn"
                      size="default"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Calendar
                    </Button>
                  )}
                  <Button
                    onClick={() => setIsOfflineBookingDialogOpen(true)}
                    className="bg-brand-primary hover:bg-brand-primary/90 text-white EditButtonStyle"
                    size="default"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Offline Booking
                  </Button>
                  <Button
                    onClick={exportToExcel}
                    disabled={isExporting}
                    variant="outline"
                    className="border-brand-primary text-brand-primary hover:bg-brand-primary/10"
                    id="ExportToExcelButtonStyles"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? "Exporting..." : "Export to Excel"}
                  </Button>
                </div>
              )}
            </div>

            {/* Info Banner for Vendors */}
            {/* {isVendor && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Offline Bookings
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Create offline bookings for customers who book directly
                      with you. These bookings will appear in your bookings list
                      alongside online bookings.
                    </p>
                  </div>
                </div>
              </div>
            )} */}
          </div>
        </div>

        <UserBookings ref={userBookingsRef} />

        {/* Offline Booking Dialog */}
        {(isVendor || isAgent || isAdmin) && (
          <OfflineBookingDialog
            isOpen={isOfflineBookingDialogOpen}
            onClose={() => setIsOfflineBookingDialogOpen(false)}
            onBookingSuccess={() => {
              // Refresh bookings data
              queryClient.invalidateQueries({ queryKey: ["user-bookings"] });
              setIsOfflineBookingDialogOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Bookings;
