import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  X,
  Tag,
  CheckCircle,
  AlertCircle,
  Minus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SlotSelector } from "@/components/SlotSelector";
import { useNavigate } from "react-router-dom";
import { useRazorpay } from "@/hooks/useRazorpay";
import { SendWhatsappMessage } from "@/utils/whatsappUtil";
import moment from "moment";
import { useQuery } from "@tanstack/react-query";
import { Modal, Select as AntSelect } from "antd";
import { format } from "date-fns";
import { useDiscountCoupon } from "@/hooks/useDiscountCoupon";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthModal } from "@/components/AuthModal";
import { useUserRole } from "@/hooks/useUserRole";
const participantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .refine((val) => {
      // Additional email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(val);
    }, "Please enter a valid email address")
    .refine((val) => {
      // Check for common email mistakes
      if (val.includes("..")) return false;
      if (val.startsWith(".") || val.endsWith(".")) return false;
      if (val.includes("@.") || val.includes(".@")) return false;
      return true;
    }, "Please enter a valid email address"),
  phone_number: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[0-9]+$/, "Phone number must contain only numbers")
    .length(10, "Phone number must be exactly 10 digits")
    .refine((val) => !val.includes(" "), "Phone number cannot contain spaces"),
});

const bookingSchema = z.object({
  participant: participantSchema,
  participant_count: z
    .number()
    .min(1, "At least one participant is required")
    .max(50, "Maximum 50 participants allowed"),
  note_for_guide: z.string().optional(),
  terms_accepted: z
    .boolean()
    .refine((val) => val === true, "You must accept the terms and conditions"),
  booking_date: z.date({ required_error: "Please select a date" }),
  time_slot_id: z.string().min(1, "Please select a time slot"),
  referral_code: z.string().optional(),
  coupon_code: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  experience: {
    id: string;
    title: string;
    price: number;
    currency: string;
    image_url?: string;
  };
  onBookingSuccess: () => void;
  appliedCoupon?: {
    coupon: {
      coupon_code: string;
      type: string;
      discount_value: number;
    };
    discount_calculation: {
      original_amount: number;
      discount_amount: number;
      final_amount: number;
      savings_percentage: number;
    };
  } | null;
  setIsBookingDialogOpen: (isOpen: boolean) => void;
}

export const BookingDialog = ({
  isOpen,
  onClose,
  experience,
  onBookingSuccess,
  appliedCoupon,
  setIsBookingDialogOpen,
}: BookingDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlotId, setSelectedSlotId] = useState<string | undefined>(
    undefined
  );
  const [bypassPayment, setBypassPayment] = useState(false);
  const [partialPayment, setPartialPayment] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string>();
  const [currentStep, setCurrentStep] = useState(1); // 1: Activity Selection, 2: Date/Time Selection, 3: Participants (mobile only)
  const [couponCode, setCouponCode] = useState("");
  const [couponValidation, setCouponValidation] = useState<{
    isValid: boolean;
    message: string;
    coupon?: any;
  } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { openRazorpay } = useRazorpay();
  const { validateCoupon } = useDiscountCoupon();
  const isMobile = useIsMobile();
  const { isAgent } = useUserRole();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [b2bPrice, setB2bPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [advancePayment, setAdvancePayment] = useState<number>(0);
  const [isReferralCodeExpanded, setIsReferralCodeExpanded] = useState(false);
  const [isCouponCodeExpanded, setIsCouponCodeExpanded] = useState(false);
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      participant: { name: "", email: "", phone_number: "" },
      participant_count: 1,
      note_for_guide: "",
      terms_accepted: false,
      referral_code: "",
      coupon_code: "",
    },
  });
  useEffect(() => {
    const bookingModalData = localStorage.getItem("bookingModalData");
    if (bookingModalData) {
      const data = JSON.parse(bookingModalData);

      // Set form values individually
      form.setValue("participant.name", data.data.participant.name);
      form.setValue("participant.email", data.data.participant.email);
      form.setValue(
        "participant.phone_number",
        data.data.participant.phone_number
      );
      form.setValue("participant_count", data.data.participant_count);
      form.setValue("note_for_guide", data.data.note_for_guide || "");
      form.setValue("terms_accepted", data.data.terms_accepted);
      form.setValue("referral_code", data.data.referral_code || "");
      form.setValue("coupon_code", data.data.coupon_code || "");
      form.setValue("booking_date", new Date(data.selectedDate));
      form.setValue("time_slot_id", data.selectedSlotId);

      // Set other state values
      setSelectedDate(new Date(data.selectedDate));
      setSelectedSlotId(data.selectedSlotId);
      setSelectedActivityId(data.selectedActivityId);
      setCurrentStep(3);

      // Clear localStorage
      localStorage.removeItem("bookingModalData");
      setIsBookingDialogOpen(true);
    }
  }, [form]);

  // useEffect(() => {
  //   const bookingModalData = localStorage.getItem('bookingModalData');
  //   if (bookingModalData) {
  //     const data = JSON.parse(bookingModalData);
  //     form.reset(data.data);

  //     console.log("data", data);
  //     console.log("data.data", data.selectedDate);

  //     // set selected date from local storagedata
  //     setSelectedDate(new Date(data.selectedDate));
  //     setSelectedSlotId(data.selectedSlotId);
  //     setSelectedActivityId(data.selectedActivityId);

  //     setCurrentStep(3)
  //   }
  // }, []);

  const participantCount = form.watch("participant_count");

  // Helper function to get activity price (discounted if available)
  const getActivityPrice = (activity: any) => {
    return activity?.discounted_price || activity?.price;
  };

  // Calculate base price - will be updated when selectedActivity is available
  const basePrice = experience.price * participantCount;

  // Calculate final price with coupon discount
  const calculateFinalPrice = () => {
    // For agents, use selling price * participant count
    if (isAgent && sellingPrice > 0) {
      return parseFloat((sellingPrice * participantCount).toFixed(2));
    }

    // Use local coupon validation result if available, otherwise use appliedCoupon from props
    const activeCoupon =
      couponValidation?.isValid && couponValidation.coupon
        ? couponValidation.coupon
        : appliedCoupon;

    if (activeCoupon && activeCoupon.discount_calculation) {
      // The discount_calculation.final_amount is per person, so multiply by participant count
      return parseFloat(
        (
          activeCoupon.discount_calculation.final_amount * participantCount
        ).toFixed(2)
      );
    }
    // Use selected activity price (discounted if available), otherwise use experience price
    const currentPrice = selectedActivity
      ? getActivityPrice(selectedActivity)
      : experience.price;
    return parseFloat((currentPrice * participantCount).toFixed(2));
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlotId(undefined);
    form.setValue("booking_date", date as Date);
    form.setValue("time_slot_id", "");
  };

  const handleSlotChange = (slotId: string | undefined) => {
    setSelectedSlotId(slotId);
    form.setValue("time_slot_id", slotId || "");
  };

  // Step navigation functions
  const handleNextStep = () => {
    if (isMobile) {
      // Mobile: 3-step process
      if (currentStep === 1) {
        // Step 1 -> Step 2: Check if activity is selected
        if (selectedActivityId) {
          setCurrentStep(2);
        } else {
          toast({
            title: "Missing information",
            description: "Please select an activity",
            variant: "destructive",
          });
        }
      } else if (currentStep === 2) {
        // Step 2 -> Step 3: Check if date and time slot are selected
        if (selectedDate && selectedSlotId) {
          setCurrentStep(3);
        } else {
          toast({
            title: "Missing information",
            description: "Please select date and time slot",
            variant: "destructive",
          });
        }
      }
    } else {
      // Desktop: 2-step process (original logic)
      if (selectedActivityId && selectedDate && selectedSlotId) {
        setCurrentStep(2);
      } else {
        toast({
          title: "Missing information",
          description: "Please select activity, date, and time slot",
          variant: "destructive",
        });
      }
    }
  };

  const handlePrevStep = () => {
    if (isMobile) {
      // Mobile: 3-step process
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
      }
    } else {
      // Desktop: 2-step process
      setCurrentStep(1);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    form.reset();
    setSelectedDate(undefined);
    setSelectedSlotId(undefined);
    setSelectedActivityId(undefined);
    setBypassPayment(false);
    setIsSubmitting(false);
    setB2bPrice(0);
    setSellingPrice(0);
    setAdvancePayment(0);
    localStorage.removeItem("bookingModalData");
    onClose();
  };

  const handleCouponValidation = async () => {
    if (!couponCode.trim()) {
      setCouponValidation({
        isValid: false,
        message: "Please enter a coupon code",
      });
      return;
    }

    try {
      const result = await validateCoupon(
        couponCode,
        experience.id,
        selectedActivity ? getActivityPrice(selectedActivity) : experience.price
      );

      if (result.valid && result.discount_calculation) {
        const discountType =
          result.coupon?.type === "percentage" ? "%" : "flat amount";
        const discountText =
          result.coupon?.type === "percentage"
            ? `${result.discount_calculation.savings_percentage.toFixed(1)}%`
            : `${selectedActivity?.currency || experience.currency} ${
                result.discount_calculation.discount_amount
              }`;

        setCouponValidation({
          isValid: true,
          message: `Coupon applied! You save ${discountText}`,
          coupon: result,
        });
        form.setValue("coupon_code", couponCode);
        toast({
          title: "Coupon Applied!",
          description: `You saved ${discountText} on your booking!`,
        });
      } else {
        // Show generic error message for all validation failures
        setCouponValidation({
          isValid: false,
          message: "Invalid coupon code",
        });
      }
    } catch (error) {
      console.error("Coupon validation error:", error);
      setCouponValidation({
        isValid: false,
        message: "Error validating coupon. Please try again.",
      });
    }
  };

  const handleCouponCodeChange = (value: string) => {
    setCouponCode(value.toUpperCase());
    // Clear validation when user types
    if (couponValidation) {
      setCouponValidation(null);
    }
  };

  const sendBookingConfirmationEmail = async (
    data: BookingFormData,
    bookingId: string,
    dueAmount?: string
  ) => {
    try {
      // console.log("Sending booking confirmation email...");
      // console.log("data",data)
      // Get time slot details for email
      const { data: timeSlot } = await supabase
        .from("time_slots")
        .select(
          "start_time, end_time,experiences(title,vendor_id,location,location2),activities(name)"
        )
        .eq("id", selectedSlotId)
        .single();
      const { data: vendor, error: vendorError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", timeSlot?.experiences?.vendor_id)
        .single();

      // console.log(vendor
      // console.log(data);
      // console.log(vendor);
      let whatsappBody = {};
      console.log(
        "timeSlot?.experiences?.location2",
        timeSlot?.experiences?.location2
      );
      if (
        timeSlot?.experiences?.location !== null &&
        timeSlot?.experiences?.location2 !== null
      ) {
        whatsappBody = {
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
                    data.participant.phone_number.toString().length !== 10
                      ? data.participant.phone_number
                      : "+91" + data.participant.phone_number.toString(),
                  ],
                  components: {
                    body_1: {
                      type: "text",
                      value: data.participant.name,
                    },
                    body_2: {
                      type: "text",
                      value: timeSlot?.activities.name || "",
                    },
                    body_3: {
                      type: "text",
                      value: `${moment(selectedDate).format(
                        "DD/MM/YYYY"
                      )} - ${moment(timeSlot?.start_time, "HH:mm").format(
                        "hh:mm A"
                      )} - ${moment(timeSlot?.end_time, "HH:mm").format(
                        "hh:mm A"
                      )}`,
                    },
                    body_4: {
                      type: "text",
                      value: timeSlot?.experiences?.location || "",
                    },
                    body_5: {
                      type: "text",
                      value: timeSlot?.experiences?.location2 || "",
                    },
                    body_6: {
                      type: "text",
                      value: data?.participant_count?.toString() || "0",
                    },
                    body_7: {
                      type: "text",
                      value: upfrontAmount.toFixed(2).toString(),
                    },
                    body_8: {
                      type: "text",
                      value: dueAmount || "0",
                    },
                  },
                },
              ],
            },
          },
        };
      } else {
        whatsappBody = {
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
                    data.participant.phone_number.toString().length !== 10
                      ? data.participant.phone_number
                      : "+91" + data.participant.phone_number.toString(),
                  ],
                  components: {
                    body_1: {
                      type: "text",
                      value: data.participant.name,
                    },
                    body_2: {
                      type: "text",
                      value: timeSlot?.activities.name || "",
                    },
                    body_3: {
                      type: "text",
                      value: `${moment(selectedDate).format(
                        "DD/MM/YYYY"
                      )} - ${moment(timeSlot?.start_time, "HH:mm").format(
                        "hh:mm A"
                      )} - ${moment(timeSlot?.end_time, "HH:mm").format(
                        "hh:mm A"
                      )}`,
                    },
                    body_4: {
                      type: "text",
                      value: timeSlot?.experiences?.location || "",
                    },
                    body_5: {
                      type: "text",
                      value: data?.participant_count?.toString() || "0",
                    },
                    body_6: {
                      type: "text",
                      value: upfrontAmount.toFixed(2).toString(),
                    },
                    body_7: {
                      type: "text",
                      value: dueAmount || "0",
                    },
                  },
                },
              ],
            },
          },
        };
      }

      // const whatsappBody = {
      //   version: "2.0",
      //   country_code: "91",
      //   wid: "15520",
      //   type: "text",
      //   data: [
      //     {
      //       mobile: data.participant.phone_number,
      //       bodyValues: {
      //         "1": data.participant.name,
      //         "2": experience.title,
      //         "3": `${moment(selectedDate).format("DD/MM/YYYY")} - ${moment(
      //           timeSlot?.start_time,
      //           "HH:mm"
      //         ).format("hh:mm A")} - ${moment(
      //           timeSlot?.end_time,
      //           "HH:mm"
      //         ).format("hh:mm A")}`,
      //         "4": "Experience Location",
      //       },
      //     },
      //   ],
      // };

      const whatsappResponse = await SendWhatsappMessage(whatsappBody);
      // console.log("whatsappResponse", whatsappResponse);
      const discountPrice =
        selectedActivity?.price * data.participant_count - finalPrice;
      const advancePlusDiscountPrice = upfrontAmount + discountPrice;
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
                  vendor?.phone_number.toString().length !== 10
                    ? vendor?.phone_number
                    : "+91" + vendor?.phone_number.toString(),
                ],
                components: {
                  body_1: {
                    type: "text",
                    value: data.participant.name,
                  },
                  body_2: {
                    type: "text",
                    value: data?.participant_count?.toString() || "0",
                  },
                  body_3: {
                    type: "text",
                    value: data.participant.phone_number,
                  },
                  body_4: {
                    type: "text",
                    value: experience.title,
                  },
                  body_5: {
                    type: "text",
                    value: timeSlot?.activities.name || "",
                  },
                  body_6: {
                    type: "text",
                    value: `${moment(selectedDate).format(
                      "DD/MM/YYYY"
                    )} - ${moment(timeSlot?.start_time, "HH:mm").format(
                      "hh:mm A"
                    )} - ${moment(timeSlot?.end_time, "HH:mm").format(
                      "hh:mm A"
                    )}`,
                  },
                  body_7: {
                    type: "text",
                    value: dueAmount || "0",
                  },
                  body_8: {
                    type: "text",
                    value:
                      advancePlusDiscountPrice.toFixed(2).toString() || "0",
                  },
                },
              },
            ],
          },
        },
      };
      //   bodyValues: {
      //         "1": data.participant.name,
      //         "2": data.participant.phone_number,
      //         "3": experience.title,
      //         "4": timeSlot?.activities.name,
      // "5": `${moment(selectedDate).format("DD/MM/YYYY")} - ${moment(
      //   timeSlot?.start_time,
      //   "HH:mm"
      // ).format("hh:mm A")} - ${moment(
      //   timeSlot?.end_time,
      //   "HH:mm"
      // ).format("hh:mm A")}`,
      //         "6": data?.participant_count?.toString() || "0",
      //         "7": dueAmount || "0",
      //       },
      // // console.log("vendorWhatsappBody", vendorWhatsappBody);
      const vendorWhatsappResponse = await SendWhatsappMessage(
        vendorWhatsappBody
      );
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
                    value: data.participant.name,
                  },
                  body_2: {
                    type: "text",
                    value: data?.participant_count?.toString() || "0",
                  },
                  body_3: {
                    type: "text",
                    value: data.participant.phone_number,
                  },
                  body_4: {
                    type: "text",
                    value: experience.title,
                  },
                  body_5: {
                    type: "text",
                    value: timeSlot?.activities.name || "",
                  },
                  body_6: {
                    type: "text",
                    value: `${moment(selectedDate).format(
                      "DD/MM/YYYY"
                    )} - ${moment(timeSlot?.start_time, "HH:mm").format(
                      "hh:mm A"
                    )} - ${moment(timeSlot?.end_time, "HH:mm").format(
                      "hh:mm A"
                    )}`,
                  },
                  body_7: {
                    type: "text",
                    value: dueAmount || "0",
                  },
                  body_8: {
                    type: "text",
                    value:
                      advancePlusDiscountPrice.toFixed(2).toString() || "0",
                  },
                },
              },
            ],
          },
        },
      };
      const adminWhatsappResponse = await SendWhatsappMessage(
        adminWhatsappBody
      );
      // console.log("vendorWhatsappResponse", vendorWhatsappResponse);
      // console.log(whatsappResponse);

      // console.log(experience);
      // console.log(data)

      const emailResponse = await supabase.functions.invoke(
        "send-booking-confirmation",
        {
          body: {
            customerEmail: data.participant.email,
            customerName: data.participant.name,
            experienceTitle: experience.title,
            bookingDate: selectedDate?.toISOString(),
            timeSlot: timeSlot
              ? `${timeSlot.start_time} - ${timeSlot.end_time}`
              : "Time slot details unavailable",
            totalParticipants: data.participant_count,
            totalAmount: finalPrice,
            upfrontAmount: upfrontAmount,
            dueAmount: dueAmount,
            partialPayment: partialPayment,
            currency: selectedActivity?.currency || experience.currency,
            participants: Array.from(
              { length: data.participant_count },
              () => data.participant
            ),
            bookingId: bookingId,
            noteForGuide: data.note_for_guide,
            paymentId: "",
          },
        }
      );

      if (emailResponse.error) {
        console.error("Email sending error:", emailResponse.error);
        throw emailResponse.error;
      } else {
        // console.log("Email sent successfully:", emailResponse.data);
      }
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't throw the error to prevent booking failure
      toast({
        title: "Booking confirmed",
        description:
          "Your booking was successful, but we couldn't send the confirmation email. Please check your booking in your profile.",
        variant: "default",
      });
    }
  };

  const createDirectBooking = async (data: BookingFormData) => {
    if (!user || !selectedDate || !selectedSlotId) return;

    try {
      // console.log("Creating direct booking (bypassing payment)...");

      // Calculate the correct booking amount (total amount after discounts, not partial payment amount)
      // For agents, use selling price * participant count
      const calculatedBookingAmount = isAgent
        ? parseFloat((sellingPrice * data.participant_count).toFixed(2))
        : parseFloat(finalPrice.toFixed(2));

      // For agents with advance payment, due amount = booking amount - advance payment
      const finalDueAmount =
        isAgent && advancePayment > 0
          ? parseFloat((calculatedBookingAmount - advancePayment).toFixed(2))
          : partialPayment
          ? dueAmount
          : 0;

      // console.log("Direct booking amount calculation:", {
      // selectedActivity,
      // activityPrice: selectedActivity
      //   ? getActivityPrice(selectedActivity)
      //   : null,
      // experiencePrice: experience.price,
      // participantCount: data.participant_count,
      // calculatedBookingAmount,
      // finalPrice,
      // });

      let agent = null;
      if (isAgent) {
        const { data: agentData, error: agentError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (agentError) {
          console.error("Error fetching agent data:", agentError);
        }
        console.log("agentData", agentData);
        agent = agentData;
      }
      // Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          experience_id: experience.id,
          time_slot_id: selectedSlotId,
          booking_date: selectedDate.toISOString(),
          note_for_guide: data.note_for_guide || null,
          total_participants: data.participant_count,
          terms_accepted: data.terms_accepted,
          referral_code: isAgent
            ? agent?.first_name + " " + agent?.last_name
            : data?.referral_code,
          due_amount: finalDueAmount,
          booking_amount: calculatedBookingAmount,
          b2bPrice: b2bPrice !== 0 ? b2bPrice : selectedActivity?.b2bPrice || 0,
          contact_person_name: data.participant.name,
          contact_person_number: data.participant.phone_number,
          contact_person_email: data.participant.email,
          isAgentBooking: isAgent ? true : false,
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Booking creation error:", bookingError);
        throw bookingError;
      }

      // console.log("Booking created successfully:", booking.id);

      // Create participants - duplicate the primary participant data for each participant
      const participantsData = Array.from(
        { length: data.participant_count },
        () => ({
          booking_id: booking.id,
          name: data.participant.name,
          email: data.participant.email,
          phone_number: data.participant.phone_number,
        })
      );

      const { error: participantsError } = await supabase
        .from("booking_participants")
        .insert(participantsData);

      if (participantsError) {
        console.error("Participants creation error:", participantsError);
        throw participantsError;
      }
      // Check if the user is not a vendor, then update their profile with the phone number if needed
      const { data: userRole, error: userRoleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (userRoleError) {
        console.error("Error fetching user role:", userRoleError);
      } else if (userRole?.role !== "vendor") {
        const { data: userData, error: userDataError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (userDataError) {
          console.error("Error fetching user profile:", userDataError);
        } else if (
          !userData?.phone_number ||
          userData?.phone_number.trim() === ""
        ) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              phone_number: data.participant.phone_number,
            })
            .eq("id", user.id);

          if (updateError) {
            console.error("Error updating user phone number:", updateError);
          }
        }
      }
      // console.log("Participants created successfully");

      // Send confirmation email
      const emailDueAmount =
        isAgent && advancePayment > 0
          ? (calculatedBookingAmount - advancePayment).toFixed(2)
          : partialPayment
          ? dueAmount.toString()
          : "0";

      await sendBookingConfirmationEmail(data, booking.id, emailDueAmount);

      toast({
        title: "Booking confirmed!",
        description: "Your booking has been confirmed.",
      });

      onBookingSuccess();
      handleClose();
    } catch (error) {
      console.error("Direct booking creation error:", error);
      setIsSubmitting(false);
      toast({
        title: "Booking failed",
        description:
          "There was an error creating your booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const createBookingAfterPayment = async (
    data: BookingFormData,
    paymentId: string
  ) => {
    if (!user || !selectedDate || !selectedSlotId) return;

    try {
      // console.log("Creating booking after successful payment...");

      // Calculate the correct booking amount (total amount after discounts, not partial payment amount)
      // For agents, use selling price * participant count
      const calculatedBookingAmount = isAgent
        ? parseFloat((sellingPrice * data.participant_count).toFixed(2))
        : parseFloat(finalPrice.toFixed(2));

      // For agents with advance payment, due amount = booking amount - advance payment
      const finalDueAmount =
        isAgent && advancePayment > 0
          ? parseFloat((calculatedBookingAmount - advancePayment).toFixed(2))
          : partialPayment
          ? dueAmount
          : 0;

      // console.log("Payment booking amount calculation:", {
      // selectedActivity,
      // activityPrice: selectedActivity
      //   ? getActivityPrice(selectedActivity)
      //   : null,
      // experiencePrice: experience.price,
      // participantCount: data.participant_count,
      // calculatedBookingAmount,
      // finalPrice,
      // });

      // Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          experience_id: experience.id,
          time_slot_id: selectedSlotId,
          booking_date: selectedDate.toISOString(),
          note_for_guide: data.note_for_guide || null,
          total_participants: data.participant_count,
          terms_accepted: data.terms_accepted,
          referral_code: data?.referral_code,
          due_amount: finalDueAmount,
          booking_amount: calculatedBookingAmount,
          b2bPrice: b2bPrice !== 0 ? b2bPrice : selectedActivity?.b2bPrice || 0,
          contact_person_name: data.participant.name,
          contact_person_number: data.participant.phone_number,
          isAgentBooking: isAgent ? true : false,
          contact_person_email: data.participant.email,
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Booking creation error:", bookingError);
        throw bookingError;
      }
      const { data: userRole, error: userRoleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (userRoleError) {
        console.error("Error fetching user role:", userRoleError);
      } else if (userRole?.role !== "vendor") {
        const { data: userData, error: userDataError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (userDataError) {
          console.error("Error fetching user profile:", userDataError);
        } else if (
          !userData?.phone_number ||
          userData?.phone_number.trim() === ""
        ) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              phone_number: data.participant.phone_number,
            })
            .eq("id", user.id);

          if (updateError) {
            console.error("Error updating user phone number:", updateError);
          }
        }
      }
      // console.log("Booking created successfully:", booking.id);

      // Create participants - duplicate the primary participant data for each participant
      const participantsData = Array.from(
        { length: data.participant_count },
        () => ({
          booking_id: booking.id,
          name: data.participant.name,
          email: data.participant.email,
          phone_number: data.participant.phone_number,
        })
      );

      const { error: participantsError } = await supabase
        .from("booking_participants")
        .insert(participantsData);

      if (participantsError) {
        console.error("Participants creation error:", participantsError);
        throw participantsError;
      }

      // console.log("Participants created successfully");

      // Send confirmation email
      const emailDueAmount =
        isAgent && advancePayment > 0
          ? (calculatedBookingAmount - advancePayment).toFixed(2)
          : partialPayment
          ? finalDueAmount.toString()
          : "0";

      await sendBookingConfirmationEmail(data, booking.id, emailDueAmount);

      toast({
        title: "Booking confirmed!",
        description:
          "Your payment was successful and booking has been confirmed.",
      });

      onBookingSuccess();
      handleClose();
    } catch (error) {
      console.error("Booking creation error:", error);
      setIsSubmitting(false);
      toast({
        title: "Booking failed",
        description:
          "Payment was successful but there was an error creating your booking. Please contact support.",
        variant: "destructive",
      });
    }
  };
  // console.log("experiencessssss", experience);
  const onSubmit = async (data: BookingFormData) => {
    // console.log("Upfront amount (what user pays now):", upfrontAmount);
    // console.log("Due amount https://www.bucketlistt.com/destination/rishikesh(what user pays on-site):", dueAmount);
    if (!user) {
      // saving data in local storage

      const bookingModalData = {
        data: data,
        selectedDate: selectedDate,
        selectedSlotId: selectedSlotId,
        selectedActivityId: selectedActivityId,
      };

      localStorage.setItem(
        "bookingModalData",
        JSON.stringify(bookingModalData)
      );
      setIsAuthModalOpen(true);
      return;
    }

    if (!selectedDate || !selectedSlotId) {
      toast({
        title: "Missing information",
        description: "Please select both a date and time slot",
        variant: "destructive",
      });
      return;
    }

    // Validate participant count against available spots
    if (
      selectedSlotId &&
      availableSpots !== undefined &&
      data.participant_count > availableSpots
    ) {
      toast({
        title: "Not enough spots available",
        description: `Only ${availableSpots} spot${
          availableSpots !== 1 ? "s" : ""
        } available for this time slot. Please select fewer participants.`,
        variant: "destructive",
      });
      return;
    }

    // Check if there are any spots available at all
    if (selectedSlotId && availableSpots === 0) {
      toast({
        title: "No spots available",
        description:
          "This time slot is fully booked. Please select another time slot.",
        variant: "destructive",
      });
      return;
    }

    localStorage.removeItem("bookingModalData");
    // For agents, validate b2bPrice and sellingPrice
    if (isAgent) {
      if (!b2bPrice || b2bPrice <= 0) {
        toast({
          title: "Missing information",
          description: "Please enter B2B Price",
          variant: "destructive",
        });
        return;
      }
      if (!sellingPrice || sellingPrice <= 0) {
        toast({
          title: "Missing information",
          description: "Please enter Selling Price",
          variant: "destructive",
        });
        return;
      }
      // Validate advance payment cannot be greater than booking amount
      if (advancePayment > 0 && advancePayment > finalPrice) {
        toast({
          title: "Invalid advance payment",
          description: "Advance payment cannot be greater than booking amount",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    // For agents, always create direct booking without payment
    if (isAgent) {
      await createDirectBooking(data);
      return;
    }

    // console.log("We are here");

    // If bypass payment is enabled, create booking directly
    if (bypassPayment) {
      await createDirectBooking(data);
      return;
    }
    if (upfrontAmount === 0) {
      await createDirectBooking(data);
      return;
    }
    // console.log("Starting booking process...");
    // console.log("data", upfrontAmount);
    try {
      // console.log("Creating Razorpay order...");
      const orderPayload = {
        amount: upfrontAmount,
        currency: selectedActivity?.currency || experience.currency,
        experienceTitle: experience.title,
        bookingData: {
          experience_id: experience.id,
          time_slot_id: selectedSlotId,
          booking_date: selectedDate.toISOString(),
          participant: data.participant,
          participant_count: data.participant_count,
          note_for_guide: data.note_for_guide,
          referral_code: data?.referral_code,
          coupon_code: data?.coupon_code,
          partial_payment: partialPayment,
          due_amount: partialPayment ? dueAmount : 0,
          booking_amount: finalPrice,
        },
      };
      // console.log("Order payload:", orderPayload);

      const { data: orderData, error: orderError } =
        await supabase.functions.invoke("create-razorpay-order", {
          body: orderPayload,
        });

      // console.log("Supabase function response:", { orderData, orderError });

      if (orderError) {
        console.error("Supabase function error:", orderError);
        throw new Error(`Order creation failed: ${orderError.message}`);
      }

      if (!orderData || !orderData.order) {
        console.error("Invalid response from order creation:", orderData);
        throw new Error("Invalid response from payment service");
      }

      const { order } = orderData;
      // console.log("Razorpay order created successfully:", order);

      // Open Razorpay payment with the live key
      await openRazorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_AyU0PWr4XJPUZ8",
        amount: order.amount,
        currency: order.currency,
        name: "bucketlistt Experiences",
        description: `Book ${experience.title}`,
        order_id: order.id,
        handler: async (response: any) => {
          // console.log("Payment successful:", response);
          await createBookingAfterPayment(data, response.razorpay_payment_id);
        },
        prefill: {
          name: data.participant.name,
          email: data.participant.email,
          contact: data.participant.phone_number,
        },
        theme: {
          color: "hsl(var(--brand-primary))",
        },
        modal: {
          ondismiss: () => {
            // console.log("Payment modal dismissed by user");
            setIsSubmitting(false);
            toast({
              title: "Payment cancelled",
              description: "Your booking was not completed.",
              variant: "destructive",
            });
          },
        },
      });
    } catch (error: any) {
      console.error("Payment initiation error:", error);
      setIsSubmitting(false);
      toast({
        title: "Payment failed",
        description:
          error.message ||
          "There was an error initiating payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add query for selected activity details
  const { data: selectedActivity } = useQuery({
    queryKey: ["activity", selectedActivityId],
    queryFn: async () => {
      if (!selectedActivityId) return null;

      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("id", selectedActivityId)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedActivityId,
  });

  // Calculate final price and payment amounts after selectedActivity is available
  const finalPrice = calculateFinalPrice();
  const totalPrice = finalPrice;

  // Calculate payment amounts for partial payment
  // For agents: due amount = booking amount - advance payment
  // For regular users: upfront = 10%, due = 90%
  const upfrontAmount = isAgent
    ? 0 // Agents don't pay upfront
    : partialPayment
    ? parseFloat((finalPrice * 0.1).toFixed(2))
    : finalPrice;
  const dueAmount =
    isAgent && advancePayment > 0
      ? parseFloat((finalPrice - advancePayment).toFixed(2)) // Due = booking amount - advance payment
      : isAgent
      ? 0 // No due amount if no advance payment
      : partialPayment
      ? parseFloat((finalPrice - upfrontAmount).toFixed(2))
      : 0;

  // Get time slots for summary display with availability
  const { data: timeSlots } = useQuery({
    queryKey: [
      "time-slots-summary",
      experience.id,
      selectedDate,
      selectedActivityId,
    ],
    queryFn: async () => {
      if (!selectedDate || !selectedActivityId) return [];

      const dateStr = selectedDate.toISOString().split("T")[0];

      // Get time slots for the experience
      const { data: slots, error: slotsError } = await supabase
        .from("time_slots")
        .select("*")
        .eq("experience_id", experience.id)
        .eq("activity_id", selectedActivityId);

      if (slotsError) throw slotsError;

      // Get bookings for this specific date
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("time_slot_id, total_participants")
        .eq("experience_id", experience.id)
        .gte("booking_date", `${dateStr}T00:00:00`)
        .lt("booking_date", `${dateStr}T23:59:59`)
        .eq("status", "confirmed");

      if (bookingsError) throw bookingsError;

      // Calculate availability for each slot
      const slotsWithAvailability = (slots || []).map((slot: any) => {
        const slotBookings = (bookings || []).filter(
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
    enabled: !!selectedDate && !!selectedActivityId,
  });

  // Get available spots for the selected slot
  const selectedSlot = timeSlots?.find(
    (slot: any) => slot.id === selectedSlotId
  );
  const availableSpots = selectedSlot?.available_spots ?? 0;
  const maxParticipants = Math.min(50, availableSpots || 50);

  // Format time function
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  };

  const totalActivityPrice = selectedActivity
    ? parseFloat(
        (getActivityPrice(selectedActivity) * participantCount).toFixed(2)
      )
    : 0;

  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      // title={`Book Experience: ${experience.title}`}
      width={1000}
      footer={null}
      destroyOnClose={true}
      maskClosable={false}
      className="BookingDialogModal"
      bodyStyle={{ padding: "10px" }}
    >
      {currentStep === 1 ? (
        // Step 1: Activity Selection (Mobile) or Activity + Date + Time Selection (Desktop)
        <div className="space-y-6">
          {isMobile ? (
            // Mobile: Only Activity Selection
            <div>
              {/* <h3 className="text-lg font-semibold mb-4">Select Activity</h3> */}
              <SlotSelector
                experienceId={experience.id}
                selectedDate={selectedDate}
                selectedSlotId={selectedSlotId}
                selectedActivityId={selectedActivityId}
                participantCount={participantCount}
                onDateChange={handleDateChange}
                onSlotChange={handleSlotChange}
                onActivityChange={setSelectedActivityId}
                showOnlyActivitySelection={true}
              />
            </div>
          ) : (
            // Desktop: Activity + Date + Time Selection (original behavior)
            <SlotSelector
              experienceId={experience.id}
              selectedDate={selectedDate}
              selectedSlotId={selectedSlotId}
              selectedActivityId={selectedActivityId}
              participantCount={participantCount}
              onDateChange={handleDateChange}
              onSlotChange={handleSlotChange}
              onActivityChange={setSelectedActivityId}
            />
          )}

          {/* Step 1 Footer */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={
                isMobile
                  ? !selectedActivityId
                  : !selectedActivityId || !selectedDate || !selectedSlotId
              }
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              Next
            </Button>
          </div>
        </div>
      ) : currentStep === 2 && isMobile ? (
        // Step 2: Date and Time Selection (Mobile only)
        <div className="space-y-6">
          <div>
            {/* <h3 className="text-lg font-semibold mb-4">Select Date & Time</h3> */}
            <SlotSelector
              experienceId={experience.id}
              selectedDate={selectedDate}
              selectedSlotId={selectedSlotId}
              selectedActivityId={selectedActivityId}
              participantCount={participantCount}
              onDateChange={handleDateChange}
              onSlotChange={handleSlotChange}
              onActivityChange={setSelectedActivityId}
              showOnlyDateAndTime={true}
            />
          </div>

          {/* Step 2 Footer */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={!selectedDate || !selectedSlotId}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              Next
            </Button>
          </div>
        </div>
      ) : (
        // Step 2: Participants and Payment Details
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
              {/* Left Column: Activity Summary */}

              <div>
                <div className="BackgroundImageSet">
                  {/* <div className="ActivityImageShow">
                    <img src={experience.image_url} alt={experience.title} className="w-full h-full object-cover rounded-lg" />
                  </div> */}
                  <Card className="py-2 px-2" id="BookingSummaryCard">
                    <h3 className="textSmall">Booking Summary</h3>

                    {/* Date Selection */}
                    <div className="DateSelectorContainer">
                      <div
                        className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-1.5 md:p-2"
                        style={{ border: "1px solid #e0e0e0" }}
                      >
                        <div className="text-red-500 text-xs md:text-sm font-medium">
                          {selectedDate ? format(selectedDate, "MMM") : "---"}
                        </div>
                        <div className="text-xl md:text-2xl font-bold text-gray-900">
                          {selectedDate ? format(selectedDate, "d") : "--"}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {selectedDate ? format(selectedDate, "EEE") : "---"}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 md:w-4 md:h-4 bg-gray-400 rounded-sm flex-shrink-0"></div>
                            <span className="ExperienceTitleText text-sm md:text-base truncate">
                              {experience.title.length > 25
                                ? `${experience.title.substring(0, 25)}...`
                                : experience.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 md:w-4 md:h-4 bg-gray-400 rounded-sm flex-shrink-0"></div>
                            <span className="font-medium text-gray-900 text-sm md:text-base truncate">
                              {selectedActivity?.name || "Select Activity"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="w-full h-full"
                              >
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12,6 12,12 16,14"></polyline>
                              </svg>
                            </div>
                            <span className="text-gray-600 text-sm md:text-base">
                              {timeSlots?.find(
                                (slot) => slot.id === selectedSlotId
                              )
                                ? `${formatTime(
                                    timeSlots.find(
                                      (slot) => slot.id === selectedSlotId
                                    )!.start_time
                                  )}`
                                : "Select Time Slot"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <hr className="my-2 md:my-3" />

                    {/* Pricing Breakdown */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm md:text-base">
                        {participantCount}{" "}
                        {participantCount === 1 ? "Person" : "People"}
                      </span>
                      <div className="text-right">
                        {(selectedActivity as any)?.discounted_price &&
                        (selectedActivity as any).discounted_price !==
                          (selectedActivity as any).price ? (
                          <div className="flex items-end gap-2">
                            <span className="text-xs md:text-sm text-gray-400 line-through">
                              {selectedActivity.currency === "INR"
                                ? "₹"
                                : selectedActivity?.currency}{" "}
                              {selectedActivity.price * participantCount}
                            </span>
                            <span className="font-semibold text-green-600 text-sm md:text-base">
                              {selectedActivity.currency === "INR"
                                ? "₹"
                                : selectedActivity?.currency}{" "}
                              {totalActivityPrice}
                            </span>
                          </div>
                        ) : (
                          <span className="font-semibold text-sm md:text-base">
                            {selectedActivity?.currency === "INR"
                              ? "₹"
                              : selectedActivity?.currency}{" "}
                            {totalActivityPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* <hr className="my-4" /> */}

                    {/* Total Payable */}
                    {/* <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-lg">Total payable</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        You'll pay ${(totalActivityPrice * 0.011).toFixed(2)}
                        <div className="w-4 h-4 text-gray-400">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-500">
                        {selectedActivity?.currency === 'INR' ? '₹' : selectedActivity?.currency}{totalActivityPrice}
                      </div>
                    </div>
                  </div> */}
                  </Card>
                </div>
              </div>

              {/* Right Column: Participants and Details */}
              <div className="space-y-6">
                {/* Bypass Payment Toggle */}
                {/* <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-orange-800 dark:text-orange-200">
                          Bypass Payment (Beta)
                        </h4>
                        <p className="text-sm text-orange-600 dark:text-orange-300">
                          Skip payment and create booking directly for testing
                        </p>
                      </div>
                      <Switch
                        checked={bypassPayment}
                        onCheckedChange={setBypassPayment}
                      />
                    </div>
                  </CardContent>
                </Card> */}

                {/* Agent Pricing Section */}
                {isAgent && (
                  <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                    <CardContent className="p-4 space-y-4">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200">
                        Agent Pricing
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="b2bPrice">B2B Price</Label>
                          <Input
                            id="b2bPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={b2bPrice || ""}
                            onChange={(e) =>
                              setB2bPrice(parseFloat(e.target.value) || 0)
                            }
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sellingPrice">Selling Price</Label>
                          <Input
                            id="sellingPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={sellingPrice || ""}
                            onChange={(e) =>
                              setSellingPrice(parseFloat(e.target.value) || 0)
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="advancePayment">
                          Advance Payment (Optional)
                        </Label>
                        <Input
                          id="advancePayment"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={advancePayment || ""}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setAdvancePayment(value);
                          }}
                          className="w-full"
                        />
                        {advancePayment > 0 && advancePayment > finalPrice && (
                          <p className="text-sm text-red-600">
                            Advance payment cannot be greater than booking
                            amount
                          </p>
                        )}
                      </div>
                      {sellingPrice > 0 && participantCount > 0 && (
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Booking Amount ({participantCount}{" "}
                              {participantCount === 1 ? "person" : "people"})
                            </span>
                            <span className="font-semibold text-lg">
                              {selectedActivity?.currency ||
                                experience.currency}{" "}
                              {finalPrice.toFixed(2)}
                            </span>
                          </div>
                          {advancePayment > 0 && (
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm text-muted-foreground">
                                Advance Payment
                              </span>
                              <span className="font-semibold text-blue-600">
                                {selectedActivity?.currency ||
                                  experience.currency}{" "}
                                {advancePayment.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {advancePayment > 0 && (
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm text-muted-foreground">
                                Due Amount
                              </span>
                              <span className="font-semibold text-orange-600">
                                {selectedActivity?.currency ||
                                  experience.currency}{" "}
                                {dueAmount.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Participants Section */}
                <div className="space-y-4">
                  {/* <h3 className="text-lg font-semibold">Participants</h3> */}

                  {/* Participant Count Selector */}
                  <FormField
                    control={form.control}
                    name="participant_count"
                    render={({ field }) => {
                      const [inputValue, setInputValue] = useState(
                        field.value.toString()
                      );

                      return (
                        <>
                          <FormItem id="participant-count-form-item">
                            <div className="flex items-center gap-2 justify-between">
                              <Card
                                style={{ width: "100%", padding: "3px 10px" }}
                                id="ParticipantCountCard"
                              >
                                <div>
                                  <FormLabel>Number of Participants</FormLabel>
                                  {selectedSlotId &&
                                    availableSpots !== undefined && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {availableSpots > 0
                                          ? `${availableSpots} spot${
                                              availableSpots !== 1 ? "s" : ""
                                            } available`
                                          : "No spots available"}
                                      </p>
                                    )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    {/* Minus Button */}
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-10 w-10 shrink-0"
                                      onClick={() => {
                                        if (field.value > 1) {
                                          const newValue = field.value - 1;
                                          field.onChange(newValue);
                                          setInputValue(newValue.toString());
                                        }
                                      }}
                                      disabled={field.value <= 1}
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>

                                    {/* Input Field */}
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="1"
                                        max={maxParticipants}
                                        value={inputValue}
                                        disabled={true}
                                        onChange={(e) => {
                                          setInputValue(e.target.value);
                                        }}
                                        onBlur={(e) => {
                                          const value = parseInt(
                                            e.target.value
                                          );
                                          if (isNaN(value) || value < 1) {
                                            field.onChange(1);
                                            setInputValue("1");
                                          } else if (value > maxParticipants) {
                                            field.onChange(maxParticipants);
                                            setInputValue(
                                              maxParticipants.toString()
                                            );
                                          } else {
                                            field.onChange(value);
                                            setInputValue(value.toString());
                                          }
                                        }}
                                        className="text-center font-medium"
                                        placeholder="1"
                                      />
                                    </FormControl>

                                    {/* Plus Button */}
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-10 w-10 shrink-0"
                                      onClick={() => {
                                        if (field.value < maxParticipants) {
                                          const newValue = field.value + 1;
                                          field.onChange(newValue);
                                          setInputValue(newValue.toString());
                                        }
                                      }}
                                      disabled={
                                        field.value >= maxParticipants ||
                                        availableSpots === 0
                                      }
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            </div>
                            {/* <div className="text-sm text-muted-foreground text-center">
                            {field.value}{" "}
                            {field.value === 1 ? "Person" : "People"}
                          </div> */}
                          </FormItem>
                        </>
                      );
                    }}
                  />

                  {/* Single Participant Form */}
                  <Card id="primary-contact-details-card">
                    <CardContent className="px-3 py-3">
                      <h4 className="font-medium mb-1">
                        Primary Contact Details
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        <FormField
                          control={form.control}
                          name="participant.name"
                          render={({ field }) => (
                            <FormItem>
                              {/* <FormLabel>Name</FormLabel> */}
                              <FormControl>
                                <Input
                                  placeholder="Full name *"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                    // Trigger validation if field becomes empty
                                    if (!e.target.value.trim()) {
                                      form.trigger("participant.name");
                                    }
                                  }}
                                  onBlur={(e) => {
                                    field.onBlur();
                                    // Trigger validation on blur
                                    form.trigger("participant.name");
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="participant.email"
                          render={({ field }) => (
                            <FormItem>
                              {/* <FormLabel>Email</FormLabel> */}
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="Email *"
                                  {...field}
                                  onChange={(e) => {
                                    const value = e.target.value.trim();
                                    field.onChange(value);
                                  }}
                                  onBlur={(e) => {
                                    // Trigger validation on blur
                                    field.onBlur();
                                    form.trigger("participant.email");
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="participant.phone_number"
                          render={({ field }) => (
                            <FormItem>
                              {/* <FormLabel>Phone</FormLabel> */}
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
                                    form.trigger("participant.phone_number");
                                  }}
                                  maxLength={10}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="note_for_guide"
                          render={({ field }) => (
                            <FormItem id="note-for-guide-textarea">
                              {/* <FormLabel>Note for Tour Guide (Optional)</FormLabel> */}
                              <FormControl>
                                <Textarea
                                  style={{ minHeight: "20px" }}
                                  placeholder="Any special requests/information for your guide"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="referral_code"
                          render={({ field }) => (
                            <FormItem>
                              {!isReferralCodeExpanded ? (
                                <div
                                  onClick={() =>
                                    setIsReferralCodeExpanded(true)
                                  }
                                  className="cursor-pointer"
                                >
                                  <span className="text-sm GrayColor">
                                    Referral Code (Optional)
                                  </span>
                                  <ChevronDown className="h-4 w-4 inline-block ml-2" />
                                </div>
                              ) : (
                                <>
                                  <div
                                    onClick={() => {
                                      setIsReferralCodeExpanded(false);
                                      if (!field.value) {
                                        field.onChange("");
                                      }
                                    }}
                                    className="cursor-pointer mb-2"
                                  >
                                    <span className="text-sm GrayColor">
                                      Referral Code (Optional)
                                    </span>
                                    <ChevronUp className="h-4 w-4 inline-block ml-2" />
                                  </div>
                                  <FormControl>
                                    <Input
                                      id="referral-code-input"
                                      placeholder="Referral Code"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(
                                          e.target.value.toUpperCase()
                                        )
                                      }
                                      value={field.value?.toUpperCase() || ""}
                                      autoFocus
                                    />
                                  </FormControl>
                                </>
                              )}
                            </FormItem>
                          )}
                        />
                        {!isAgent && (
                          <div className="space-y-3">
                            <FormField
                              control={form.control}
                              name="coupon_code"
                              render={({ field }) => (
                                <FormItem>
                                  {!isCouponCodeExpanded ? (
                                    <div
                                      onClick={() =>
                                        setIsCouponCodeExpanded(true)
                                      }
                                      className="cursor-pointer"
                                    >
                                      <span className="text-sm GrayColor">
                                        Coupon Code (Optional)
                                      </span>
                                      <ChevronDown className="h-4 w-4 inline-block ml-2" />
                                    </div>
                                  ) : (
                                    <>
                                      <div
                                        onClick={() => {
                                          setIsCouponCodeExpanded(false);
                                          if (!couponCode) {
                                            handleCouponCodeChange("");
                                          }
                                        }}
                                        className="cursor-pointer mb-2"
                                      >
                                        <span className="text-sm GrayColor">
                                          Coupon Code (Optional)
                                        </span>
                                        <ChevronUp className="h-4 w-4 inline-block ml-2" />
                                      </div>
                                      <div className="flex gap-2">
                                        <FormControl>
                                          <Input
                                            placeholder="Enter coupon code"
                                            value={couponCode}
                                            onChange={(e) =>
                                              handleCouponCodeChange(
                                                e.target.value
                                              )
                                            }
                                            autoFocus
                                          />
                                        </FormControl>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          onClick={handleCouponValidation}
                                          disabled={!couponCode.trim()}
                                          className="flex items-center gap-2"
                                        >
                                          <Tag className="h-4 w-4" />
                                          Apply
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </FormItem>
                              )}
                            />

                            {/* Coupon Validation Status - Only show error messages */}
                            {couponValidation && !couponValidation.isValid && (
                              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <span className="text-sm text-red-800">
                                  {couponValidation.message}
                                </span>
                              </div>
                            )}

                            {/* Applied Coupon Display */}
                            {((couponValidation?.isValid &&
                              couponValidation.coupon) ||
                              appliedCoupon) && (
                              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-green-600" />
                                    <span className="font-medium text-green-800">
                                      Coupon Applied:{" "}
                                      {couponValidation?.isValid &&
                                      couponValidation.coupon
                                        ? couponValidation.coupon.coupon
                                            .coupon_code
                                        : appliedCoupon.coupon.coupon_code}
                                    </span>
                                  </div>
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-100 text-green-800"
                                  >
                                    {(() => {
                                      const activeCoupon =
                                        couponValidation?.isValid &&
                                        couponValidation.coupon
                                          ? couponValidation.coupon
                                          : appliedCoupon;
                                      return activeCoupon.coupon.type ===
                                        "percentage"
                                        ? `Save ${activeCoupon.discount_calculation.savings_percentage.toFixed(
                                            1
                                          )}%`
                                        : `Save ${experience.currency} ${activeCoupon.discount_calculation.discount_amount}`;
                                    })()}
                                  </Badge>
                                </div>
                                {/* <div className="mt-2 text-sm text-green-700"> */}
                                {/* {(() => {
                          const activeCoupon =
                            couponValidation?.isValid && couponValidation.coupon
                              ? couponValidation.coupon
                              : appliedCoupon;
                          return (
                            <>
                              <div>
                                Original Price: {experience.currency}{" "}
                                {
                                  activeCoupon.discount_calculation
                                    .original_amount
                                }
                              </div>
                              <div>
                                Discount: -{experience.currency}{" "}
                                {
                                  activeCoupon.discount_calculation
                                    .discount_amount
                                }
                              </div>
                              <div className="font-semibold">
                                Final Price: {experience.currency}{" "}
                                {activeCoupon.discount_calculation.final_amount}
                              </div>
                              {activeCoupon.coupon.type === "flat" && (
                                <div className="text-xs text-green-600 mt-1">
                                  Flat discount of {experience.currency}{" "}
                                  {activeCoupon.coupon.discount_value}
                                </div>
                              )}
                              {activeCoupon.coupon.type === "percentage" && (
                                <div className="text-xs text-green-600 mt-1">
                                  {activeCoupon.coupon.discount_value}% discount
                                </div>
                              )}
                            </>
                          );
                        })()} */}
                                {/* </div> */}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  {!isAgent && (
                    <Card
                      className="border-blue-200 bg-blue-50 dark:bg-blue-950/20"
                      id="pay-10-now-card"
                    >
                      <CardContent className="p-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-blue-800 dark:text-blue-200">
                              Pay 10% Now, Rest On-Site
                            </h4>
                            <p className="text-sm text-blue-600 dark:text-blue-300">
                              Book your adventure with 10% — pay the rest when
                              you arrive at spot!
                            </p>
                          </div>
                          <Switch
                            checked={partialPayment}
                            onCheckedChange={setPartialPayment}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <FormField
                    control={form.control}
                    name="terms_accepted"
                    render={({ field }) => (
                      <FormItem
                        className="flex flex-row items-start space-x-3 space-y-0"
                        id="terms-and-conditions-label"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer">
                            I accept the{" "}
                            <a
                              href="/terms"
                              // target="_blank"
                              rel="noopener noreferrer"
                              className="p-0 h-auto text-orange-500 hover:text-orange-600"
                              onClick={(e) => {
                                e.preventDefault();
                                // Get current form data
                                const formData = form.getValues();

                                // Create bookingModalData with the same structure as onSubmit
                                const bookingModalData = {
                                  data: formData,
                                  selectedDate: selectedDate,
                                  selectedSlotId: selectedSlotId,
                                  selectedActivityId: selectedActivityId,
                                };

                                // Save to localStorage
                                localStorage.setItem(
                                  "bookingModalData",
                                  JSON.stringify(bookingModalData)
                                );

                                navigate("/terms");
                              }}
                            >
                              Terms & Conditions
                            </a>
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Step 2 Footer */}
                  <div className="flex gap-3 pt-0 mt-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevStep}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        !selectedDate ||
                        !selectedSlotId ||
                        (isAgent && (!b2bPrice || !sellingPrice)) ||
                        (isAgent &&
                          advancePayment > 0 &&
                          advancePayment > finalPrice)
                      }
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                    >
                      {isSubmitting
                        ? "Processing..."
                        : isAgent
                        ? advancePayment > 0
                          ? `Confirm Booking (Due: ${
                              selectedActivity?.currency || experience.currency
                            } ${
                              dueAmount % 1 === 0
                                ? dueAmount
                                : dueAmount.toFixed(2)
                            })`
                          : "Confirm Booking"
                        : partialPayment
                        ? `Pay ${
                            selectedActivity?.currency || experience.currency
                          } ${
                            upfrontAmount % 1 === 0
                              ? upfrontAmount
                              : upfrontAmount.toFixed(2)
                          } & Confirm Booking`
                        : `Pay ${
                            selectedActivity?.currency || experience.currency
                          } ${
                            finalPrice % 1 === 0
                              ? finalPrice
                              : finalPrice.toFixed(2)
                          } & Confirm Booking`}
                    </Button>
                  </div>
                </div>

                {/* Note for Guide */}

                {/* Coupon Code Section - Hidden for agents */}

                {/* Terms and Conditions */}
              </div>
            </div>

            {/* Partial Payment Toggle - Hidden for agents */}
          </form>
        </Form>
      )}
      <AuthModal
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </Modal>
  );
};
