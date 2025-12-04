import { Header } from "@/components/Header";
import { UserBookings } from "@/components/UserBookings";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Bookings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const exportToExcel = async () => {
    if (!user || user.user_metadata?.role !== "vendor") return;

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
        bookings?.map((booking) => {
          const customer = booking.booking_participants?.[0]; // Primary customer
          const activity = booking.time_slots?.activities;

          return {
            "Booking ID": booking.id,
            "Experience Title": booking.experiences?.title || "N/A",
            "Customer Name": customer?.name || "N/A",
            "Customer Email": customer?.email || "N/A",
            "Customer Phone": customer?.phone_number || "N/A",
            "Booking Date": new Date(booking.booking_date).toLocaleDateString(),
            "Time Slot": booking.time_slots
              ? `${booking.time_slots.start_time} - ${booking.time_slots.end_time}`
              : "N/A",
            Activity: activity?.name || "N/A",
            "Total Participants": booking.total_participants || 0,
            Price: activity?.price || booking.experiences?.price || 0,
            Currency:
              activity?.currency || booking.experiences?.currency || "INR",
            Status: booking.status || "N/A",
            Location: booking.experiences?.location || "N/A",
            "Note for Guide": booking.note_for_guide || "N/A",
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
        { wch: 30 }, // Experience Title
        { wch: 25 }, // Customer Name
        { wch: 30 }, // Customer Email
        { wch: 20 }, // Customer Phone
        { wch: 15 }, // Booking Date
        { wch: 20 }, // Time Slot
        { wch: 25 }, // Activity
        { wch: 18 }, // Total Participants
        { wch: 12 }, // Price
        { wch: 10 }, // Currency
        { wch: 12 }, // Status
        { wch: 30 }, // Location
        { wch: 30 }, // Note for Guide
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 text-brand-primary" />
              <h1 className="text-1xl font-bold">My Bookings</h1>
            </div>
            {user?.user_metadata?.role === "vendor" && (
              <Button
                onClick={exportToExcel}
                disabled={isExporting}
                id="BookingsExportButtonStyles"
                className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary/90 hover:to-brand-secondary/90"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export to Excel"}
              </Button>
            )}
          </div>
        </div>

        <UserBookings />
      </div>
    </div>
  );
};

export default Bookings;
