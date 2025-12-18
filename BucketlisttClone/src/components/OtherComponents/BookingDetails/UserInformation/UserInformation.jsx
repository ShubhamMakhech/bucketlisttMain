import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Plus,
    Tag,
    AlertCircle,
    Minus,
    Home,
    ChevronRight,
    ArrowLeft,
    Clock,
    Calendar as CalendarIcon,
    MapPin,
    Lock,
    Info,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRazorpay } from "@/hooks/useRazorpay";
import { SendWhatsappMessage } from "@/utils/whatsappUtil";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useDiscountCoupon } from "@/hooks/useDiscountCoupon";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthModal } from "@/components/AuthModal";
import { useUserRole } from "@/hooks/useUserRole";
import "../BookingDetails.css";
import "./UserInformation.css";

const participantSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z
        .string()
        .min(1, "Email is required")
        .email("Please enter a valid email address")
        .refine((val) => {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return emailRegex.test(val);
        }, "Please enter a valid email address")
        .refine((val) => {
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

const UserInformation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { name } = useParams();
    const { user } = useAuth();
    const { toast } = useToast();
    const { openRazorpay } = useRazorpay();
    const { validateCoupon } = useDiscountCoupon();
    const isMobile = useIsMobile();
    const { isAgent } = useUserRole();

    // Get data from location state or localStorage
    const stateData = location.state || {};

    // Try to restore from localStorage if not in state
    const getStoredBookingData = () => {
        try {
            const stored = localStorage.getItem('bookingData');
            if (stored) {
                const data = JSON.parse(stored);
                // Check if data is not too old (24 hours)
                const isValid = data.timestamp && (Date.now() - data.timestamp < 24 * 60 * 60 * 1000);
                if (isValid) {
                    return {
                        selectedDate: data.selectedDate ? new Date(data.selectedDate) : null,
                        selectedSlotId: data.selectedSlotId,
                        selectedActivityId: data.selectedActivityId,
                    };
                }
            }
        } catch (error) {
            console.error('Error restoring booking data:', error);
        }
        return {};
    };

    const storedData = !stateData.experienceData ? getStoredBookingData() : {};

    const [experienceData, setExperienceData] = useState(stateData.experienceData);
    const [selectedDate, setSelectedDate] = useState(stateData.selectedDate || storedData.selectedDate);
    const [selectedSlotId, setSelectedSlotId] = useState(stateData.selectedSlotId || storedData.selectedSlotId);
    const [selectedActivityId, setSelectedActivityId] = useState(stateData.selectedActivityId || storedData.selectedActivityId);

    // State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bypassPayment, setBypassPayment] = useState(false);
    const [partialPayment, setPartialPayment] = useState(false);
    const [couponCode, setCouponCode] = useState("");
    const [couponValidation, setCouponValidation] = useState(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [participantCount, setParticipantCount] = useState(1);
    const [isReferralCodeExpanded, setIsReferralCodeExpanded] = useState(false);
    const [isCouponCodeExpanded, setIsCouponCodeExpanded] = useState(false);
    const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);

    // Fetch experience data from database if not in state
    const { data: fetchedExperience, isLoading: isLoadingExperience } = useQuery({
        queryKey: ["experience", name],
        queryFn: async () => {
            if (!name) return null;
            const { data, error } = await supabase
                .from("experiences")
                .select("*")
                .eq("url_name", name)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !experienceData && !!name,
    });

    // Update experienceData when fetched
    useEffect(() => {
        if (fetchedExperience && !experienceData) {
            setExperienceData(fetchedExperience);
        }
    }, [fetchedExperience, experienceData]);

    // Redirect if no booking selections (date, slot, activity)
    useEffect(() => {
        // Check if we have saved data in localStorage (user just logged in)
        const hasSavedData = localStorage.getItem("userInformationData");
        
        // Only redirect if experience is loaded, selections are missing, and no saved data exists
        if (experienceData && (!selectedDate || !selectedSlotId || !selectedActivityId) && !hasSavedData) {
            toast({
                title: "Missing booking information",
                description: "Please complete your booking selection",
                variant: "destructive",
            });
            navigate(`/booking/${name}`);
        }
    }, [experienceData, selectedDate, selectedSlotId, selectedActivityId, name, navigate, toast]);

    // Query for activities
    const { data: activities } = useQuery({
        queryKey: ["activities", experienceData?.id],
        queryFn: async () => {
            if (!experienceData?.id) return [];
            const { data, error } = await supabase
                .from("activities")
                .select("*")
                .eq("experience_id", experienceData.id)
                .order("price", { ascending: true });
            if (error) throw error;
            return data;
        },
        enabled: !!experienceData?.id,
    });

    // Get selected activity
    const selectedActivity = activities?.find((a) => a.id === selectedActivityId);

    // Query for time slot
    const { data: timeSlot } = useQuery({
        queryKey: ["timeSlot", selectedSlotId],
        queryFn: async () => {
            if (!selectedSlotId) return null;
            const { data, error } = await supabase
                .from("time_slots")
                .select("*")
                .eq("id", selectedSlotId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!selectedSlotId,
    });

    // Initialize form
    const form = useForm({
        resolver: zodResolver(bookingSchema),
        mode: "onChange",
        defaultValues: {
            participant: {
                name: user?.user_metadata?.name || "",
                email: user?.email || "",
                phone_number: user?.user_metadata?.phone_number || "",
            },
            participant_count: 1,
            note_for_guide: "",
            terms_accepted: false,
            booking_date: selectedDate ? new Date(selectedDate) : null,
            time_slot_id: selectedSlotId || "",
            referral_code: "",
            coupon_code: "",
        },
    });

    // Watch form values
    const termsAccepted = form.watch("terms_accepted");

    useEffect(() => {
        const subscription = form.watch((value) => {
            if (value.participant_count !== undefined) {
                setParticipantCount(value.participant_count);
            }
        });
        return () => subscription.unsubscribe();
    }, [form]);

    // Restore booking data from localStorage (runs on mount)
    useEffect(() => {
        const savedUserInfo = localStorage.getItem("userInformationData");
        if (savedUserInfo) {
            try {
                const savedData = JSON.parse(savedUserInfo);
                console.log("Restoring saved booking data:", savedData);
                
                // Restore booking selections first
                if (savedData.selectedDate) {
                    setSelectedDate(new Date(savedData.selectedDate));
                }
                if (savedData.selectedSlotId) {
                    setSelectedSlotId(savedData.selectedSlotId);
                }
                if (savedData.selectedActivityId) {
                    setSelectedActivityId(savedData.selectedActivityId);
                }
                
                // Restore form values
                if (savedData.formData) {
                    form.setValue("participant.name", savedData.formData.participant.name || "");
                    form.setValue("participant.email", savedData.formData.participant.email || "");
                    form.setValue("participant.phone_number", savedData.formData.participant.phone_number || "");
                    form.setValue("participant_count", savedData.formData.participant_count || 1);
                    form.setValue("note_for_guide", savedData.formData.note_for_guide || "");
                    form.setValue("referral_code", savedData.formData.referral_code || "");
                    form.setValue("terms_accepted", savedData.formData.terms_accepted || false);
                    form.setValue("booking_date", savedData.selectedDate ? new Date(savedData.selectedDate) : null);
                    form.setValue("time_slot_id", savedData.selectedSlotId || "");
                    setParticipantCount(savedData.formData.participant_count || 1);
                }
                
                // Restore coupon if exists
                if (savedData.couponCode) {
                    setCouponCode(savedData.couponCode);
                    setIsCouponCodeExpanded(true);
                }
                
                // Restore applied coupon
                if (savedData.appliedCoupon) {
                    setAppliedCoupon(savedData.appliedCoupon);
                    setCouponValidation({ isValid: true, coupon: savedData.appliedCoupon });
                }
                
                // Restore referral code if exists
                if (savedData.formData?.referral_code) {
                    setIsReferralCodeExpanded(true);
                }
                
                // Set flag to auto-submit after user logs in
                if (user) {
                    console.log("User is already logged in, enabling auto-submit");
                    setShouldAutoSubmit(true);
                }
                
                // DON'T clear localStorage yet - will clear after successful booking
                // This ensures data isn't lost if auto-submit fails
                
                console.log("All booking data restored successfully");
            } catch (error) {
                console.error("Error restoring booking data:", error);
            }
        }
    }, [form, user]);

    // Auto-submit after user logs in (if data was restored from localStorage)
    useEffect(() => {
        if (user && shouldAutoSubmit && selectedDate && selectedSlotId && selectedActivityId && experienceData) {
            console.log("Auto-submitting booking after login");
            // Small delay to ensure all data is loaded
            const timer = setTimeout(() => {
                form.handleSubmit(onSubmit)();
                setShouldAutoSubmit(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [user, shouldAutoSubmit, selectedDate, selectedSlotId, selectedActivityId, experienceData, form]);

    // Calculate prices
    const basePrice = selectedActivity?.price || experienceData?.price || 0;
    const discountedPrice = selectedActivity?.discounted_price;
    const effectivePrice = discountedPrice || basePrice;
    const subtotal = effectivePrice * participantCount;

    // Apply coupon discount
    let finalPrice = subtotal;
    let couponDiscount = 0;
    if (appliedCoupon) {
        couponDiscount = appliedCoupon.discount_calculation?.discount_amount || 0;
        finalPrice = appliedCoupon.discount_calculation?.final_amount || subtotal;
    }

    // Calculate payment amounts
    const paymentAmount = partialPayment ? finalPrice * 0.1 : finalPrice;
    const dueAmount = finalPrice - paymentAmount;

    // Handle coupon validation
    const handleCouponValidation = async () => {
        if (!couponCode.trim()) return;

        const validation = await validateCoupon(
            couponCode,
            experienceData.id,
            selectedActivityId,
            participantCount
        );

        setCouponValidation(validation);

        if (validation.isValid) {
            setAppliedCoupon(validation.coupon);
            toast({
                title: "Coupon applied successfully!",
                description: `You saved ${validation.coupon.discount_calculation?.discount_amount}`,
            });
        } else {
            setAppliedCoupon(null);
            toast({
                title: "Invalid coupon",
                description: validation.message,
                variant: "destructive",
            });
        }
    };

    const handleCouponCodeChange = (value) => {
        setCouponCode(value.toUpperCase());
        if (!value.trim()) {
            setCouponValidation(null);
            setAppliedCoupon(null);
        }
    };

    // Handle form submission
    const onSubmit = async (data) => {
        if (!user) {
            console.log("User not authenticated, saving data and opening auth modal");
            
            // Save all booking data to localStorage before login
            const userInformationData = {
                formData: data,
                couponCode: couponCode,
                appliedCoupon: appliedCoupon,
                experienceId: experienceData.id,
                selectedDate: selectedDate?.toISOString(),
                selectedSlotId: selectedSlotId,
                selectedActivityId: selectedActivityId,
                timestamp: Date.now(),
            };
            
            localStorage.setItem("userInformationData", JSON.stringify(userInformationData));
            console.log("Booking data saved to localStorage:", userInformationData);
            
            setIsAuthModalOpen(true);
            return;
        }

        setIsSubmitting(true);

        try {
            console.log("Starting booking process...");

            // Create booking in database
            const bookingData = {
                user_id: user.id,
                experience_id: experienceData.id,
                booking_date: format(selectedDate, "yyyy-MM-dd"),
                total_participants: data.participant_count,
                note_for_guide: data.note_for_guide || "",
                referral_code: data.referral_code || null,
                status: "confirmed",
                terms_accepted: data.terms_accepted,
            };

            console.log("Booking data:", bookingData);

            const { data: booking, error: bookingError } = await supabase
                .from("bookings")
                .insert([bookingData])
                .select()
                .single();

            if (bookingError) {
                console.error("Booking insert error:", bookingError);
                throw bookingError;
            }

            console.log("Booking created successfully:", booking);

            // Clear all booking-related localStorage
            localStorage.removeItem('bookingData');
            localStorage.removeItem('userInformationData');

            // Send WhatsApp notification (optional, non-blocking)
            try {
                const whatsappMessage = `Booking confirmed for ${experienceData.title}. Date: ${format(selectedDate, "PPP")}. Participants: ${data.participant_count}`;
                await SendWhatsappMessage(data.participant.phone_number, whatsappMessage);
            } catch (whatsappError) {
                console.error("WhatsApp notification error:", whatsappError);
                // Don't fail the booking if WhatsApp fails
            }

            toast({
                title: "Booking confirmed!",
                description: "Your booking has been created successfully.",
            });

            // Navigate to bookings page
            setTimeout(() => {
                navigate("/bookings");
            }, 500);

        } catch (error) {
            console.error("Booking error:", error);
            toast({
                title: "Booking failed",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        navigate(`/booking/${name}`, {
            state: {
                experienceData,
                selectedDate,
                selectedSlotId,
                selectedActivityId,
            },
        });
    };

    // Show loading state
    if (isLoadingExperience || !experienceData) {
        return (
            <div className="booking-details-page MaxWidthContainer">
                <div className="booking-details-container SectionPaddingTop">
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading booking information...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="user-information-page SectionPaddingTop SectionPaddingBottom">
            <div className="user-information-container MaxWidthContainer">
                {/* Breadcrumb */}
                <div className="booking-breadcrumb">
                    <button className="breadcrumb-back-button" onClick={handleBack}>
                        <ArrowLeft size={16} className="breadcrumb-back-icon" />
                        <span>Back</span>
                    </button>
                    <div className="breadcrumb-divider"></div>
                    <button className="breadcrumb-item" onClick={() => navigate('/')}>
                        <Home size={16} />
                        <span>Home</span>
                    </button>
                    <ChevronRight size={14} className="breadcrumb-separator" />
                    <button className="breadcrumb-item" onClick={handleBack}>
                        <span>Booking</span>
                    </button>
                    <ChevronRight size={14} className="breadcrumb-separator" />
                    <span className="breadcrumb-item active">
                        User Information
                    </span>
                </div>

                {/* Main Content Grid */}
                <div className="user-information-grid">
                    {/* Left Column - Form */}
                    <div className="user-information-form">
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            {/* Guests Section */}
                            <div className="form-section">
                                <div className="guests-header">
                                    <h2 className="form-section-title">Guests</h2>
                                    {selectedActivity?.available_slots && selectedActivity.available_slots < 20 && (
                                        <div className="tickets-warning">
                                            <AlertCircle />
                                            <span>Only {selectedActivity.available_slots} tickets left</span>
                                        </div>
                                    )}
                                </div>

                                <div className="guest-type-item">
                                    <div className="guest-type-info">
                                        <h4>Adult</h4>
                                        <p>18 yrs and above</p>
                                    </div>
                                    <div className="guest-type-controls">
                                        <div className="guest-counter">
                                            <button
                                                type="button"
                                                className="guest-counter-btn"
                                                onClick={() => {
                                                    const current = form.getValues("participant_count");
                                                    if (current > 1) {
                                                        form.setValue("participant_count", current - 1);
                                                        setParticipantCount(current - 1);
                                                    }
                                                }}
                                                disabled={participantCount <= 1}
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="guest-counter-value">{participantCount}</span>
                                            <button
                                                type="button"
                                                className="guest-counter-btn"
                                                onClick={() => {
                                                    const current = form.getValues("participant_count");
                                                    if (current < 50) {
                                                        form.setValue("participant_count", current + 1);
                                                        setParticipantCount(current + 1);
                                                    }
                                                }}
                                                disabled={participantCount >= 50}
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                        <div className="guest-type-price">
                                            {selectedActivity?.currency || experienceData.currency}{" "}
                                            {effectivePrice.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Lead Guest Details */}
                            <div className="form-section">
                                <h2 className="form-section-title">Lead guest details</h2>
                                <p className="form-section-subtitle">
                                    Booking on behalf of a friend? Enter their details.
                                </p>

                                <div className="form-fields-grid">
                                    <div className="form-field">
                                        <label className="form-label">
                                            Full Name{" "}
                                            <span className="form-label-note">Must match ID</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Enter full name"
                                            {...form.register("participant.name")}
                                        />
                                        {form.formState.errors.participant?.name && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {form.formState.errors.participant.name.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="form-field">
                                        <label className="form-label">
                                            Phone number{" "}
                                            <span className="form-label-note">
                                                We may reach out for booking updates here over SMS/WhatsApp
                                            </span>
                                        </label>
                                        <div className="form-input-with-icon">
                                            <div className="phone-country-select">
                                                <img src="https://flagcdn.com/w40/in.png" alt="IN" />
                                                <span>+91</span>
                                            </div>
                                            <input
                                                type="tel"
                                                placeholder="Enter phone number"
                                                maxLength={10}
                                                {...form.register("participant.phone_number")}
                                            />
                                        </div>
                                        {form.formState.errors.participant?.phone_number && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {form.formState.errors.participant.phone_number.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="form-field">
                                        <label className="form-label">
                                            Email address{" "}
                                            <span className="form-label-note">We'll send your tickets here</span>
                                        </label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            placeholder="Enter email address"
                                            {...form.register("participant.email")}
                                        />
                                        {form.formState.errors.participant?.email && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {form.formState.errors.participant.email.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="form-field">
                                        <label className="form-label">Confirm email address</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            placeholder="Re-enter email address"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Referral Code - Optional */}
                            <div className="form-section">
                                <div className="form-field-full">
                                    {!isReferralCodeExpanded ? (
                                        <div
                                            onClick={() => setIsReferralCodeExpanded(true)}
                                            className="expandable-field-trigger"
                                        >
                                            <span className="expandable-field-label">
                                                Referral Code (Optional)
                                            </span>
                                            <ChevronDown size={16} />
                                        </div>
                                    ) : (
                                        <>
                                            <div
                                                onClick={() => {
                                                    setIsReferralCodeExpanded(false);
                                                    form.setValue("referral_code", "");
                                                }}
                                                className="expandable-field-trigger"
                                            >
                                                <span className="expandable-field-label">
                                                    Referral Code (Optional)
                                                </span>
                                                <ChevronUp size={16} />
                                            </div>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Enter referral code"
                                                {...form.register("referral_code")}
                                                onChange={(e) => {
                                                    form.setValue("referral_code", e.target.value.toUpperCase());
                                                }}
                                                autoFocus
                                                style={{ marginTop: "12px" }}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Coupon Code - Optional */}
                            {!isAgent && (
                                <div className="form-section">
                                    <div className="form-field-full">
                                        {!isCouponCodeExpanded ? (
                                            <div
                                                onClick={() => setIsCouponCodeExpanded(true)}
                                                className="expandable-field-trigger"
                                            >
                                                <span className="expandable-field-label">
                                                    Coupon Code (Optional)
                                                </span>
                                                <ChevronDown size={16} />
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
                                                    className="expandable-field-trigger"
                                                >
                                                    <span className="expandable-field-label">
                                                        Coupon Code (Optional)
                                                    </span>
                                                    <ChevronUp size={16} />
                                                </div>
                                                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder="Enter coupon code"
                                                        value={couponCode}
                                                        onChange={(e) => handleCouponCodeChange(e.target.value)}
                                                        style={{ flex: 1 }}
                                                        autoFocus
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleCouponValidation}
                                                        disabled={!couponCode.trim()}
                                                        style={{
                                                            padding: "12px 24px",
                                                            background: "var(--brand-color-new)",
                                                            color: "#fff",
                                                            border: "none",
                                                            borderRadius: "8px",
                                                            fontWeight: "500",
                                                            cursor: couponCode.trim() ? "pointer" : "not-allowed",
                                                            opacity: couponCode.trim() ? 1 : 0.5,
                                                        }}
                                                    >
                                                        <Tag size={16} style={{ marginRight: "6px", display: "inline" }} />
                                                        Apply
                                                    </button>
                                                </div>

                                                {/* Coupon Validation Status */}
                                                {couponValidation && !couponValidation.isValid && (
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "8px",
                                                            padding: "12px",
                                                            background: "#fee2e2",
                                                            border: "1px solid #fca5a5",
                                                            borderRadius: "8px",
                                                            marginTop: "12px",
                                                        }}
                                                    >
                                                        <AlertCircle size={16} style={{ color: "#dc2626" }} />
                                                        <span style={{ fontSize: "13px", color: "#dc2626" }}>
                                                            {couponValidation.message}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Applied Coupon Display */}
                                                {((couponValidation?.isValid && couponValidation.coupon) || appliedCoupon) && (
                                                    <div className="discount-applied">
                                                        <div className="discount-applied-info">
                                                            <Tag size={16} />
                                                            <span className="discount-applied-text">
                                                                Coupon Applied:{" "}
                                                                {couponValidation?.isValid && couponValidation.coupon
                                                                    ? couponValidation.coupon.coupon.coupon_code
                                                                    : appliedCoupon.coupon.coupon_code}
                                                            </span>
                                                        </div>
                                                        <span className="discount-applied-badge">
                                                            {(() => {
                                                                const activeCoupon =
                                                                    couponValidation?.isValid && couponValidation.coupon
                                                                        ? couponValidation.coupon
                                                                        : appliedCoupon;
                                                                return activeCoupon.coupon.type === "percentage"
                                                                    ? `Save ${activeCoupon.discount_calculation.savings_percentage.toFixed(1)}%`
                                                                    : `Save ${experienceData.currency} ${activeCoupon.discount_calculation.discount_amount}`;
                                                            })()}
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Right Column - Overview Card */}
                    <div className="booking-overview-card">
                        <img
                            src={experienceData.image_url}
                            alt={experienceData.title}
                            className="overview-image"
                        />
                        <div className="overview-content">
                            <h3 className="overview-title">{experienceData.title}</h3>

                            {/* Date */}
                            <div className="overview-detail-row">
                                <CalendarIcon className="overview-detail-icon" />
                                <div className="overview-detail-content">
                                    <div className="overview-date-badge">
                                        <span className="overview-date-badge-month">
                                            {selectedDate && format(selectedDate, "MMM").toUpperCase()}
                                        </span>
                                        <span className="overview-date-badge-day">
                                            {selectedDate && format(selectedDate, "d")}
                                        </span>
                                        <span className="overview-date-badge-dow">
                                            {selectedDate && format(selectedDate, "EEE")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Time */}
                            <div className="overview-detail-row">
                                <Clock className="overview-detail-icon" />
                                <div className="overview-detail-content">
                                    <div className="overview-detail-content-value">
                                        {timeSlot && `${timeSlot.start_time}`}
                                    </div>
                                </div>
                            </div>

                            {/* Activity */}
                            <div className="overview-detail-row">
                                <MapPin className="overview-detail-icon" />
                                <div className="overview-detail-content">
                                    <div className="overview-detail-content-value">
                                        {selectedActivity?.name}
                                    </div>
                                </div>
                            </div>

                            {/* Price Summary */}
                            <div className="price-summary">
                                <div className="price-row">
                                    <span className="price-row-label">
                                        {participantCount} Adult{participantCount > 1 ? "s" : ""}
                                    </span>
                                    <span className="price-row-value">
                                        {selectedActivity?.currency || experienceData.currency}{" "}
                                        {subtotal.toLocaleString()}
                                    </span>
                                </div>

                                {couponDiscount > 0 && (
                                    <div className="price-row" style={{ color: "#059669" }}>
                                        <span className="price-row-label">Coupon Discount</span>
                                        <span className="price-row-value">
                                            - {selectedActivity?.currency || experienceData.currency}{" "}
                                            {couponDiscount.toLocaleString()}
                                        </span>
                                    </div>
                                )}

                                <div className="price-row price-row-total">
                                    <span className="price-row-label">Total payable</span>
                                    <span className="price-row-value">
                                        {selectedActivity?.currency || experienceData.currency}{" "}
                                        {finalPrice.toLocaleString()}
                                    </span>
                                </div>

                                <div className="price-conversion">
                                    <span>You'll pay AED {(finalPrice * 0.04).toFixed(0)}</span>
                                    <Info size={14} />
                                </div>
                            </div>

                            {/* Supplier Info */}
                            <div className="supplier-info">
                                Supplied by <strong>RAYNA TOURISM L.L.C.</strong>
                                <br />
                                By continuing, you agree to the General Terms, Privacy Policy, and the
                                Cancellation Policy.
                            </div>

                            {/* Terms Checkbox */}
                            <div className="terms-checkbox">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    {...form.register("terms_accepted")}
                                />
                                <label htmlFor="terms">
                                    I agree to the{" "}
                                    <a href="/terms" target="_blank" rel="noopener noreferrer">
                                        Terms & Conditions
                                    </a>
                                </label>
                            </div>

                            {/* Confirm Button */}
                            <button
                                type="submit"
                                onClick={form.handleSubmit(onSubmit)}
                                disabled={isSubmitting || !termsAccepted}
                                className="confirm-pay-button"
                            >
                                <Lock size={18} />
                                <span>
                                    {isSubmitting
                                        ? "Processing..."
                                        : partialPayment
                                            ? `Pay ${selectedActivity?.currency || experienceData.currency} ${paymentAmount.toFixed(0)} Now`
                                            : "Confirm & pay"}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <AuthModal
                open={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />
        </div>
    );
};

export default UserInformation;
