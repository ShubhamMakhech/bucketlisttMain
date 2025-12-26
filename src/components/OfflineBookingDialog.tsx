import { useState, useEffect } from "react";
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
import { Minus, Plus, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { SendWhatsappMessage } from "@/utils/whatsappUtil";
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
  const { isVendor } = useUserRole();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlotId, setSelectedSlotId] = useState<string | undefined>(
    undefined
  );

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
      note_for_guide: "",
    },
  });

  // Fetch vendor's experiences
  const { data: experiences = [] } = useQuery({
    queryKey: ["vendor-experiences", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("experiences")
        .select("id, title, currency")
        .eq("vendor_id", user.id)
        .eq("is_active", true)
        .order("title", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && isVendor,
  });

  const selectedExperienceId = form.watch("experience_id");

  // Fetch activities for selected experience
  const { data: activities = [] } = useQuery({
    queryKey: ["experience-activities", selectedExperienceId],
    queryFn: async () => {
      if (!selectedExperienceId) return [];

      const { data, error } = await supabase
        .from("activities")
        .select("id, name, price, currency")
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
    }
  }, [isOpen, form]);

  // Validate vendor access
  useEffect(() => {
    if (!isVendor && user) {
      //   console.log("isVendor", isVendor, user);
      //   toast({
      //     title: "Access Denied",
      //     description: "Only vendors can create offline bookings.",
      //     variant: "destructive",
      //   });
      onClose();
    }
  }, [isVendor, user, toast, onClose]);

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
      // Get vendor profile
      const { data: vendor, error: vendorError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (vendorError) {
        console.error("Error fetching vendor profile:", vendorError);
      }

      // Get experience details with location
      const { data: experienceDetails } = await supabase
        .from("experiences")
        .select("title, location, location2, currency")
        .eq("id", data.experience_id)
        .single();

      const bookingAmount =
        (data.booking_amount_per_person || 0) * data.total_participants ||
        (activity?.price ? activity.price * data.total_participants : 0);
      const bookingDate = selectedDate || new Date();
      const formattedDate = moment(bookingDate).format("DD/MM/YYYY");

      // Get time slot details if selected
      let timeSlotText = "Offline Booking";
      let formattedDateTime = `${formattedDate} - Offline Booking`;
      if (selectedSlotId) {
        const selectedSlot = timeSlots.find(
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

      // Customer WhatsApp message
      let customerWhatsappBody = {};
      if (
        experienceDetails?.location !== null &&
        experienceDetails?.location2 !== null
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
                  to: [
                    data.contact_person_number.toString().length !== 10
                      ? data.contact_person_number
                      : "+91" + data.contact_person_number.toString(),
                  ],
                  components: {
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
                      value: timeSlotText,
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
                      value: bookingAmount.toFixed(2).toString(),
                    },
                    body_8: {
                      type: "text",
                      value: "0",
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
              name: "booking_confirmation_user_v2",
              language: {
                code: "en",
                policy: "deterministic",
              },
              namespace: "ca756b77_f751_41b3_adb9_96ed99519854",
              to_and_components: [
                {
                  to: [
                    data.contact_person_number.toString().length !== 10
                      ? data.contact_person_number
                      : "+91" + data.contact_person_number.toString(),
                  ],
                  components: {
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
                      value: timeSlotText,
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
                      value: bookingAmount.toFixed(2).toString(),
                    },
                    body_7: {
                      type: "text",
                      value: "0",
                    },
                  },
                },
              ],
            },
          },
        };
      }

      // Send customer WhatsApp
      await SendWhatsappMessage(customerWhatsappBody);

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
                    value: "0",
                  },
                  body_8: {
                    type: "text",
                    value: bookingAmount.toFixed(2).toString(),
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
                    value: "0",
                  },
                  body_8: {
                    type: "text",
                    value: bookingAmount.toFixed(2).toString(),
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
                upfrontAmount: bookingAmount,
                dueAmount: "0",
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
    if (!user || !isVendor) {
      toast({
        title: "Access Denied",
        description: "Only vendors can create offline bookings.",
        variant: "destructive",
      });
      return;
    }

    // Verify the experience belongs to the vendor
    const experience = experiences.find((e) => e.id === data.experience_id);
    if (!experience) {
      toast({
        title: "Invalid Experience",
        description: "Please select a valid experience.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create offline booking
      // For offline bookings, user_id can be the vendor's ID since customer didn't book online
      const bookingData = {
        user_id: user.id, // Vendor's user_id (customer didn't book online)
        experience_id: data.experience_id,
        activity_id: data.activity_id, // Direct activity reference for offline bookings
        booking_date: selectedDate?.toISOString() || new Date().toISOString(),
        total_participants: data.total_participants,
        contact_person_name: data.contact_person_name,
        contact_person_number: data.contact_person_number,
        contact_person_email: data.contact_person_email || null,
        booking_amount:
          (data.booking_amount_per_person || 0) * data.total_participants ||
          (selectedActivity?.price
            ? selectedActivity.price * data.total_participants
            : 0),
        due_amount: 0, // No payment needed for offline bookings
        status: "confirmed",
        terms_accepted: true,
        note_for_guide: data.note_for_guide || null,
        booked_by: user.id, // Vendor who created the booking
        type: "offline" as const,
        time_slot_id: selectedSlotId || null, // Optional time slot for offline bookings
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

      // Send WhatsApp messages and email
      await sendBookingConfirmation(
        data,
        booking.id,
        experience,
        selectedActivity
      );

      toast({
        title: "Offline Booking Created!",
        description:
          "The offline booking has been successfully created. Notifications have been sent.",
      });

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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-brand-primary">
            Create Offline Booking
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Experience Selection */}
            <FormField
              control={form.control}
              name="experience_id"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("activity_id", ""); // Reset activity when experience changes
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Experience *" />
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

            {/* Activity Selection */}
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
                      <SelectTrigger>
                        <SelectValue placeholder="Activity *" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activities.map((activity) => (
                        <SelectItem key={activity.id} value={activity.id}>
                          {activity.name}{" "}
                          {/*- {activity.currency} {activity.price} */}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Booking Date */}
            <FormField
              control={form.control}
              name="booking_date"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="date"
                      placeholder="Booking Date *"
                      value={
                        selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
                      }
                      onChange={(e) => {
                        const date = e.target.value
                          ? new Date(e.target.value)
                          : undefined;
                        setSelectedDate(date);
                        setSelectedSlotId(undefined); // Reset slot when date changes
                        form.setValue("time_slot_id", "");
                        field.onChange(date);
                      }}
                      min={format(new Date(), "yyyy-MM-dd")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Slot Selection */}
            {selectedDate && selectedActivity && timeSlots.length > 0 && (
              <FormField
                control={form.control}
                name="time_slot_id"
                render={({ field }) => (
                  <FormItem>
                    <div className="text-sm text-muted-foreground mb-2">
                      Time Slot (Optional) -{" "}
                      {format(selectedDate, "MMM d, yyyy")}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <div>
                                <div className="font-semibold text-sm">
                                  {formatTime(slot.start_time)} -{" "}
                                  {formatTime(slot.end_time)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {slot.available_spots} spots available
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {timeSlots.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No time slots available for this date
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedDate && selectedActivity && timeSlots.length === 0 && (
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-sm text-muted-foreground">
                  No time slots available for {selectedActivity.name} on{" "}
                  {format(selectedDate, "MMM d, yyyy")}. You can still create
                  the booking without a time slot.
                </p>
              </div>
            )}

            {/* Primary Contact Details */}
            <Card id="primary-contact-details-card">
              <CardContent className="px-3 py-3">
                <h4 className="font-medium mb-1">Primary Contact Details</h4>
                <div className="grid grid-cols-1 gap-2">
                  <FormField
                    control={form.control}
                    name="contact_person_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Full name *"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              // Trigger validation if field becomes empty
                              if (!e.target.value.trim()) {
                                form.trigger("contact_person_name");
                              }
                            }}
                            onBlur={(e) => {
                              field.onBlur();
                              // Trigger validation on blur
                              form.trigger("contact_person_name");
                            }}
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
                            placeholder="Phone number *"
                            {...field}
                            onChange={(e) => {
                              // Remove all non-numeric characters and spaces
                              const value = e.target.value.replace(
                                /[^0-9]/g,
                                ""
                              );
                              field.onChange(value);
                            }}
                            onBlur={(e) => {
                              // Trigger validation on blur
                              field.onBlur();
                              form.trigger("contact_person_number");
                            }}
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
                      <FormItem>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Email"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.trim();
                              field.onChange(value);
                            }}
                            onBlur={(e) => {
                              // Trigger validation on blur
                              field.onBlur();
                              form.trigger("contact_person_email");
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Number of Participants */}
            <FormField
              control={form.control}
              name="total_participants"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => {
                        if (field.value > 1) {
                          field.onChange(field.value - 1);
                        }
                      }}
                      disabled={field.value <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        value={field.value}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          field.onChange(Math.min(Math.max(value, 1), 50));
                        }}
                        className="text-center font-medium w-20"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => {
                        if (field.value < 50) {
                          field.onChange(field.value + 1);
                        }
                      }}
                      disabled={field.value >= 50}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Booking Amount Per Person */}
            <FormField
              control={form.control}
              name="booking_amount_per_person"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Amount Per Person"
                      value={field.value || ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Total: {selectedActivity?.currency || "INR"}{" "}
                    {((field.value || 0) * participantCount).toFixed(2)}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Note for Guide */}
            <FormField
              control={form.control}
              name="note_for_guide"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Note for Guide (Optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Summary Card */}
            {selectedActivity && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Activity:</span>
                      <span className="font-medium">
                        {selectedActivity.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Participants:
                      </span>
                      <span className="font-medium">{participantCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Price per person:
                      </span>
                      <span className="font-medium">
                        {selectedActivity.currency}{" "}
                        {form.watch("booking_amount_per_person") ||
                          selectedActivity.price}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total Amount:</span>
                      <span>
                        {selectedActivity.currency}{" "}
                        {(() => {
                          const perPersonAmount =
                            form.watch("booking_amount_per_person") ||
                            selectedActivity.price;
                          return (perPersonAmount * participantCount).toFixed(
                            2
                          );
                        })()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-brand-primary hover:bg-brand-primary/90"
              >
                {isSubmitting ? "Creating..." : "Create Offline Booking"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
