
import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Edit, Save, ArrowLeft, Loader2 } from "lucide-react";
import { generateInvoicePdf } from "@/utils/generateInvoicePdf";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface BookingQuickActionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: any;
    onBookingUpdated: () => void;
}

export const BookingQuickActionsModal = ({
    isOpen,
    onClose,
    booking,
    onBookingUpdated,
}: BookingQuickActionsModalProps) => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState<"menu" | "admin_note">("menu");
    const [adminNote, setAdminNote] = useState("");
    const [isUpdatingNote, setIsUpdatingNote] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Initialize admin note when booking changes or modal opens
    React.useEffect(() => {
        if (booking) {
            setAdminNote(booking.admin_note || "");
        }
    }, [booking, isOpen]);

    // Reset view when modal closes
    React.useEffect(() => {
        if (!isOpen) {
            // Small delay to allow transition to finish
            const timer = setTimeout(() => {
                setActiveView("menu");
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleUpdateAdminNote = async () => {
        if (!booking) return;

        setIsUpdatingNote(true);
        try {
            const { error } = await supabase
                .from("bookings")
                .update({ admin_note: adminNote || null })
                .eq("id", booking.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Admin note updated successfully",
            });
            onBookingUpdated();
            setActiveView("menu");
        } catch (error) {
            console.error("Error updating admin note:", error);
            toast({
                title: "Error",
                description: "Failed to update admin note",
                variant: "destructive",
            });
        } finally {
            setIsUpdatingNote(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!booking) return;

        setIsGeneratingPdf(true);
        try {
            // Prepare booking data for PDF
            const experience = booking.experiences;
            const activity = booking.time_slots?.activities || booking.activities;

            // Get location URL - prioritize experience location if available
            const locationUrl = experience?.location_url ||
                (experience?.location?.startsWith("http") ? experience.location : "") ||
                "";

            const bookingData = {
                participantName: booking.contact_person_name || "Guest",
                activityName: activity?.name || experience?.title || "Activity",
                dateTime: booking.time_slots
                    ? `${format(new Date(booking.booking_date), "dd/MM/yyyy")} - ${booking.time_slots.start_time
                    } - ${booking.time_slots.end_time}`
                    : format(new Date(booking.booking_date), "dd/MM/yyyy"),
                pickUpLocation: experience?.location || "-",
                spotLocation: booking.pickup_location || experience?.location2 || "-",
                spotLocationUrl: (booking.pickup_location || experience?.location2)?.startsWith("http") ? (booking.pickup_location || experience?.location2) : "",
                totalParticipants: booking.total_participants || 1,
                amountPaid: String(booking.booking_amount || 0),
                amountToBePaid: String(booking.due_amount || 0),
                currency: experience?.currency || "INR",
            };

            const pdfUrl = await generateInvoicePdf(bookingData, booking.id);

            // Open PDF in new tab
            window.open(pdfUrl, "_blank");

            toast({
                title: "Success",
                description: "PDF generated successfully",
            });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({
                title: "Error",
                description: "Failed to generate PDF",
                variant: "destructive",
            });
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleEditExperience = () => {
        if (booking?.experiences?.id) {
            navigate(`/admin/experiences/edit/${booking.experiences.id}`);
            onClose();
        }
    };

    if (!booking) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Quick Actions</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {activeView === "menu" ? (
                        <div className="grid gap-4">
                            <Button
                                variant="outline"
                                className="justify-start h-auto py-4 px-6 text-base font-normal hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all"
                                onClick={() => setActiveView("admin_note")}
                            >
                                <Edit className="mr-4 h-5 w-5" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold">Edit Admin Note</span>
                                    <span className="text-xs text-muted-foreground mt-0.5">
                                        Add or modify internal notes
                                    </span>
                                </div>
                            </Button>

                            <Button
                                variant="outline"
                                className="justify-start h-auto py-4 px-6 text-base font-normal hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all"
                                onClick={handleDownloadPdf}
                                disabled={isGeneratingPdf}
                            >
                                {isGeneratingPdf ? (
                                    <Loader2 className="mr-4 h-5 w-5 animate-spin" />
                                ) : (
                                    <FileText className="mr-4 h-5 w-5" />
                                )}
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold">Download Ticket PDF</span>
                                    <span className="text-xs text-muted-foreground mt-0.5">
                                        Generate and download booking invoice
                                    </span>
                                </div>
                            </Button>

                            <Button
                                variant="outline"
                                className="justify-start h-auto py-4 px-6 text-base font-normal hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all"
                                onClick={handleEditExperience}
                            >
                                <Edit className="mr-4 h-5 w-5" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold">Edit Experience</span>
                                    <span className="text-xs text-muted-foreground mt-0.5">
                                        Go to experience settings
                                    </span>
                                </div>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setActiveView("menu")}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <span className="font-semibold">Edit Admin Note</span>
                            </div>

                            <Textarea
                                placeholder="Enter admin note..."
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                className="min-h-[150px] resize-none"
                            />

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setActiveView("menu")}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleUpdateAdminNote}
                                    disabled={isUpdatingNote}
                                    className="bg-brand-primary"
                                >
                                    {isUpdatingNote ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    Save Note
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
