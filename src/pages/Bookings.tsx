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
  const { isVendor } = useUserRole();
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
    // if (!user || user.user_metadata?.role !== "vendor") return;

    setIsExporting(true);
    try {
      // Fetch all vendor bookings with related data
      const { data: bookings, error } = await supabase
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
              currency
            )
          ),
          activities (
            id,
            name,
            price,
            currency
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

      // Prepare data for Excel
      const excelData =
        bookings?.map((booking: any) => {
          const customer = booking.booking_participants?.[0]; // Primary customer
          const activity = booking.time_slots?.activities;
          // For offline bookings, try to get activity from direct reference
          const offlineActivity = booking.activities;

          return {
            "Booking ID": booking.id,
            "Booking Type": booking.type || "online",
            "Experience Title": booking.experiences?.title || "N/A",
            "Customer Name":
              booking.contact_person_name || customer?.name || "N/A",
            "Customer Email":
              booking.contact_person_email || customer?.email || "N/A",
            "Customer Phone":
              booking.contact_person_number || customer?.phone_number || "N/A",
            "Booking Date": new Date(booking.booking_date).toLocaleDateString(),
            "Time Slot": booking.time_slots
              ? `${booking.time_slots.start_time} - ${booking.time_slots.end_time}`
              : booking.type === "offline"
                ? "Offline Booking"
                : "N/A",
            Activity: activity?.name || offlineActivity?.name || "N/A",
            "Total Participants": booking.total_participants || 0,
            "Booking Amount": booking.booking_amount || 0,
            Price:
              activity?.price ||
              offlineActivity?.price ||
              booking.experiences?.price ||
              0,
            Currency:
              activity?.currency ||
              offlineActivity?.currency ||
              booking.experiences?.currency ||
              "INR",
            Status: booking.status || "N/A",
            Location: booking.experiences?.location || "N/A",
            "Note for Guide": booking.note_for_guide || "N/A",
            "Booked By": booking.booked_by
              ? "Vendor (Offline)"
              : "Customer (Online)",
            "Created At": new Date(booking.created_at).toLocaleString(),
          };
        }) || [];

      // Add summary data
      const totalRevenue =
        bookings?.reduce((sum, booking) => {
          const price =
            booking.time_slots?.activities?.price ||
            booking.experiences?.price ||
            0;
          return sum + price * (booking.total_participants || 1);
        }, 0) || 0;

      const summaryData = [
        {}, // Empty row
        {
          "Booking ID": "SUMMARY",
          "Experience Title": "",
          "Customer Name": "",
          "Customer Email": "",
          "Customer Phone": "",
          "Booking Date": "",
          "Time Slot": "",
          Activity: "",
          "Total Participants": "",
          Price: "",
          Currency: "",
          Status: "",
          Location: "",
          "Note for Guide": "",
          "Created At": "",
        },
        {
          "Booking ID": "Total Bookings:",
          "Experience Title": bookings?.length || 0,
          "Customer Name": "",
          "Customer Email": "",
          "Customer Phone": "",
          "Booking Date": "",
          "Time Slot": "",
          Activity: "",
          "Total Participants": "",
          Price: "",
          Currency: "",
          Status: "",
          Location: "",
          "Note for Guide": "",
          "Created At": "",
        },
        {
          "Booking ID": "Total Revenue:",
          "Experience Title": totalRevenue,
          "Customer Name": "",
          "Customer Email": "",
          "Customer Phone": "",
          "Booking Date": "",
          "Time Slot": "",
          Activity: "",
          "Total Participants": "",
          Price: "",
          Currency: "",
          Status: "",
          Location: "",
          "Note for Guide": "",
          "Created At": "",
        },
        {
          "Booking ID": "Export Date:",
          "Experience Title": new Date().toLocaleString(),
          "Customer Name": "",
          "Customer Email": "",
          "Customer Phone": "",
          "Booking Date": "",
          "Time Slot": "",
          Activity: "",
          "Total Participants": "",
          Price: "",
          Currency: "",
          Status: "",
          Location: "",
          "Note for Guide": "",
          "Created At": "",
        },
      ];

      // Combine data and summary
      const allData = [...excelData, ...summaryData];

      // Create workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(allData);

      // Set column widths
      const colWidths = [
        { wch: 15 }, // Booking ID
        { wch: 12 }, // Booking Type
        { wch: 30 }, // Experience Title
        { wch: 25 }, // Customer Name
        { wch: 30 }, // Customer Email
        { wch: 20 }, // Customer Phone
        { wch: 15 }, // Booking Date
        { wch: 20 }, // Time Slot
        { wch: 25 }, // Activity
        { wch: 18 }, // Total Participants
        { wch: 15 }, // Booking Amount
        { wch: 12 }, // Price
        { wch: 10 }, // Currency
        { wch: 12 }, // Status
        { wch: 30 }, // Location
        { wch: 30 }, // Note for Guide
        { wch: 20 }, // Booked By
        { wch: 20 }, // Created At
      ];
      worksheet["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings Data");

      // Generate filename
      const fileName = `bookings_export_${new Date().toISOString().split("T")[0]
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
                  <div className="MybookingHeading">
                    My Bookings
                  </div>
                  <p className="text-sm text-muted-foreground OnlyMobileParaGraph">
                    {isVendor
                      ? "Manage all bookings for your experiences"
                      : "View and manage your bookings"}
                  </p>
                </div>
              </div>
              {/* {isVendor && ( */}
                <div className="flex items-center gap-2">
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
              {/* )} */}
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
        {isVendor && (
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
