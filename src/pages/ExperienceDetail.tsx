// @ts-nocheck
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookingDialog } from "@/components/BookingDialog";
import { BookingSuccessAnimation } from "@/components/BookingSuccessAnimation";
import { UserBookings } from "@/components/UserBookings";
import { MobileFloatingButton } from "@/components/MobileFloatingButton";
import { RecentBookingsTable } from "@/components/RecentBookingsTable";
import { CouponInput } from "@/components/CouponInput";
import { CouponManager } from "@/components/CouponManager";
import { useAuth } from "@/contexts/AuthContext";
import { IoCheckmarkDoneCircle } from "react-icons/io5";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "@/components/GlobalCss/ExperienceDetailGallery.css";

import {
  ArrowLeft,
  Star,
  Clock,
  Users,
  MapPin,
  Calendar,
  Route,
  Tag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CreditCard,
  Smartphone,
  Compass,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
// import { saveAs } from "file-saver"
import { useUserRole } from "@/hooks/useUserRole";
import { BulkBookingPaymentDialog } from "@/components/BulkBookingPaymentDialog";
import { ExperienceVendorAnalytics } from "@/components/ExperienceVendorAnalytics";
import { CertificationBadges } from "@/components/CertificationBadges";
import { CouponValidationResult } from "@/hooks/useDiscountCoupon";
import "../Styles/ExperienceDetail.css";
import { Image } from "antd";
const ExperienceDetail = () => {
  const { name } = useParams(); // This is the url_name from the URL
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const swiperRef = useRef<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showBottomBar, setShowBottomBar] = useState(false);

  // Get experience data from navigation state (if available)
  const stateExperienceData = location.state?.experienceData;
  const fromPage = location.state?.fromPage;

  const {
    isVendor,
    loading: roleLoading,
    isAgent,
    role,
    isAdmin,
  } = useUserRole();
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [isBulkPaymentDialogOpen, setIsBulkPaymentDialogOpen] = useState(false);
  const [bulkBookingsData, setBulkBookingsData] = useState([]);
  const [bulkParticipantsData, setBulkParticipantsData] = useState([]);
  const [appliedCoupon, setAppliedCoupon] =
    useState<CouponValidationResult | null>(null);
  const [showCouponInput, setShowCouponInput] = useState(false);

  // Fetch experience by url_name from URL params
  const {
    data: experience,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["experience", name],
    queryFn: async () => {
      if (!name) throw new Error("URL name is required");

      const result = await supabase
        .from("experiences")
        .select("*")
        .eq("url_name", name)
        .single();

      const { data, error } = result as { data: any; error: any };

      if (error) {
        console.error("Error fetching experience:", error);
        throw error;
      }

      // Debug: Log what we received
      console.log("Experience data received:", data);
      console.log("vendor_id in data:", data?.vendor_id);
      console.log("Has vendor_id property:", data && "vendor_id" in data);

      // If vendor_id is missing or null, try to fetch it explicitly
      if (data && (data.vendor_id === undefined || data.vendor_id === null)) {
        console.log("vendor_id is missing/null, fetching separately...");
        const vendorResult = await supabase
          .from("experiences")
          .select("vendor_id")
          .eq("url_name", name)
          .single();
        const vendorData = (vendorResult as { data: any; error: any }).data;
        console.log("Separate vendor_id fetch result:", vendorData);
        if (vendorData?.vendor_id !== undefined) {
          return {
            ...(data as Record<string, any>),
            vendor_id: vendorData.vendor_id,
          };
        }
      }

      return data;
    },
    enabled: !!name,
    // Use state data as initial data if available and url_name matches
    initialData:
      stateExperienceData?.url_name === name ? stateExperienceData : undefined,
    // Only fetch if we don't have state data or if the data is stale
    staleTime: stateExperienceData?.url_name === name ? 5 * 60 * 1000 : 0, // 5 minutes if we have state data
  });

  // Get the experience ID after fetching (for subsequent queries)
  const id = experience?.id;

  // If vendor_id is still missing, try to fetch it by ID
  const { data: vendorIdData } = useQuery({
    queryKey: ["experience-vendor-id", id],
    queryFn: async () => {
      if (!id) return null;
      const result = await supabase
        .from("experiences")
        .select("vendor_id")
        .eq("id", id)
        .single();
      const { data, error } = result as { data: any; error: any };
      if (error) {
        console.error("Error fetching vendor_id by ID:", error);
        return null;
      }
      return data?.vendor_id || null;
    },
    enabled:
      !!id &&
      (experience?.vendor_id === undefined || experience?.vendor_id === null),
  });

  // Merge vendor_id if we fetched it separately
  const experienceWithVendorId =
    experience &&
      (experience.vendor_id === undefined || experience.vendor_id === null) &&
      vendorIdData
      ? { ...experience, vendor_id: vendorIdData }
      : experience;

  console.log("experienceeeee", experienceWithVendorId?.vendor_id);
  const { data: images } = useQuery({
    queryKey: ["experience-images", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("experience_images")
        .select("*")
        .eq("experience_id", id)
        .order("display_order");

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Get activities data to check for discounted prices
  const { data: activities } = useQuery({
    queryKey: ["activities", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("experience_id", id)
        .eq("is_active", true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Get the first activity's discounted price (assuming single activity for desktop display)
  const firstActivity = activities?.[0];
  const discountedPrice = (firstActivity as any)?.discounted_price;

  // Calculate pricing logic similar to new component
  const basePrice = firstActivity?.price || experience?.price || 0;
  let finalPrice, originalPrice, hasDiscount, discountPercentage;

  if (discountedPrice && discountedPrice !== basePrice) {
    hasDiscount = true;
    originalPrice = basePrice;
    finalPrice = discountedPrice;
    discountPercentage = Math.round(((basePrice - discountedPrice) / basePrice) * 100);
  } else if (experience?.original_price && experience?.original_price !== experience?.price) {
    hasDiscount = true;
    originalPrice = experience.original_price;
    finalPrice = experience.price;
    discountPercentage = Math.round(((experience.original_price - experience.price) / experience.original_price) * 100);
  } else {
    hasDiscount = false;
    originalPrice = null;
    finalPrice = basePrice;
    discountPercentage = 0;
  }

  // console.log("experienceeeee", experience);
  const { data: userBookings, refetch: refetchBookings } = useQuery({
    queryKey: ["user-experience-bookings", user?.id, id],
    queryFn: async () => {
      if (!user || !id) return [];

      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          booking_participants (
            name,
            email,
            phone_number
          ),
          time_slots (
            start_time,
            end_time,
            activity_id,
            activities (
              id,
              name,
              price,
              currency
            )
          )
        `
        )
        .eq("user_id", user.id)
        .eq("experience_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!id,
  });

  const getDistanceDisplay = () => {
    if (experience?.distance_km === 0) return "On spot experience";
    if (
      experience?.distance_km &&
      experience?.start_point &&
      experience?.end_point
    ) {
      return `${experience.distance_km}km journey starting from ${experience.start_point} to ${experience.end_point}`;
    }
    if (experience?.distance_km) return `${experience.distance_km}km route`;
    return null;
  };

  const handleBookingSuccess = () => {
    localStorage.removeItem("bookingModalData");
    setShowSuccessAnimation(true);
    navigate("/confirm-booking");
    refetchBookings();
  };

  const handleAnimationComplete = () => {
    setShowSuccessAnimation(false);
  };

  const handleBulkPaymentSuccess = () => {
    localStorage.removeItem("bookingModalData");
    setShowSuccessAnimation(true);
    navigate("/confirm-booking");
    refetchBookings();
    setBulkBookingsData([]);
    setBulkParticipantsData([]);
  };

  const handleCouponApplied = (result: CouponValidationResult) => {
    setAppliedCoupon(result);
    setShowCouponInput(false);
  };

  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
  };

  const formatCurrency = (amount: number) => {
    const currency = experience?.currency || "INR";
    return currency === "USD" ? `$${amount}` : `₹${amount}`;
  };

  const hasExistingBookings = userBookings && userBookings.length > 0;
  const bookingButtonText = hasExistingBookings ? "Book Another" : "Book Now";

  // Mount state for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Scroll detection for bottom bar
  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (scrollY > 200) {
        setShowBottomBar(true);
      } else {
        setShowBottomBar(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Check initial scroll position
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [mounted]);

  // Listen for custom event from MobileFloatingButton
  useEffect(() => {
    const handleOpenBookingDialog = () => {
      setIsBookingDialogOpen(true);
    };

    window.addEventListener("openBookingDialog", handleOpenBookingDialog);

    return () => {
      window.removeEventListener("openBookingDialog", handleOpenBookingDialog);
    };
  }, []);

  // Combine main image with gallery images, prioritizing gallery images
  const galleryImages =
    images && images.length > 0
      ? images
      : experience?.image_url
        ? [
          {
            id: "main",
            image_url: experience.image_url,
            alt_text: experience.title,
            display_order: 0,
            is_primary: true,
          },
        ]
        : [];

  // Format images for swiper
  const activityImages = galleryImages.map((img, index) => ({
    id: img.id || index,
    url: img.image_url || "",
    alt: img.alt_text || `${experience?.title} - Image ${index + 1}`
  }));

  const handlePreviewSlideChange = (swiper: any) => {
    const activeIndex = swiper.activeIndex;
    setSelectedImageIndex(activeIndex);
  };

  const handleBackClick = () => {
    const fromPage = location.state?.fromPage;
    if (fromPage) {
      navigate(-1);
    } else {
      navigate(-1);
    }
  };

  // Bulk Booking CSV Download
  const handleDownloadBulkBookingCSV = () => {
    // Simplified columns - removed total_participants as it's always 1
    const columns = [
      "booking_date (YYYY-MM-DD)",
      "note_for_guide",
      "participant_name",
      "participant_email",
      "participant_phone_number",
    ];
    const csvContent =
      columns.join(",") +
      "\n" +
      "2024-01-15,Sample note,John Doe,john@example.com,+1234567890\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    // Use file-saver if available, else fallback
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, "bulk_booking_template.csv");
    } else {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", "bulk_booking_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Bulk Booking CSV Upload
  const fileInputRef = useRef(null);
  const handleBulkUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // reset file input
      fileInputRef.current.click();
    }
  };
  const handleBulkUploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        alert("CSV file must contain at least a header and one data row");
        return;
      }

      // Skip header row and parse data rows
      const dataRows = lines.slice(1);
      const bookingsToInsert = [];
      const participantsToInsert = [];
      const errors = [];

      for (let i = 0; i < dataRows.length; i++) {
        const line = dataRows[i];
        const [
          bookingDate,
          noteForGuide,
          participantName,
          participantEmail,
          participantPhone,
        ] = line.split(",").map((field) => field.trim());

        if (!bookingDate || !participantName || !participantEmail) {
          errors.push(
            `Row ${i + 2
            }: Missing required fields (booking_date, participant_name, participant_email)`
          );
          continue;
        }

        // Check for available time slots for this date
        const { data: timeSlots, error: slotsError } = await supabase
          .from("time_slots")
          .select("*")
          .eq("experience_id", id)
          .order("start_time");

        if (slotsError) {
          errors.push(
            `Row ${i + 2}: Error fetching time slots - ${slotsError.message}`
          );
          continue;
        }

        if (!timeSlots || timeSlots.length === 0) {
          errors.push(
            `Row ${i + 2}: No time slots available for this experience`
          );
          continue;
        }

        // Check existing bookings for this date to find available slots
        const { data: existingBookings, error: bookingsError } = await supabase
          .from("bookings")
          .select("time_slot_id, total_participants")
          .eq("experience_id", id)
          .eq("booking_date", bookingDate);

        if (bookingsError) {
          errors.push(
            `Row ${i + 2}: Error checking existing bookings - ${bookingsError.message
            }`
          );
          continue;
        }

        // Find an available time slot
        let availableSlot = null;
        for (const slot of timeSlots) {
          const slotBookings =
            existingBookings?.filter(
              (booking) => booking.time_slot_id === slot.id
            ) || [];
          const bookedCount = slotBookings.reduce(
            (sum, booking) => sum + booking.total_participants,
            0
          );
          const availableSpots = slot.capacity - bookedCount;

          if (availableSpots >= 1) {
            availableSlot = slot;
            break;
          }
        }

        if (!availableSlot) {
          errors.push(
            `Row ${i + 2
            }: No available time slots for ${participantName} on ${bookingDate}`
          );
          continue;
        }

        // Generate a unique booking ID
        const bookingId = crypto.randomUUID();

        // Create booking record with time slot
        bookingsToInsert.push({
          id: bookingId,
          user_id: user.id,
          experience_id: id,
          booking_date: bookingDate,
          time_slot_id: availableSlot.id,
          total_participants: 1, // Always 1 as specified
          note_for_guide: noteForGuide || null,
          status: "confirmed",
          created_at: new Date().toISOString(),
        });

        // Create participant record
        participantsToInsert.push({
          booking_id: bookingId,
          name: participantName,
          email: participantEmail,
          phone_number: participantPhone || null,
        });
      }

      // Show errors if any
      if (errors.length > 0) {
        alert("Some bookings could not be created:\n\n" + errors.join("\n"));
        if (bookingsToInsert.length === 0) {
          return;
        }
      }

      if (bookingsToInsert.length === 0) {
        alert("No valid bookings to create");
        return;
      }

      // Store the booking data and show payment dialog
      setBulkBookingsData(bookingsToInsert);
      setBulkParticipantsData(participantsToInsert);
      setIsBulkPaymentDialogOpen(true);
    } catch (error) {
      console.error("Error processing CSV:", error);
      alert("Error processing CSV file: " + error.message);
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-16 px-4">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !experience) {
    // console.log("experience not found", experience, id);
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-16 px-4">
          <div className="text-center">Experience not found</div>
        </div>
      </div>
    );
  }

  if (experience.is_active === false) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-16 px-4">
          <div className="text-center">This experience is not active.</div>
        </div>
      </div>
    );
  }

  return (
    <div id="ExperienceDetail" className="min-h-screen bg-background experience-detail-page">

      {/* Top Section with Title and Info */}
      <div className="experience-detail-top-section SectionPaddingTop">
        <div className="MaxWidthContainer">
          <div className="experience-detail-header">
            <Button
              variant="ghost"
              onClick={handleBackClick}
              className="experience-detail-back-button"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to activities
            </Button>
          </div>

          <div className="experience-detail-title-section">
            <div className="experience-detail-title-content">
              <div className="experience-detail-title">{experience.title}</div>
              <div className="experience-detail-info">
                <div className="experience-info-item">
                  <CheckCircle2 className="experience-info-icon" />
                  <span>ATOAI Certified</span>
                </div>
                <div className="experience-info-item">
                  <CreditCard className="experience-info-icon" />
                  <span>Book Now, Pay Later</span>
                </div>
                <div className="experience-info-item">
                  <CheckCircle2 className="experience-info-icon" />
                  <span>Free Cancellation</span>
                </div>
                <div className="experience-info-item">
                  <Smartphone className="experience-info-icon" />
                  <span>Tickets to your mobile</span>
                </div>
              </div>
            </div>

            {/* Swiper Navigation Buttons - Right Side */}
            {activityImages.length > 1 && (
              <div className="experience-detail-nav-buttons">
                <button
                  className="experience-nav-button experience-nav-prev"
                  onClick={() => swiperRef.current?.slidePrev()}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  className="experience-nav-button experience-nav-next"
                  onClick={() => swiperRef.current?.slideNext()}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          {/* Preview Images Swiper */}
          {activityImages.length > 0 && (
            <div className="experience-detail-preview-swiper">
              <Image.PreviewGroup
                items={activityImages.map((img) => ({
                  src: img.url,
                  alt: img.alt,
                }))}
              >
                <Swiper
                  modules={[Navigation]}
                  spaceBetween={12}
                  slidesPerView={2.4}
                  breakpoints={{
                    320: {
                      slidesPerView: 1.5,
                      spaceBetween: 8,
                    },
                    480: {
                      slidesPerView: 1.4,
                      spaceBetween: 10,
                    },
                    768: {
                      slidesPerView: 2.4,
                      spaceBetween: 12,
                    },
                  }}
                  navigation={false}
                  onSwiper={(swiper) => {
                    swiperRef.current = swiper;
                  }}
                  onSlideChange={handlePreviewSlideChange}
                  className="experience-preview-swiper"
                >
                  {activityImages.map((image, index) => (
                    <SwiperSlide key={image.id}>
                      <div
                        className={`experience-preview-image ${selectedImageIndex === index ? 'active' : ''}`}
                      >
                        <Image
                          src={image.url}
                          alt={image.alt}
                          preview={{}}
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </Image.PreviewGroup>
            </div>
          )}
        </div>
      </div>

      <div className=" py-0 px-0">
        <div className=" ExperienceDetailContainer">
          {/* Details Section */}
          <div className="space-y-6 ">
            <div>
              {/* <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span>{experience.category}</span>
                {experience.location && (
                  <>
                    <span>•</span>
                    <MapPin className="h-4 w-4" />
                    <span>{experience.location}</span>
                  </>
                )}
              </div> */}

              {/* {experience.is_special_offer && (
                <Badge className="mb-4 bg-orange-500 hover:bg-orange-600">
                  Special Offer
                </Badge>
              )} */}
              {/* 
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{experience.rating}</span>
                </div>
                <span className="text-muted-foreground">
                  ({experience.reviews_count?.toLocaleString()} reviews)
                </span>
              </div> */}
            </div>

            {/* Details and Pricing Grid Section */}
            <div className="experience-detail-details-section SectionPaddingTop SectionPaddingBottom">
              <div className="MaxWidthContainer">
                <div className="experience-detail-grid">
                  {/* Left Column - Experience Details */}
                  <div className="experience-detail-details-left">
                    {experience.description && (
                      <div className="experience-detail-description">
                        <div
                          className="DescriptionEditContainer"
                          dangerouslySetInnerHTML={{
                            __html: experience.description,
                          }}
                        />
                      </div>
                    )}

                    {/* Additional Experience Info */}
                    <div className="experience-detail-meta">
                      {experience.duration && (
                        <div className="experience-meta-item">
                          <Clock className="experience-meta-icon" />
                          <span>{experience.duration}</span>
                        </div>
                      )}
                      {experience.group_size && (
                        <div className="experience-meta-item">
                          <Users className="experience-meta-icon" />
                          <span>{experience.group_size}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Merged Pricing and Benefits Card */}
                  <div className="experience-detail-details-right">
                    <div className="experience-unified-card">
                      {/* Tilted Badge */}
                      {appliedCoupon?.discount_calculation ? (
                        <div className="tilted-badge">
                          <span className="tilted-badge-text">
                            {Math.round(appliedCoupon.discount_calculation.savings_percentage)}% OFF
                          </span>
                        </div>
                      ) : hasDiscount ? (
                        <div className="tilted-badge">
                          <span className="tilted-badge-text">
                            {discountPercentage}% OFF
                          </span>
                        </div>
                      ) : (
                        <div className="tilted-badge tilted-badge-popular">
                          <span className="tilted-badge-text">Best Deal</span>
                        </div>
                      )}

                      {/* Card Header */}
                      <div className="unified-card-header">
                        <div className="card-title-section">
                          <div className="card-icon">
                            <Compass className="card-icon-svg" />
                          </div>
                          <div>
                            <h2 className="card-title">Book Your Adventure</h2>
                            <p className="card-subtitle">Secure your spot today</p>
                          </div>
                        </div>
                      </div>

                      {/* Meta Information */}
                      {(experience.duration || experience.group_size) && (
                        <div className="experience-pricing-meta">
                          {experience.duration && (
                            <div className="experience-pricing-meta-item">
                              <Clock className="h-4 w-4" />
                              <span>{experience.duration}</span>
                            </div>
                          )}
                          {experience.group_size && (
                            <div className="experience-pricing-meta-item">
                              <Users className="h-4 w-4" />
                              <span>{experience.group_size}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pricing Section */}
                      <div className="experience-pricing">
                        <span className="pricing-label">Starting from</span>
                        <div className="pricing-wrapper">
                          {appliedCoupon?.discount_calculation ? (
                            <>
                              <span className="pricing-original">
                                {formatCurrency(experience.price)}
                              </span>
                              <div className="pricing-main">
                                <span className="pricing-discounted">
                                  {formatCurrency(appliedCoupon.discount_calculation.final_amount)}
                                </span>
                              </div>
                            </>
                          ) : hasDiscount ? (
                            <>
                              <span className="pricing-original">
                                {formatCurrency(originalPrice || 0)}
                              </span>
                              <div className="pricing-main">
                                <span className="pricing-discounted">
                                  {formatCurrency(finalPrice)}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="pricing-main">
                              <span className="pricing-current">
                                {formatCurrency(finalPrice || 0)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Coupon Section */}
                      {!isVendor && appliedCoupon && (
                        <div className="mb-4">
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-green-800 text-sm">
                                  Coupon Applied: {appliedCoupon.coupon?.coupon_code}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCouponRemoved}
                                className="text-green-600 hover:text-green-800"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Book Now Button */}
                      <Button
                        size="lg"
                        className="experience-book-button"
                        onClick={() => setIsBookingDialogOpen(true)}
                      >
                        {bookingButtonText} {!isAgent && " - "}
                        {!isAgent &&
                          appliedCoupon?.discount_calculation?.final_amount
                          ? formatCurrency(appliedCoupon.discount_calculation.final_amount)
                          : hasDiscount
                            ? formatCurrency(finalPrice)
                            : formatCurrency(finalPrice || 0)}
                      </Button>

                      {/* Bulk Booking Buttons - Keep all 3 buttons */}
                      <div className="flex flex-col gap-2 mt-2">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleDownloadBulkBookingCSV}
                        >
                          Bulk Booking (Download CSV Template)
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleBulkUploadClick}
                        >
                          Bulk Upload (Upload CSV)
                        </Button>
                        <input
                          type="file"
                          accept=".csv"
                          style={{ display: "none" }}
                          ref={fileInputRef}
                          onChange={handleBulkUploadFile}
                        />
                      </div>

                      {/* Divider */}
                      <div className="card-divider"></div>

                      {/* Benefits Section */}
                      <div className="unified-benefits-section">
                        <h3 className="benefits-title">Why Choose Us?</h3>
                        <ul className="benefits-list">
                          <li className="benefit-item">
                            <div className="check-icon-wrapper">
                              <span className="check-icon">✓</span>
                            </div>
                            <span className="benefit-text">Certified Vendors with many years of experience</span>
                          </li>
                          <li className="benefit-item">
                            <div className="check-icon-wrapper">
                              <span className="check-icon">✓</span>
                            </div>
                            <span className="benefit-text">Get the lowest prices and last minute availability</span>
                          </li>
                          <li className="benefit-item">
                            <div className="check-icon-wrapper">
                              <span className="check-icon">✓</span>
                            </div>
                            <span className="benefit-text">Browse verified reviews</span>
                          </li>
                          <li className="benefit-item">
                            <div className="check-icon-wrapper">
                              <span className="check-icon">✓</span>
                            </div>
                            <span className="benefit-text">Have a question? Talk to our experts 24/7</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coupon Management Section - Show for all vendors */}
        {user &&
          ((isVendor && user.id === experienceWithVendorId?.vendor_id) ||
            isAdmin) && (
            <div className="mt-12">
              <div className="border-t pt-8">
                <CouponManager
                  experienceId={experience.id}
                  experienceTitle={experience.title}
                />
              </div>
            </div>
          )}

        {/* Vendor Analytics Section - Only show if user is the vendor who created this experience */}
        {user && isVendor && experienceWithVendorId?.vendor_id === user.id && (
          <div className="mt-12">
            <div className="border-t pt-8">
              <ExperienceVendorAnalytics
                experienceId={experience.id}
                experienceTitle={experience.title}
                experiencePrice={experience.price || 0}
              />
            </div>
          </div>
        )}

        {/* Certification Badges */}
        {/* <div className="mt-12">
          <div className="border-t pt-8">
            <CertificationBadges />
          </div>
        </div> */}

        {/* Recent Bookings for this Experience */}
        {user && (
          <div className="mt-5">
            <div className="border-t pt-8">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="h-5 w-5 text-brand-primary" />
                <h2 className="text-2xl font-bold text-brand-primary">
                  {isVendor && experienceWithVendorId?.vendor_id === user.id
                    ? "All Bookings for this Experience"
                    : "Your Bookings for this Experience"}
                </h2>
              </div>
              <RecentBookingsTable
                experienceId={id}
                limit={10}
                isVendorView={
                  isVendor && experienceWithVendorId?.vendor_id === user.id
                }
              />
            </div>
          </div>
        )}

        {/* Booking Dialog */}
        <BookingDialog
          isOpen={isBookingDialogOpen}
          onClose={() => setIsBookingDialogOpen(false)}
          experience={{
            id: experience.id,
            title: experience.title,
            price: experience.price || 0, // Always use original price for coupon validation
            currency: experience.currency || "INR",
            image_url: experience.image_url,
          }}
          appliedCoupon={appliedCoupon}
          onBookingSuccess={handleBookingSuccess}
          setIsBookingDialogOpen={setIsBookingDialogOpen}
        />

        {/* Success Animation */}
        <BookingSuccessAnimation
          isVisible={showSuccessAnimation}
          onComplete={handleAnimationComplete}
        />

        {/* Bulk Booking Payment Dialog */}
        <BulkBookingPaymentDialog
          isOpen={isBulkPaymentDialogOpen}
          onClose={() => setIsBulkPaymentDialogOpen(false)}
          experience={{
            id: experience.id,
            title: experience.title,
            price: experience.price || 0,
            currency: experience.currency || "INR",
          }}
          bookingsData={bulkBookingsData}
          participantsData={bulkParticipantsData}
          onPaymentSuccess={handleBulkPaymentSuccess}
        />

        {/* Mobile Fixed Bottom Bar - Rendered via Portal */}
        {mounted && typeof window !== 'undefined' && createPortal(
          <div className={`mobile-fixed-bottom-bar ${showBottomBar ? 'mobile-bottom-bar-visible' : ''}`}>
            <div className="mobile-bottom-bar-content">
              {/* Discount Badge */}
              {(appliedCoupon?.discount_calculation || hasDiscount) && (
                <div className="mobile-discount-badge">
                  <span>
                    {appliedCoupon?.discount_calculation
                      ? Math.round(appliedCoupon.discount_calculation.savings_percentage)
                      : discountPercentage}% OFF
                  </span>
                </div>
              )}

              {/* Pricing */}
              <div className="mobile-pricing-section">
                {appliedCoupon?.discount_calculation ? (
                  <>
                    <span className="mobile-original-price">
                      {formatCurrency(experience.price || 0)}
                    </span>
                    <span className="mobile-discounted-price">
                      {formatCurrency(appliedCoupon.discount_calculation.final_amount)}
                    </span>
                  </>
                ) : hasDiscount ? (
                  <>
                    <span className="mobile-original-price">
                      {formatCurrency(originalPrice || 0)}
                    </span>
                    <span className="mobile-discounted-price">
                      {formatCurrency(finalPrice)}
                    </span>
                  </>
                ) : (
                  <span className="mobile-current-price">
                    {formatCurrency(finalPrice || 0)}
                  </span>
                )}
              </div>

              {/* Book Now Button */}
              <Button
                size="lg"
                className="mobile-book-button"
                onClick={() => setIsBookingDialogOpen(true)}
              >
                {bookingButtonText}
              </Button>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default ExperienceDetail;
