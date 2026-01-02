//@ts-nocheck
import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
    FileText,
    Edit,
    Save,
    ArrowLeft,
    Loader2,
    DollarSign,
    XCircle,
} from "lucide-react";
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
    const [activeView, setActiveView] = useState<
        "menu" | "admin_note" | "edit_booking" | "cancel_booking"
    >("menu");
    const [adminNote, setAdminNote] = useState("");
    const [isUpdatingNote, setIsUpdatingNote] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isCancelingBooking, setIsCancelingBooking] = useState(false);

    // Edit booking form state
    const [contactPersonName, setContactPersonName] = useState("");
    const [contactPersonNumber, setContactPersonNumber] = useState("");
    const [bookingAmount, setBookingAmount] = useState("");
    const [advance, setAdvance] = useState("");
    const [totalParticipants, setTotalParticipants] = useState("");
    const [isUpdatingBooking, setIsUpdatingBooking] = useState(false);

    // Initialize admin note when booking changes or modal opens
    React.useEffect(() => {
        if (booking) {
            setAdminNote(booking.admin_note || "");
            // Initialize edit booking form
            setContactPersonName(booking.contact_person_name || "");
            setContactPersonNumber(booking.contact_person_number || "");
            setBookingAmount(booking.booking_amount?.toString() || "0");
            setTotalParticipants(booking.total_participants?.toString() || "1");
            // Calculate advance from booking_amount - due_amount
            const bookingAmt = parseFloat(booking.booking_amount?.toString() || "0");
            const dueAmt = parseFloat(booking.due_amount?.toString() || "0");
            setAdvance((bookingAmt - dueAmt).toString());
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
                .update({ admin_note: adminNote || null } as any)
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
            const locationUrl =
                experience?.location_url ||
                (experience?.location?.startsWith("http") ? experience.location : "") ||
                "";

            // Fetch logo_url from vendor profile if vendor_id is available
            let logoUrl = "";
            if (experience?.vendor_id) {
                try {
                    const { data: vendorProfile } = await supabase
                        .from("profiles")
                        .select("logo_url")
                        .eq("id", experience.vendor_id)
                        .single();
                    
                    logoUrl = (vendorProfile as any)?.logo_url || "";
                } catch (error) {
                    console.error("Error fetching vendor logo_url:", error);
                }
            }

            // Fallback: Extract logoUrl from booking data (could be in experience, vendor, or booking itself)
            if (!logoUrl) {
                logoUrl = 
                    (booking as any)?.logoUrl || 
                    experience?.logoUrl || 
                    (experience as any)?.logo_url ||
                    ((booking as any)?.experiences as any)?.logoUrl ||
                    ((booking as any)?.experiences as any)?.logo_url ||
                    "";
            }

            const bookingData = {
                participantName: booking.contact_person_name || "Guest",
                experienceTitle: experience?.title || "Activity",
                activityName: activity?.name || "",
                dateTime: booking.time_slots
                    ? `${format(new Date(booking.booking_date), "dd/MM/yyyy")} - ${booking.time_slots.start_time
                    } - ${booking.time_slots.end_time}`
                    : format(new Date(booking.booking_date), "dd/MM/yyyy"),
                pickUpLocation: experience?.location || "-",
                spotLocation: booking.pickup_location || experience?.location2 || "-",
                spotLocationUrl: (
                    booking.pickup_location || experience?.location2
                )?.startsWith("http")
                    ? booking.pickup_location || experience?.location2
                    : "",
                totalParticipants: booking.total_participants || 1,
                amountPaid: String(booking.booking_amount || 0),
                amountToBePaid: String(booking.due_amount || 0),
                currency: experience?.currency || "INR",
                logoUrl: logoUrl || undefined,
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

    const handleCancelBooking = async () => {
        if (!booking) return;

        setIsCancelingBooking(true);
        try {
            const { error } = await supabase
                .from("bookings")
                .update({ type: "canceled" } as any)
                .eq("id", booking.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Booking canceled successfully",
            });
            onBookingUpdated();
            onClose();
        } catch (error) {
            console.error("Error canceling booking:", error);
            toast({
                title: "Error",
                description: "Failed to cancel booking",
                variant: "destructive",
            });
        } finally {
            setIsCancelingBooking(false);
        }
    };

    const handleUpdateBooking = async () => {
        if (!booking) return;

        // Validate inputs
        if (!contactPersonName.trim()) {
            toast({
                title: "Validation Error",
                description: "Contact person name is required",
                variant: "destructive",
            });
            return;
        }

        if (!contactPersonNumber.trim()) {
            toast({
                title: "Validation Error",
                description: "Contact person number is required",
                variant: "destructive",
            });
            return;
        }

        const bookingAmountNum = parseFloat(bookingAmount) || 0;
        const advanceNum = parseFloat(advance) || 0;
        const totalParticipantsNum = parseInt(totalParticipants) || 1;

        if (totalParticipantsNum < 1) {
            toast({
                title: "Validation Error",
                description: "Number of participants must be at least 1",
                variant: "destructive",
            });
            return;
        }

        if (totalParticipantsNum > 50) {
            toast({
                title: "Validation Error",
                description: "Number of participants cannot exceed 50",
                variant: "destructive",
            });
            return;
        }

        if (bookingAmountNum < 0) {
            toast({
                title: "Validation Error",
                description: "Booking amount cannot be negative",
                variant: "destructive",
            });
            return;
        }

        if (advanceNum < 0) {
            toast({
                title: "Validation Error",
                description: "Advance cannot be negative",
                variant: "destructive",
            });
            return;
        }

        if (advanceNum > bookingAmountNum) {
            toast({
                title: "Validation Error",
                description: "Advance cannot be greater than booking amount",
                variant: "destructive",
            });
            return;
        }

        setIsUpdatingBooking(true);
        try {
            // Calculate due_amount: booking_amount - advance
            const dueAmountNum = bookingAmountNum - advanceNum;

            // Update booking
            const { error: bookingError } = await supabase
                .from("bookings")
                .update({
                    contact_person_name: contactPersonName.trim(),
                    contact_person_number: contactPersonNumber.trim(),
                    booking_amount: bookingAmountNum,
                    due_amount: dueAmountNum,
                    total_participants: totalParticipantsNum,
                } as any)
                .eq("id", booking.id);

            if (bookingError) throw bookingError;

            // Update booking_participants if they exist
            const { data: participants } = await supabase
                .from("booking_participants")
                .select("id")
                .eq("booking_id", booking.id);

            if (participants && participants.length > 0) {
                // Update all participants with new contact info
                const { error: participantsError } = await supabase
                    .from("booking_participants")
                    .update({
                        name: contactPersonName.trim(),
                        phone_number: contactPersonNumber.trim(),
                    })
                    .eq("booking_id", booking.id);

                if (participantsError) {
                    console.error("Error updating participants:", participantsError);
                    // Don't throw - booking update succeeded
                }
            }

            toast({
                title: "Success",
                description: "Booking updated successfully",
            });
            onBookingUpdated();
            setActiveView("menu");
        } catch (error) {
            console.error("Error updating booking:", error);
            toast({
                title: "Error",
                description: "Failed to update booking",
                variant: "destructive",
            });
        } finally {
            setIsUpdatingBooking(false);
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
                                onClick={() => setActiveView("edit_booking")}
                            >
                                <DollarSign className="mr-4 h-5 w-5" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold">Edit Booking</span>
                                    <span className="text-xs text-muted-foreground mt-0.5">
                                        Update contact info and amounts
                                    </span>
                                </div>
                            </Button>

                            {booking && (booking as any)?.type !== "canceled" && (
                                <Button
                                    variant="outline"
                                    className="justify-start h-auto py-4 px-6 text-base font-normal hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all"
                                    onClick={() => setActiveView("cancel_booking")}
                                >
                                    <XCircle className="mr-4 h-5 w-5" />
                                    <div className="flex flex-col items-start">
                                        <span className="font-semibold">Cancel Booking</span>
                                        <span className="text-xs text-muted-foreground mt-0.5">
                                            Mark this booking as canceled
                                        </span>
                                    </div>
                                </Button>
                            )}

                            {/* <Button
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
              </Button> */}
                        </div>
                    ) : activeView === "admin_note" ? (
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
                    ) : activeView === "edit_booking" ? (
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
                                <span className="font-semibold">Edit Booking</span>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contactName">Contact Person Name *</Label>
                                    <Input
                                        id="contactName"
                                        placeholder="Enter contact person name"
                                        value={contactPersonName}
                                        onChange={(e) => setContactPersonName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contactNumber">Contact Person Number *</Label>
                                    <Input
                                        id="contactNumber"
                                        placeholder="Enter contact person number"
                                        value={contactPersonNumber}
                                        onChange={(e) => setContactPersonNumber(e.target.value)}
                                        maxLength={10}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="totalParticipants">
                                        Number of Participants *
                                    </Label>
                                    <Input
                                        id="totalParticipants"
                                        type="number"
                                        placeholder="Enter number of participants"
                                        value={totalParticipants}
                                        onChange={(e) => setTotalParticipants(e.target.value)}
                                        min="1"
                                        max="50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bookingAmount">Booking Amount *</Label>
                                    <Input
                                        id="bookingAmount"
                                        type="number"
                                        placeholder="Enter booking amount"
                                        value={bookingAmount}
                                        onChange={(e) => setBookingAmount(e.target.value)}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="advance">Advance *</Label>
                                    <Input
                                        id="advance"
                                        type="number"
                                        placeholder="Enter advance amount"
                                        value={advance}
                                        onChange={(e) => setAdvance(e.target.value)}
                                        min="0"
                                        step="0.01"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Due Amount:{" "}
                                        {(() => {
                                            const booking = parseFloat(bookingAmount) || 0;
                                            const adv = parseFloat(advance) || 0;
                                            return (booking - adv).toFixed(2);
                                        })()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => setActiveView("menu")}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleUpdateBooking}
                                    disabled={isUpdatingBooking}
                                    className="bg-brand-primary"
                                >
                                    {isUpdatingBooking ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    Save Changes
                                </Button>
                            </div>
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
                                <span className="font-semibold text-red-600">
                                    Cancel Booking
                                </span>
                            </div>

                            <div className="space-y-4 py-4">
                                <div className="text-sm text-gray-700">
                                    Are you sure you want to cancel this booking?
                                    {booking?.experiences?.title && (
                                        <div className="mt-2 p-3 bg-gray-50 rounded-md">
                                            <span className="font-medium">Booking:</span>{" "}
                                            {booking.experiences.title}
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
                                    onClick={() => setActiveView("menu")}
                                    disabled={isCancelingBooking}
                                >
                                    Keep Booking
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleCancelBooking}
                                    disabled={isCancelingBooking}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    {isCancelingBooking ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
