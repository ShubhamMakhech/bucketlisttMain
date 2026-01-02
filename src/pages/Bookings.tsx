// @ts-nocheck
import { Header } from "@/components/Header";
import { UserBookings } from "@/components/UserBookings";
import { OfflineBookingDialog } from "@/components/OfflineBookingDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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

      // Prepare data for Excel
      const excelData =
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

          // Base data object
          const baseData: Record<string, any> = {
            "Booking ID": booking.id,
            Title: experience?.title || "N/A",
            Activity: activity?.name || "N/A",
            "Contact Number":
              booking.contact_person_number || customer?.phone_number || "N/A",
            "Contact Name":
              booking.contact_person_name || customer?.name || "N/A",
            Email: booking.contact_person_email || customer?.email || "N/A",
            "Referred by": booking.referral_code || booking.referred_by || "-",
            Timeslot: isCanceled
              ? "Canceled"
              : timeslot?.start_time && timeslot?.end_time
              ? `${formatTime12Hour(timeslot.start_time)} - ${formatTime12Hour(
                  timeslot.end_time
                )}`
              : isOffline
              ? "Offline"
              : "N/A",
            "Activity Date": new Date(booking.booking_date).toLocaleDateString(
              "en-GB",
              { day: "2-digit", month: "short", year: "numeric" }
            ),
            "No. Of Participants": booking.total_participants || 0,
            "Notes for guides": booking.note_for_guide || "-",
            "Booking Type": getBookingTypeDisplay(booking),
            "Ticket Price (customer cost)": bookingAmount,
            "Booking Created At": booking.created_at
              ? new Date(booking.created_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "N/A",
          };

          // Add role-based columns (exclude for agents viewing agent bookings)
          const isAgentBooking = booking.isAgentBooking;
          const shouldShowFinancialColumns =
            isAdmin ||
            (isVendor && (!isOffline || isAdmin)) ||
            (isAgent && !isOffline && !isAgentBooking);

          if (shouldShowFinancialColumns) {
            baseData["Official Price/ Original Price"] =
              isOffline && !isAdmin ? "-" : officialPrice;
            baseData["B2B Price"] = isOffline && !isAdmin ? "-" : b2bPriceTotal;
            baseData["Commission as per vendor"] =
              isOffline && !isAdmin ? "-" : commissionTotal;
            baseData["Website Price"] =
              isOffline && !isAdmin ? "-" : websitePrice;
            baseData["Discount Coupon"] =
              isOffline && !isAdmin ? "-" : discountCoupon;
            baseData["Advance paid"] =
              isOffline && !isAdmin ? "-" : advancePaid;
            baseData["Pending amount from customer"] =
              isOffline && !isAdmin ? "-" : dueAmount;
            baseData["Net Commission"] =
              isOffline && !isAdmin ? "-" : actualCommissionNet;
            baseData["( - Net from agent) / to agent"] =
              isOffline && !isAdmin ? "-" : amountToCollectFromVendor;
            baseData["Advance + discount"] =
              isOffline && !isAdmin ? "-" : advancePlusDiscount;
          }

          // Admin-only columns
          if (isAdmin) {
            baseData["Admin Note"] = booking.admin_note || "-";
          }

          // Add currency column
          baseData["Currency"] = currency;

          return baseData;
        }) || [];

      // Calculate summary totals
      const totalBookings = bookings?.length || 0;
      const totalRevenue =
        bookings?.reduce((sum, booking) => {
          const bookingAmount = booking.booking_amount || 0;
          return sum + bookingAmount;
        }, 0) || 0;

      // Create summary row with all possible columns (use first row as template)
      const firstRow = excelData[0] || {};
      const summaryRow: Record<string, any> = {};
      Object.keys(firstRow).forEach((key) => {
        summaryRow[key] = "";
      });

      const summaryData = [
        {}, // Empty row
        {
          ...summaryRow,
          "Booking ID": "SUMMARY",
        },
        {
          ...summaryRow,
          "Booking ID": "Total Bookings:",
          "No. Of Participants": totalBookings,
        },
        {
          ...summaryRow,
          "Booking ID": "Total Revenue:",
          "Ticket Price (customer cost)": totalRevenue,
        },
        {
          ...summaryRow,
          "Booking ID": "Export Date:",
          "Booking Created At": new Date().toLocaleString(),
        },
      ];

      // Combine data and summary
      const allData = [...excelData, ...summaryData];

      // Create workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(allData);

      // Set column widths dynamically based on actual columns
      // Get all unique keys from the data
      const allKeys = new Set<string>();
      excelData.forEach((row) => {
        Object.keys(row).forEach((key) => allKeys.add(key));
      });
      const columnOrder = Array.from(allKeys).sort();

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

      // Set column widths
      const colWidths = columnOrder.map((key) => ({
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

      <div className="container mx-auto px-4 py-2">
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
                      className="border-brand-primary text-brand-primary hover:bg-brand-primary/10"
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

        <UserBookings />

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
