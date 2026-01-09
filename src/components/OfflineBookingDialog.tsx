// @ts-nocheck
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, Clock, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { SendWhatsappMessage } from "@/utils/whatsappUtil";
import { generateInvoicePdf } from "@/utils/generateInvoicePdf";

import "../Styles/OfflineBookingDialog.css";
import moment from "moment";

const offlineBookingSchema = z.object({
  experience_id: z.string().min(1, "Please select an experience"),
  activity_id: z.string().min(1, "Please select an activity"),
  time_slot_id: z.string().optional(),
  contact_person_name: z.string().min(1, "Name is required"),
  contact_person_number: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[0-9]+$/, "Phone number must contain only numbers")
    .length(10, "Phone number must be exactly 10 digits"),
  contact_person_email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  total_participants: z
    .number()
    .min(1, "At least one participant is required")
    .max(50, "Maximum 50 participants allowed"),
  booking_amount_per_person: z
    .number()
    .min(0, "Amount per person must be positive")
    .optional(),
  advance_amount: z
    .number()
    .min(0, "Advance amount must be positive")
    .optional(),
  booking_date: z.date({ required_error: "Please select a date" }),
  note_for_guide: z.string().optional(),
});

type OfflineBookingFormData = z.infer<typeof offlineBookingSchema>;

interface OfflineBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: () => void;
}

export const OfflineBookingDialog = ({
  isOpen,
  onClose,
  onBookingSuccess,
}: OfflineBookingDialogProps) => {
  const { user } = useAuth();
  const { isVendor, isAgent, isAdmin } = useUserRole();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlotId, setSelectedSlotId] = useState<string | undefined>(
    undefined
  );
  const [showB2BPrice, setShowB2BPrice] = useState(false);

  const form = useForm<OfflineBookingFormData>({
    resolver: zodResolver(offlineBookingSchema),
    mode: "onBlur",
    defaultValues: {
      experience_id: "",
      activity_id: "",
      time_slot_id: "",
      contact_person_name: "",
      contact_person_number: "",
      contact_person_email: "",
      total_participants: 1,
      booking_amount_per_person: 0,
      advance_amount: 0,
      note_for_guide: "",
    },
  });

  // Fetch agent profile for agent name
  const { data: agentProfile } = useQuery({
    queryKey: ["agent-profile", user?.id],
    queryFn: async () => {
      if (!user?.id || !isAgent) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && isAgent,
  });

  // Fetch experiences - vendor's own experiences OR all active experiences for agents/admins
  const { data: experiences = [] } = useQuery({
    queryKey: [
      "offline-booking-experiences",
      user?.id,
      isVendor,
      isAgent,
      isAdmin,
    ],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from("experiences")
        .select("id, title, currency")
        .eq("is_active", true);

      // For vendors, filter by vendor_id; for agents, get only experiences with for_agent=true; for admins, get all active experiences
      if (isVendor) {
        query = query.eq("vendor_id", user.id);
      } else if (isAgent && !isAdmin) {
        // For agents (not admins), only show experiences where for_agent is true
        query = query.eq("for_agent", true);
      }
      // For admins, no filter - get all active experiences

      query = query.order("title", { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && (isVendor || isAgent || isAdmin),
  });

  const selectedExperienceId = form.watch("experience_id");

  // Fetch activities for selected experience
  const { data: activities = [] } = useQuery({
    queryKey: ["experience-activities", selectedExperienceId],
    queryFn: async () => {
      if (!selectedExperienceId) return [];

      const { data, error } = await supabase
        .from("activities")
        .select("id, name, price, currency, b2bPrice")
        .eq("experience_id", selectedExperienceId)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedExperienceId,
  });

  const selectedActivity = activities.find(
    (a) => a.id === form.watch("activity_id")
  );
  const participantCount = form.watch("total_participants");

  // Fetch time slots for selected date and activity
  const { data: timeSlots = [] } = useQuery({
    queryKey: [
      "time-slots-offline",
      selectedExperienceId,
      selectedDate,
      selectedActivity?.id,
    ],
    queryFn: async () => {
      if (!selectedDate || !selectedActivity?.id) return [];

      const dateStr = selectedDate.toISOString().split("T")[0];

      // Get time slots for the experience and activity
      const { data: slots, error: slotsError } = await supabase
        .from("time_slots")
        .select("*")
        .eq("experience_id", selectedExperienceId)
        .eq("activity_id", selectedActivity.id);

      if (slotsError) throw slotsError;

      // Get bookings for this specific date
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("time_slot_id, total_participants")
        .eq("experience_id", selectedExperienceId)
        .gte("booking_date", `${dateStr}T00:00:00`)
        .lt("booking_date", `${dateStr}T23:59:59`)
        .eq("status", "confirmed");

      if (bookingsError) throw bookingsError;

      // Calculate availability for each slot
      const slotsWithAvailability = slots.map((slot: any) => {
        const slotBookings = bookings.filter(
          (booking: any) => booking.time_slot_id === slot.id
        );
        const bookedCount = slotBookings.reduce(
          (sum: number, booking: any) => sum + booking.total_participants,
          0
        );
        const availableSpots = slot.capacity - bookedCount;

        return {
          ...slot,
          booked_count: bookedCount,
          available_spots: Math.max(0, availableSpots),
        };
      });

      // Sort by start_time in ascending order
      slotsWithAvailability.sort((a: any, b: any) => {
        const timeA = a.start_time || "";
        const timeB = b.start_time || "";
        return timeA.localeCompare(timeB);
      });

      return slotsWithAvailability;
    },
    enabled: !!selectedDate && !!selectedActivity?.id && !!selectedExperienceId,
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setSelectedDate(undefined);
      setSelectedSlotId(undefined);
      setShowB2BPrice(false);
    }
  }, [isOpen, form]);

  // Validate vendor/agent/admin access
  useEffect(() => {
    if (!isVendor && !isAgent && !isAdmin && user) {
      //   console.log("isVendor", isVendor, "isAgent", isAgent, "isAdmin", isAdmin, user);
      //   toast({
      //     title: "Access Denied",
      //     description: "Only vendors, agents, and admins can create offline bookings.",
      //     variant: "destructive",
      //   });
      onClose();
    }
  }, [isVendor, isAgent, isAdmin, user, toast, onClose]);

  const handleClose = () => {
    form.reset();
    setSelectedDate(undefined);
    setSelectedSlotId(undefined);
    setIsSubmitting(false);
    onClose();
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  };

  const sendBookingConfirmation = async (
    data: OfflineBookingFormData,
    bookingId: string,
    experience: any,
    activity: any
  ) => {
    try {
      // Get experience details with location and vendor_id
      const { data: experienceDetails } = await supabase
        .from("experiences")
        .select("title, location, location2, currency, vendor_id")
        .eq("id", data.experience_id)
        .single();

      // Get vendor profile (for vendor bookings, use user.id; for agent bookings, use experience vendor_id)
      const vendorId = isVendor ? user?.id : experienceDetails?.vendor_id;
      const { data: vendor, error: vendorError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", vendorId)
        .single();

      if (vendorError) {
        console.error("Error fetching vendor profile:", vendorError);
      }

      const bookingAmount =
        (data.booking_amount_per_person || 0) * data.total_participants ||
        (activity?.price ? activity.price * data.total_participants : 0);
      const advanceAmount = data.advance_amount || 0;
      const dueAmount = Math.max(0, bookingAmount - advanceAmount) || 0;
      const bookingDate = selectedDate || new Date();
      const formattedDate = moment(bookingDate).format("DD/MM/YYYY");

      // Get agent name for WhatsApp messages (only for agents, not admins)
      const agentName =
        isAgent && !isAdmin && agentProfile
          ? `${agentProfile.first_name || ""} ${
              agentProfile.last_name || ""
            }`.trim()
          : "";

      // Get time slot details if selected
      let timeSlotText = "Offline Booking";
      let formattedDateTime = `${formattedDate} - Offline Booking`;
      let selectedSlot = null;
      if (selectedSlotId) {
        selectedSlot = timeSlots.find(
          (slot: any) => slot.id === selectedSlotId
        );
        if (selectedSlot) {
          const startTime = moment(selectedSlot.start_time, "HH:mm").format(
            "hh:mm A"
          );
          const endTime = moment(selectedSlot.end_time, "HH:mm").format(
            "hh:mm A"
          );
          timeSlotText = `${formattedDate} - ${startTime} - ${endTime}`;
          formattedDateTime = `${formattedDate} - ${startTime} - ${endTime}`;
        }
      }

      // Add agent name in brackets to date/time strings if agent (not admin)
      if (isAgent && !isAdmin && agentName) {
        timeSlotText = `${timeSlotText} (${agentName})`;
        formattedDateTime = `${formattedDateTime} (${agentName})`;
      }

      // Generate PDF invoice with retry mechanism
      let pdfUrl = "";
      let pdfGenerationError = null;
      const maxRetries = 2;

      const generatePdfWithRetry = async (retryCount = 0): Promise<string> => {
        try {
          const locationUrl = experienceDetails?.location;
          const location2Url = experienceDetails?.location2;
          const generatedUrl = await generateInvoicePdf(
            {
              participantName: data.contact_person_name,
              experienceTitle:
                experienceDetails?.title || experience?.title || "Activity",
              activityName: activity?.name || "",
              dateTime: formattedDateTime,
              pickUpLocation: experienceDetails?.location || "-",
              spotLocation: experienceDetails?.location2 || "-",
              spotLocationUrl: experienceDetails?.location2?.startsWith("http")
                ? experienceDetails.location2
                : "",
              totalParticipants: data.total_participants,
              amountPaid: (bookingAmount - dueAmount).toFixed(2),
              amountToBePaid: dueAmount.toFixed(2),
              currency:
                activity?.currency || experienceDetails?.currency || "INR",
            },
            bookingId
          );

          // Validate PDF URL was generated
          if (!generatedUrl || generatedUrl.trim() === "") {
            throw new Error("PDF generation returned empty URL");
          }

          // Validate URL format
          if (!generatedUrl.startsWith("http")) {
            throw new Error(`PDF URL is not a valid HTTP URL: ${generatedUrl}`);
          }

          return generatedUrl;
        } catch (error: any) {
          if (retryCount < maxRetries) {
            console.warn(
              `PDF generation attempt ${retryCount + 1} failed, retrying...`,
              {
                bookingId,
                error: error?.message || String(error),
              }
            );
            // Wait 500ms before retry
            await new Promise((resolve) => setTimeout(resolve, 500));
            return generatePdfWithRetry(retryCount + 1);
          }
          throw error;
        }
      };

      try {
        pdfUrl = await generatePdfWithRetry();
      } catch (pdfError: any) {
        pdfGenerationError = pdfError;
        // Log comprehensive error details (non-blocking)
        const errorLog = {
          bookingId,
          customerName: data.contact_person_name,
          customerPhone: data.contact_person_number,
          experienceId: data.experience_id,
          activityId: data.activity_id,
          error: pdfError?.message || String(pdfError),
          stack: pdfError?.stack,
          timestamp: new Date().toISOString(),
          retriesAttempted: maxRetries,
        };

        // Log to console (non-blocking)
        console.error(
          "PDF generation failed for offline booking after retries:",
          errorLog
        );

        // Log to Supabase for tracking (fire-and-forget, non-blocking)
        // Use setTimeout to ensure it doesn't block the main flow
        setTimeout(() => {
          supabase
            .from("logs")
            .insert({
              type: "pdf_generation_error",
              booking_id: bookingId,
              error_message: pdfError?.message || String(pdfError),
              metadata: {
                customer_name: data.contact_person_name,
                customer_phone: data.contact_person_number,
                experience_id: data.experience_id,
                activity_id: data.activity_id,
                retries_attempted: maxRetries,
                error_stack: pdfError?.stack,
              },
              created_at: new Date().toISOString(),
            })
            .then(({ error: logError }) => {
              if (logError) {
                // Table might not exist, just log to console
                console.error(
                  "Failed to log PDF error to database (table may not exist):",
                  logError
                );
              }
            })
            .catch((logError) => {
              // Ignore logging errors - table might not exist
              console.error("Error logging to database:", logError);
            });
        }, 0);
      }

      // Validate PDF URL before sending WhatsApp
      const hasValidPdfUrl =
        pdfUrl && pdfUrl.trim() !== "" && pdfUrl.startsWith("http");

      if (!hasValidPdfUrl && !pdfGenerationError) {
        // If PDF URL is empty but no error was caught, log it (non-blocking)
        console.error("PDF URL is invalid or empty:", {
          bookingId,
          pdfUrl,
          customerName: data.contact_person_name,
          customerPhone: data.contact_person_number,
        });
      }

      // Customer WhatsApp message
      let customerWhatsappBody = {};
      const phoneNumber =
        data.contact_person_number.toString().length !== 10
          ? data.contact_person_number
          : "+91" + data.contact_person_number.toString();
      if (hasValidPdfUrl) {
        if (
          experienceDetails?.location !== null &&
          experienceDetails?.location2 !== null &&
          experienceDetails?.location2 !== "" &&
          experienceDetails?.location !== ""
        ) {
          // Two location template with PDF
          customerWhatsappBody = {
            integrated_number: "919274046332",
            content_type: "template",
            payload: {
              messaging_product: "whatsapp",
              type: "template",
              template: {
                name: "user_ticket_confirmation_two_location_v2",
                language: {
                  code: "en",
                  policy: "deterministic",
                },
                namespace: "ca756b77_f751_41b3_adb9_96ed99519854",
                to_and_components: [
                  {
                    to: [phoneNumber],
                    components: {
                      // Always include header_1 if we have a valid PDF URL
                      ...(hasValidPdfUrl
                        ? {
                            header_1: {
                              filename: `bucketlistt.com_ticket_${bookingId}.pdf`,
                              type: "document",
                              value: pdfUrl,
                            },
                          }
                        : {}),
                      body_1: {
                        type: "text",
                        value: data.contact_person_name,
                      },
                      body_2: {
                        type: "text",
                        value: activity?.name || "",
                      },
                      body_3: {
                        type: "text",
                        value: formattedDateTime,
                      },
                      body_4: {
                        type: "text",
                        value: experienceDetails?.location || "",
                      },
                      body_5: {
                        type: "text",
                        value: experienceDetails?.location2 || "",
                      },
                      body_6: {
                        type: "text",
                        value: data.total_participants.toString(),
                      },
                      body_7: {
                        type: "text",
                        value: (bookingAmount - dueAmount)
                          .toFixed(2)
                          .toString(),
                      },
                      body_8: {
                        type: "text",
                        value: dueAmount.toFixed(2).toString() || "0",
                      },
                    },
                  },
                ],
              },
            },
          };
        } else {
          // Single location template with PDF
          customerWhatsappBody = {
            integrated_number: "919274046332",
            content_type: "template",
            payload: {
              messaging_product: "whatsapp",
              type: "template",
              template: {
                name: "confirmation_user_with_ticket",
                language: {
                  code: "en",
                  policy: "deterministic",
                },
                namespace: "ca756b77_f751_41b3_adb9_96ed99519854",
                to_and_components: [
                  {
                    to: [phoneNumber],
                    components: {
                      // Always include header_1 if we have a valid PDF URL
                      ...(hasValidPdfUrl
                        ? {
                            header_1: {
                              filename: `bucketlistt.com_ticket_${bookingId}.pdf`,
                              type: "document",
                              value: pdfUrl,
                            },
                          }
                        : {}),
                      body_1: {
                        type: "text",
                        value: data.contact_person_name,
                      },
                      body_2: {
                        type: "text",
                        value: activity?.name || "",
                      },
                      body_3: {
                        type: "text",
                        value: formattedDateTime,
                      },
                      body_4: {
                        type: "text",
                        value: experienceDetails?.location || "",
                      },
                      body_5: {
                        type: "text",
                        value: data.total_participants.toString(),
                      },
                      body_6: {
                        type: "text",
                        value: (bookingAmount - dueAmount)
                          .toFixed(2)
                          .toString(),
                      },
                      body_7: {
                        type: "text",
                        value: dueAmount.toFixed(2).toString() || "0",
                      },
                    },
                  },
                ],
              },
            },
          };
        }
      } else {
        if (
          experienceDetails?.location !== null &&
          experienceDetails?.location2 !== null &&
          experienceDetails?.location2 !== "" &&
          experienceDetails?.location !== ""
        ) {
          customerWhatsappBody = {
            integrated_number: "919274046332",
            content_type: "template",
            payload: {
              messaging_product: "whatsapp",
              type: "template",
              template: {
                name: "booking_confirmation_two_location",
                language: {
                  code: "en",
                  policy: "deterministic",
                },
                namespace: "ca756b77_f751_41b3_adb9_96ed99519854",
                to_and_components: [
                  {
                    to: [phoneNumber],
                    components: {
                      // Always include header_1 if we have a valid PDF URL
                      body_1: {
                        type: "text",
                        value: data.contact_person_name,
                      },
                      body_2: {
                        type: "text",
                        value: activity?.name || "",
                      },
                      body_3: {
                        type: "text",
                        value: formattedDateTime,
                      },
                      body_4: {
                        type: "text",
                        value: experienceDetails?.location || "",
                      },
                      body_5: {
                        type: "text",
                        value: experienceDetails?.location2 || "",
                      },
                      body_6: {
                        type: "text",
                        value: data.total_participants.toString(),
                      },
                      body_7: {
                        type: "text",
                        value: (bookingAmount - dueAmount)
                          .toFixed(2)
                          .toString(),
                      },
                      body_8: {
                        type: "text",
                        value: dueAmount.toFixed(2).toString() || "0",
                      },
                    },
                  },
                ],
              },
            },
          };
        } else {
          customerWhatsappBody = {
            integrated_number: "919274046332",
            content_type: "template",
            payload: {
              messaging_product: "whatsapp",
              type: "template",
              template: {
                name: "booking_confirmation_two_location",
                language: {
                  code: "en",
                  policy: "deterministic",
                },
                namespace: "ca756b77_f751_41b3_adb9_96ed99519854",
                to_and_components: [
                  {
                    to: [phoneNumber],
                    components: {
                      // Always include header_1 if we have a valid PDF URL
                      body_1: {
                        type: "text",
                        value: data.contact_person_name,
                      },
                      body_2: {
                        type: "text",
                        value: activity?.name || "",
                      },
                      body_3: {
                        type: "text",
                        value: formattedDateTime,
                      },
                      body_4: {
                        type: "text",
                        value: "",
                      },
                      body_5: {
                        type: "text",
                        value: experienceDetails?.location || "",
                      },
                      body_6: {
                        type: "text",
                        value: data.total_participants.toString(),
                      },
                      body_7: {
                        type: "text",
                        value: (bookingAmount - dueAmount)
                          .toFixed(2)
                          .toString(),
                      },
                      body_8: {
                        type: "text",
                        value: dueAmount.toFixed(2).toString() || "0",
                      },
                    },
                  },
                ],
              },
            },
          };
        }
      }

      // Log WhatsApp body structure before sending (for debugging) - non-blocking
      if (!hasValidPdfUrl) {
        const warningMessage = {
          bookingId,
          customerName: data.contact_person_name,
          customerPhone: data.contact_person_number,
          experienceId: data.experience_id,
          activityId: data.activity_id,
          hasHeader1: hasValidPdfUrl,
          pdfUrl: pdfUrl || "EMPTY",
          pdfError: pdfGenerationError?.message || "Unknown error",
          timestamp: new Date().toISOString(),
          warning:
            "WhatsApp message will be sent WITHOUT header_1 (PDF document). This may cause template format mismatch errors.",
        };

        // Log to console (non-blocking)
        console.error(
          "⚠️ CRITICAL: Sending WhatsApp without PDF header_1:",
          warningMessage
        );

        // Log to database (fire-and-forget, non-blocking)
        // Use setTimeout to ensure it doesn't block the main flow
        setTimeout(() => {
          supabase
            .from("logs")
            .insert({
              type: "whatsapp_missing_pdf_header",
              booking_id: bookingId,
              error_message:
                "PDF generation failed, header_1 not included in WhatsApp message",
              metadata: warningMessage,
              created_at: new Date().toISOString(),
            })
            .catch(() => {
              // Ignore if table doesn't exist or any other error
            });
        }, 0);
      }

      // Send customer WhatsApp
      await SendWhatsappMessage(customerWhatsappBody);
      const activityPrice = activity?.price * data.total_participants || 0;
      const discountAmount = activityPrice - bookingAmount || 0;
      const advancePlusDiscountAmount = advanceAmount + discountAmount;

      const discountPlusAdvanceAmount = 0;
      // Vendor WhatsApp message
      const vendorWhatsappBody = {
        integrated_number: "919274046332",
        content_type: "template",
        payload: {
          messaging_product: "whatsapp",
          type: "template",
          template: {
            name: "booking_confirmation_vendor_v2",
            language: {
              code: "en",
              policy: "deterministic",
            },
            namespace: "ca756b77_f751_41b3_adb9_96ed99519854",
            to_and_components: [
              {
                to: [
                  vendor?.phone_number?.toString().length !== 10
                    ? vendor?.phone_number
                    : "+91" + vendor?.phone_number?.toString(),
                ],
                components: {
                  body_1: {
                    type: "text",
                    value: data.contact_person_name,
                  },
                  body_2: {
                    type: "text",
                    value: data.total_participants.toString(),
                  },
                  body_3: {
                    type: "text",
                    value: data.contact_person_number,
                  },
                  body_4: {
                    type: "text",
                    value: experienceDetails?.title || experience?.title || "",
                  },
                  body_5: {
                    type: "text",
                    value: activity?.name || "",
                  },
                  body_6: {
                    type: "text",
                    value: timeSlotText,
                  },
                  body_7: {
                    type: "text",
                    value: dueAmount.toFixed(2).toString() || "0",
                  },
                  body_8: {
                    type: "text",
                    value:
                      advancePlusDiscountAmount.toFixed(2).toString() || "0",
                  },
                },
              },
            ],
          },
        },
      };

      // Send vendor WhatsApp
      await SendWhatsappMessage(vendorWhatsappBody);

      // Admin WhatsApp message
      const adminWhatsappBody = {
        integrated_number: "919274046332",
        content_type: "template",
        payload: {
          messaging_product: "whatsapp",
          type: "template",
          template: {
            name: "booking_confirmation_vendor_v2",
            language: {
              code: "en",
              policy: "deterministic",
            },
            namespace: "ca756b77_f751_41b3_adb9_96ed99519854",
            to_and_components: [
              {
                to: ["+919265636871"],
                components: {
                  body_1: {
                    type: "text",
                    value: data.contact_person_name,
                  },
                  body_2: {
                    type: "text",
                    value: data.total_participants.toString(),
                  },
                  body_3: {
                    type: "text",
                    value: data.contact_person_number,
                  },
                  body_4: {
                    type: "text",
                    value: experienceDetails?.title || experience?.title || "",
                  },
                  body_5: {
                    type: "text",
                    value: activity?.name || "",
                  },
                  body_6: {
                    type: "text",
                    value: timeSlotText,
                  },
                  body_7: {
                    type: "text",
                    value: dueAmount.toFixed(2).toString() || "0",
                  },
                  body_8: {
                    type: "text",
                    value:
                      advancePlusDiscountAmount.toFixed(2).toString() || "0",
                  },
                },
              },
            ],
          },
        },
      };

      // Send admin WhatsApp
      await SendWhatsappMessage(adminWhatsappBody);

      // Send email confirmation only if email is provided
      if (
        data.contact_person_email &&
        data.contact_person_email.trim() !== ""
      ) {
        try {
          const emailResponse = await supabase.functions.invoke(
            "send-booking-confirmation",
            {
              body: {
                customerEmail: data.contact_person_email,
                customerName: data.contact_person_name,
                experienceTitle:
                  experienceDetails?.title || experience?.title || "",
                activityName: activity?.name || "",
                bookingDate: bookingDate.toISOString(),
                formattedDateTime: formattedDateTime,
                timeSlot: selectedSlotId
                  ? (() => {
                      const selectedSlot = timeSlots.find(
                        (slot: any) => slot.id === selectedSlotId
                      );
                      return selectedSlot
                        ? `${selectedSlot.start_time} - ${selectedSlot.end_time}`
                        : "Offline Booking";
                    })()
                  : "Offline Booking",
                location: experienceDetails?.location || "",
                location2: experienceDetails?.location2 || null,
                totalParticipants: data.total_participants,
                totalAmount: bookingAmount,
                upfrontAmount: advanceAmount,
                dueAmount: dueAmount.toFixed(2),
                partialPayment: false,
                currency:
                  activity?.currency || experienceDetails?.currency || "INR",
                participants: Array.from(
                  { length: data.total_participants },
                  () => ({
                    name: data.contact_person_name,
                    email: data.contact_person_email,
                    phone_number: data.contact_person_number,
                  })
                ),
                bookingId: bookingId,
                noteForGuide: data.note_for_guide || "",
                paymentId: "",
              },
            }
          );

          if (emailResponse.error) {
            console.error("Email sending error:", emailResponse.error);
            // Don't throw - email is optional for offline bookings
          }
        } catch (emailError) {
          console.error("Error sending email:", emailError);
          // Don't throw - email is optional for offline bookings
        }
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
      // Don't throw - booking is already created, just log the error
    }
  };

  const onSubmit = async (data: OfflineBookingFormData) => {
    if (!user || (!isVendor && !isAgent && !isAdmin)) {
      toast({
        title: "Access Denied",
        description:
          "Only vendors, agents, and admins can create offline bookings.",
        variant: "destructive",
      });
      return;
    }

    // Verify the experience exists (for vendors, it should belong to them; for agents, any active experience)
    const experience = experiences.find((e) => e.id === data.experience_id);
    if (!experience) {
      toast({
        title: "Invalid Experience",
        description: "Please select a valid experience.",
        variant: "destructive",
      });
      return;
    }

    // For vendors, verify the experience belongs to them
    if (isVendor && experience) {
      // Additional check can be done here if needed
      // The query already filters by vendor_id for vendors
    }

    setIsSubmitting(true);

    try {
      // Create offline booking
      // For offline bookings, user_id can be the vendor's/agent's/admin's ID since customer didn't book online
      const totalBookingAmount =
        (data.booking_amount_per_person || 0) * data.total_participants ||
        (selectedActivity?.price
          ? selectedActivity.price * data.total_participants
          : 0);
      const advanceAmount = data.advance_amount || 0;
      const dueAmount = Math.max(0, totalBookingAmount - advanceAmount);

      const bookingData = {
        user_id: user.id, // Vendor's/Agent's/Admin's user_id (customer didn't book online)
        experience_id: data.experience_id,
        activity_id: data.activity_id, // Direct activity reference for offline bookings
        booking_date: selectedDate?.toISOString() || new Date().toISOString(),
        total_participants: data.total_participants,
        contact_person_name: data.contact_person_name,
        isAgentBooking: isAgent ? true : false,
        contact_person_number: data.contact_person_number,
        contact_person_email: data.contact_person_email || null,
        booking_amount: totalBookingAmount,
        due_amount: dueAmount, // Calculate: (price per person * participants) - advance amount
        status: "confirmed",
        terms_accepted: true,
        b2bPrice: selectedActivity?.b2bPrice || 0,
        note_for_guide: data.note_for_guide || null,
        booked_by: user.id, // Vendor/Agent/Admin who created the booking
        type: "offline" as const,
        time_slot_id: selectedSlotId || null, // Optional time slot for offline bookings
        admin_note: isAdmin ? "admin booking" : null, // Set default admin note for admin bookings
      };

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) {
        console.error("Booking creation error:", bookingError);
        throw bookingError;
      }

      // Create participant records
      const participantsData = Array.from(
        { length: data.total_participants },
        () => ({
          booking_id: booking.id,
          name: data.contact_person_name,
          email: data.contact_person_email,
          phone_number: data.contact_person_number,
        })
      );

      const { error: participantsError } = await supabase
        .from("booking_participants")
        .insert(participantsData);

      if (participantsError) {
        console.error("Participants creation error:", participantsError);
        throw participantsError;
      }

      // Send all confirmations synchronously before closing
      // Keep isSubmitting true to show processing modal
      try {
        await sendBookingConfirmation(
          data,
          booking.id,
          experience,
          selectedActivity
        );
      } catch (confirmationError) {
        // Log errors but don't fail the booking
        console.error("Confirmation sending error:", confirmationError);
        // Show warning toast but don't block
        toast({
          title: "Booking Created",
          description:
            "Booking was created successfully, but some notifications may have failed. Please check the booking details.",
          variant: "default",
        });
      }

      // Show success toast
      toast({
        title: "Offline Booking Created!",
        description:
          "The offline booking has been successfully created and all notifications have been sent.",
      });

      // Close dialog and refresh after all confirmations are sent
      onBookingSuccess();
      handleClose();
    } catch (error: any) {
      console.error("Offline booking creation error:", error);
      toast({
        title: "Booking Failed",
        description:
          error.message ||
          "There was an error creating the offline booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isSubmitting &&
        createPortal(
          <div className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="bg-white dark:bg-slate-950 p-6 rounded-lg shadow-xl flex flex-col items-center gap-4 max-w-[300px] text-center animate-in fade-in zoom-in duration-300">
              <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
              <div>
                <h3 className="font-semibold text-lg mb-1">Processing...</h3>
                <p className="text-sm text-muted-foreground">
                  Please do not close or refresh this window.
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="offline-booking-dialog">
          <div className="offline-booking-header">
            <h2 className="offline-booking-title">Create Offline Booking</h2>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="offline-booking-form"
            >
              {/* Experience & Activity Selection Group */}
              <div className="form-section-group">
                <FormField
                  control={form.control}
                  name="experience_id"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("activity_id", "");
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="form-input-trigger">
                            <SelectValue placeholder="Select Experience *" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {experiences.map((exp) => (
                            <SelectItem key={exp.id} value={exp.id}>
                              {exp.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="activity_id"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedExperienceId}
                      >
                        <FormControl>
                          <SelectTrigger className="form-input-trigger">
                            <SelectValue placeholder="Select Activity *" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activities.map((activity) => (
                            <SelectItem key={activity.id} value={activity.id}>
                              {activity.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="booking_date"
                  render={({ field }) => (
                    <FormItem className="form-full-width">
                      <FormControl>
                        <div className="relative">
                          <DatePicker
                            className="form-date-picker"
                            value={selectedDate ? dayjs(selectedDate) : null}
                            onChange={(date) => {
                              const d = date ? date.toDate() : undefined;
                              setSelectedDate(d);
                              setSelectedSlotId(undefined);
                              form.setValue("time_slot_id", "");
                              field.onChange(d);
                            }}
                            disabledDate={(current) => {
                              // Admins can create backdated bookings, other roles cannot
                              if (isAdmin) {
                                return false; // No date restrictions for admins
                              }
                              // For vendors and agents, prevent selecting past dates
                              return (
                                current && current < dayjs().startOf("day")
                              );
                            }}
                            placeholder="Select Date *"
                            format="YYYY-MM-DD"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Time Slot Selection */}
              {selectedDate && selectedActivity && timeSlots.length > 0 && (
                <FormField
                  control={form.control}
                  name="time_slot_id"
                  render={({ field }) => (
                    <FormItem>
                      <div className="time-slots-header">
                        <span className="time-slots-label">
                          Available Time Slots
                        </span>
                        <span className="selected-date-badge">
                          {format(selectedDate, "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="time-slots-grid">
                        {timeSlots.map((slot: any) => {
                          const isSelected = selectedSlotId === slot.id;
                          const isAvailable =
                            slot.available_spots >= participantCount;

                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => {
                                if (isAvailable) {
                                  const newSlotId = isSelected
                                    ? undefined
                                    : slot.id;
                                  setSelectedSlotId(newSlotId);
                                  field.onChange(newSlotId || "");
                                }
                              }}
                              disabled={!isAvailable}
                              className={`p-3 rounded-lg border-2 text-left transition-all ${
                                isSelected
                                  ? "border-brand-primary bg-brand-primary/10"
                                  : isAvailable
                                  ? "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                  : "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
                              }`}
                            >
                              <div className="time-slot-content">
                                <Clock className="time-slot-icon" />
                                <span className="time-slot-time">
                                  {formatTime(slot.start_time)}
                                </span>
                              </div>
                              {/* <span className="time-slot-spots">
                              {slot.available_spots} spots left
                            </span> */}
                            </button>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Contact Details Section */}
              <div className="contact-details-container">
                <span className="contact-details-title">
                  Customer Information
                </span>
                <div className="contact-fields-grid">
                  <FormField
                    control={form.control}
                    name="contact_person_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Full Name *"
                            className="form-input"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact_person_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Phone Number *"
                            className="form-input"
                            {...field}
                            maxLength={10}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact_person_email"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Email Address"
                            className="form-input"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Booking Details & Summary */}
              <div className="booking-info-layout">
                <div className="booking-fields-stack">
                  <div className="MobileFlexOnly">
                    <div className="GridSetPCMobileAdjust">
                      <FormField
                        control={form.control}
                        name="total_participants"
                        render={({ field }) => (
                          <FormItem>
                            <label className="field-label-compact">
                              Participants
                            </label>
                            <div className="participants-control">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="participant-btn"
                                onClick={() =>
                                  field.onChange(Math.max(1, field.value - 1))
                                }
                                disabled={field.value <= 1}
                              >
                                <Minus className="participant-icon" />
                              </Button>
                              <span className="participant-count">
                                {field.value}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="participant-btn"
                                onClick={() =>
                                  field.onChange(Math.min(50, field.value + 1))
                                }
                                disabled={field.value >= 50}
                              >
                                <Plus className="participant-icon" />
                              </Button>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="booking_amount_per_person"
                        render={({ field }) => (
                          <FormItem>
                            <label className="field-label-compact">
                              Amount Per Person
                            </label>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                                  {selectedActivity?.currency || "INR"}
                                </span>
                                <Input
                                  type="number"
                                  className="pl-12 h-11"
                                  placeholder="0.00"
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="FlexOnly">
                    <FormField
                      control={form.control}
                      name="advance_amount"
                      render={({ field }) => (
                        <FormItem>
                          <label className="field-label-compact">
                            Advance Amount
                          </label>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                                {selectedActivity?.currency || "INR"}
                              </span>
                              <Input
                                type="number"
                                className="pl-12 h-11"
                                placeholder="0.00"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="note_for_guide"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Note for Guide (Optional)"
                              className="form-input"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Summary Card */}
                {selectedActivity && (
                  <div className="summary-card">
                    <div className="summary-content">
                      <h4 className="summary-title">Booking Summary</h4>
                      <div className="space-y-3">
                        <div className="summary-row">
                          <span className="summary-label">Activity</span>
                          <span className="summary-value text-right-truncate">
                            {selectedActivity.name}
                          </span>
                        </div>
                        <div className="summary-row">
                          <span className="summary-label">Participants</span>
                          <span className="summary-value">
                            {participantCount}
                          </span>
                        </div>
                        <div className="summary-row">
                          <span className="summary-label">
                            Price per person
                          </span>
                          <span className="summary-value">
                            {selectedActivity.currency}{" "}
                            {(
                              form.watch("booking_amount_per_person") || 0
                            ).toLocaleString()}
                          </span>
                        </div>
                        {isAgent && selectedActivity.b2bPrice && (
                          <>
                            {!showB2BPrice ? (
                              <div className="summary-row">
                                <span className="summary-label">B2B Price</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="b2b-view-btn"
                                  onClick={() => setShowB2BPrice(true)}
                                >
                                  View B2B Price
                                </Button>
                              </div>
                            ) : (
                              <div className="summary-row">
                                <span className="summary-label">B2B Price</span>
                                <div className="flex items-center gap-2">
                                  <span className="summary-value">
                                    {selectedActivity.currency}{" "}
                                    {selectedActivity.b2bPrice.toLocaleString()}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                    onClick={() => setShowB2BPrice(false)}
                                  >
                                    Hide
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        <div className="summary-row">
                          <span className="summary-label">Total Amount</span>
                          <span className="summary-value">
                            {selectedActivity.currency}{" "}
                            {(
                              (form.watch("booking_amount_per_person") || 0) *
                              participantCount
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="summary-row">
                          <span className="summary-label">Advance Amount</span>
                          <span className="summary-value">
                            {selectedActivity.currency}{" "}
                            {(form.watch("advance_amount") || 0).toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </span>
                        </div>
                        <div className="summary-total">
                          <span className="total-label">Due Amount</span>
                          <span className="total-value">
                            {selectedActivity.currency}{" "}
                            {Math.max(
                              0,
                              (form.watch("booking_amount_per_person") || 0) *
                                participantCount -
                                (form.watch("advance_amount") || 0)
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="action-footer">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="btn-secondary-custom"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  // disabled={isSubmitting}
                  className="btn-primary-custom"
                >
                  {isSubmitting ? "Creating..." : "Create Booking"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};
