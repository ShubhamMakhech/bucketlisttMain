//@ts-check

import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageGallery } from "@/components/ImageGallery";
import { FavoriteButton } from "@/components/FavoriteButton";
import { BookingDialog } from "@/components/BookingDialog";
import { BookingSuccessAnimation } from "@/components/BookingSuccessAnimation";
import { UserBookings } from "@/components/UserBookings";
import { MobileFloatingButton } from "@/components/MobileFloatingButton";
import { RecentBookingsTable } from "@/components/RecentBookingsTable";
import { CouponInput } from "@/components/CouponInput";
import { CouponManager } from "@/components/CouponManager";
import { useAuth } from "@/contexts/AuthContext";
import { IoCheckmarkDoneCircle } from "react-icons/io5";

import {
  ArrowLeft,
  Star,
  Clock,
  Users,
  MapPin,
  Calendar,
  Route,
  Tag,
  Heart,
  Info,
  ChevronRight,
  ShieldCheck,
  PiggyBank,
  Headset,
  Wallet,
  Zap,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
// import { saveAs } from "file-saver"
import { useUserRole } from "@/hooks/useUserRole";
import { BulkBookingPaymentDialog } from "@/components/BulkBookingPaymentDialog";
import { ExperienceVendorAnalytics } from "@/components/ExperienceVendorAnalytics";
import { CertificationBadges } from "@/components/CertificationBadges";
import { CouponValidationResult } from "@/hooks/useDiscountCoupon";
import "../Styles/ExperienceDetail.css";
import { Row, Col, Card } from "antd";

const ExperienceDetail = () => {
  const { name } = useParams(); // This is the url_name from the URL
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

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
  const [selectedActivityId, setSelectedActivityId] = useState<
    string | undefined
  >(undefined);
  /** When set, modal opens with this activity and shows date selection directly (no activity step) */
  const [openBookingWithActivityId, setOpenBookingWithActivityId] = useState<
    string | null
  >(null);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [bulkParticipantsData, setBulkParticipantsData] = useState([]);
  const [appliedCoupon, setAppliedCoupon] =
    useState<CouponValidationResult | null>(null);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [showStickyNav, setShowStickyNav] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [isHighlighted, setIsHighlighted] = useState(false);

  const navItems = [
    { id: "selectActivity", label: "Select Activity" },
    { id: "highlights", label: "Highlights" },
    { id: "inclusion", label: "Inclusion" },
    { id: "exclusion", label: "Exclusion" },
    { id: "eligibility", label: "Eligibility" },
    { id: "location", label: "Location" },
    { id: "cancellation", label: "Cancellation Policy" },
    { id: "operating-hours", label: "Operating Hours" },
    { id: "faqs", label: "FAQs" },
  ];

  // Fetch experience by url_name from URL params
  const {
    data: experience,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["experience", name],
    queryFn: async () => {
      if (!name) throw new Error("URL name is required");

      // @ts-expect-error - Supabase select().single() type inference can be excessively deep
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
        const vendorResult = (await supabase
          .from("experiences")
          .select("vendor_id")
          .eq("url_name", name)
          .single()) as unknown as { data: { vendor_id?: string } | null };
        const vendorData = vendorResult?.data;
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
    // Use state data as initial data if available (for instant paint)
    initialData:
      stateExperienceData?.url_name === name ? stateExperienceData : undefined,
    // Always refetch on mount so we get full row (including description) from server.
    // Navigation state often omits description (e.g. Index passes description={undefined} to cards).
    staleTime: 0,
    refetchOnMount: "always",
  });

  // Get the experience ID after fetching (for subsequent queries)
  const id = experience?.id;

  // When reviews_count is 0/null, use confirmed bookings count so activities show a meaningful number
  const rawCount = experience?.reviews_count;
  const reviewsFromDb =
    typeof rawCount === "number" && !Number.isNaN(rawCount)
      ? Math.max(0, Math.floor(rawCount))
      : typeof rawCount === "string"
        ? Math.max(
            0,
            Math.floor(parseInt(String(rawCount).replace(/,/g, ""), 10) || 0),
          )
        : 0;

  const { data: bookingsCount = 0 } = useQuery({
    queryKey: ["experience-bookings-count", id],
    queryFn: async () => {
      if (!id) return 0;
      const { count, error } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("experience_id", id)
        .eq("status", "confirmed");
      if (error) return 0;
      return typeof count === "number" ? count : 0;
    },
    enabled: !!id && reviewsFromDb === 0,
  });

  // Show review count when we have it; otherwise show bookings count so "others" don't all show 0
  const reviewCount = reviewsFromDb > 0 ? reviewsFromDb : (bookingsCount ?? 0);
  const reviewLabel = reviewsFromDb > 0 ? "reviews" : "people booked";

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

  // Auto-select when there is only one activity
  useEffect(() => {
    if (activities?.length === 1 && !selectedActivityId) {
      setSelectedActivityId(activities[0].id);
    }
  }, [activities, selectedActivityId]);

  // Get the first activity's discounted price (assuming single activity for desktop display)
  const firstActivity = activities?.[0];
  const discountedPrice = (firstActivity as any)?.discounted_price;
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
        `,
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

  // Listen for custom event from MobileFloatingButton
  useEffect(() => {
    const handleOpenBookingDialog = () => {
      setIsBookingDialogOpen(true);
    };

    window.addEventListener("openBookingDialog", handleOpenBookingDialog);

    const handleScroll = () => {
      const scrollPosition =
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        window.scrollY ||
        0;
      setShowStickyNav(scrollPosition > 500);

      const threshold = 180; // Offset for header + sticky nav + buffer
      let foundActive = "";

      for (const item of navItems) {
        const element = document.getElementById(item.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          // If the top of the element has passed the threshold
          if (rect.top <= threshold) {
            foundActive = item.id;
          }
        }
      }

      if (foundActive) {
        setActiveSection(foundActive);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("openBookingDialog", handleOpenBookingDialog);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -130; // height of header + sticky nav + padding
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

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
    const nav = window.navigator as Navigator & {
      msSaveOrOpenBlob?: (blob: Blob, filename: string) => void;
    };
    if (nav.msSaveOrOpenBlob) {
      nav.msSaveOrOpenBlob(blob, "bulk_booking_template.csv");
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
            `Row ${
              i + 2
            }: Missing required fields (booking_date, participant_name, participant_email)`,
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
            `Row ${i + 2}: Error fetching time slots - ${slotsError.message}`,
          );
          continue;
        }

        if (!timeSlots || timeSlots.length === 0) {
          errors.push(
            `Row ${i + 2}: No time slots available for this experience`,
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
            `Row ${i + 2}: Error checking existing bookings - ${
              bookingsError.message
            }`,
          );
          continue;
        }

        // Find an available time slot
        let availableSlot = null;
        for (const slot of timeSlots) {
          const slotBookings =
            existingBookings?.filter(
              (booking) => booking.time_slot_id === slot.id,
            ) || [];
          const bookedCount = slotBookings.reduce(
            (sum, booking) => sum + booking.total_participants,
            0,
          );
          const availableSpots = slot.capacity - bookedCount;

          if (availableSpots >= 1) {
            availableSlot = slot;
            break;
          }
        }

        if (!availableSlot) {
          errors.push(
            `Row ${
              i + 2
            }: No available time slots for ${participantName} on ${bookingDate}`,
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
    <div className="min-h-screen bg-background MaxWidthContainer">
      {/* Sticky Sub-navigation */}
      <div
        className={`experience-detail-sticky-nav ${
          showStickyNav ? "visible" : ""
        }`}
      >
        <div className="sticky-nav-content">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`sticky-nav-item ${
                activeSection === item.id ? "active" : ""
              }`}
              onClick={() => scrollToSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="py-4 px-2">
        {/* <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6 hover:bg-accent"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Homefsa
        </Button> */}

        <div className=" ExperienceDetailContainer">
          {/* Breadcrumbs */}
          <nav className="experience-detail-breadcrumbs">
            <Link to="/">Home</Link>
            <span className="experience-detail-breadcrumb-sep">&#8250;</span>
            {/* {experience.location && (
              <>
                <span>{experience.location}</span>
                <span className="experience-detail-breadcrumb-sep">&#8250;</span>
              </>
            )} */}
            <Link to="/experiences">Rishikesh</Link>
            <span className="experience-detail-breadcrumb-sep">&#8250;</span>
            <span className="experience-detail-breadcrumb-current">
              {experience.title.length > 50
                ? experience.title.slice(0, 50) + "..."
                : experience.title}
            </span>
          </nav>

          {/* Heading row: title + metadata (left) | Save to wishlist (right) */}
          <div className="experience-detail-heading-row">
            <div className="experience-detail-heading-block">
              <h1 className="experience-detail-title">{experience.title}</h1>
              <div className="experience-detail-meta">
                <span className="experience-detail-rating-badge">
                  <Star className="experience-detail-rating-star" />
                  {Number(experience.rating) || "—"}/5
                </span>
                <span className="experience-detail-meta-dot">·</span>
                <span className="experience-detail-reviews">
                  {reviewCount.toLocaleString()} {reviewLabel}
                </span>
                <span className="experience-detail-meta-dot">·</span>
                <span className="experience-detail-booked">Popular</span>
                {experience.location && (
                  <>
                    <span className="experience-detail-meta-dot">·</span>
                    <span className="experience-detail-location">
                      <MapPin className="experience-detail-location-icon" />
                      {/* {experience.location} */}
                      Rishikesh
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="experience-detail-wishlist-wrap">
              <FavoriteButton
                experienceId={experience.id}
                className="experience-detail-wishlist-btn"
              />
              <span className="experience-detail-wishlist-label">
                Save to wishlist
              </span>
            </div>
          </div>

          {/* Image Gallery Section - grid with click to open popup */}
          <div className="GridImageGalleryContainer">
            <ImageGallery
              images={galleryImages}
              experienceTitle={experience.title}
            />
          </div>
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
              {/* <br /> */}
              <div className="features-badges-container">
                <div className="features-badges-grid">
                  <div className="feature-badge">
                    <div className="feature-badge-icon">
                      {/* <img
                        src="/Images/BookPayLater.svg"
                        alt="Book Now Pay Later"
                      /> */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
                        />
                      </svg>
                    </div>
                    <div className="feature-badge-content">
                      <p>Pay Just 10% the book</p>
                    </div>
                    <div className="feature-badge-info-wrap">
                      <span
                        className="feature-badge-info-icon"
                        aria-label="More info"
                      >
                        <Info className="feature-badge-info-i" />
                      </span>
                      <span className="feature-badge-info-tooltip">
                        Pay just 10% upfront to confirm your booking. Rest is to
                        be paid on spot.
                      </span>
                    </div>
                  </div>

                  <div className="feature-badge">
                    <div className="feature-badge-icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
                        />
                      </svg>
                    </div>
                    <div className="feature-badge-content">
                      <p>Tickets to your mobile</p>
                    </div>
                    <div className="feature-badge-info-wrap">
                      <span
                        className="feature-badge-info-icon"
                        aria-label="More info"
                      >
                        <Info className="feature-badge-info-i" />
                      </span>
                      <span className="feature-badge-info-tooltip">
                        Get tickets directly on your Whatsapp & Email.
                      </span>
                    </div>
                  </div>
                  <div className="feature-badge">
                    <div className="feature-badge-icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
                        />
                      </svg>
                    </div>
                    <div className="feature-badge-content">
                      <p>Free Cancellation </p>
                    </div>
                    <div className="feature-badge-info-wrap">
                      <span
                        className="feature-badge-info-icon"
                        aria-label="More info"
                      >
                        <Info className="feature-badge-info-i" />
                      </span>
                      <span className="feature-badge-info-tooltip">
                        Get 100% refund If you cancel 24 hours before the
                        activity start time.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

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
                  ({reviewCount.toLocaleString()} {reviewLabel})
                </span>
              </div> */}
            </div>
          </div>
          <br />
          <div id="booking-section" style={{ marginTop: "0px" }}>
            <Row gutter={[30, 30]} id="selectActivity">
              <Col lg={16}>
                {/* Select Activity - grid of minimal cards above description */}
                {activities && activities.length > 0 && (
                  <Card
                    className={`experience-detail-activity-select-card ${
                      isHighlighted ? "highlight-booking-section" : ""
                    }`}
                    size="small"
                  >
                    <div className="experience-detail-activity-select-header">
                      <span className="experience-detail-activity-select-label">
                        Select Activity
                      </span>
                    </div>
                    <div className="experience-detail-activity-grid">
                      {(showAllActivities
                        ? activities
                        : activities.slice(0, 3)
                      ).map((activity: any) => {
                        const isSelected = selectedActivityId === activity.id;
                        const hasDiscount =
                          activity.discounted_price &&
                          activity.discounted_price !== activity.price;
                        const displayPrice = hasDiscount
                          ? activity.discounted_price
                          : activity.price;
                        const currencySym =
                          activity.currency === "INR" ||
                          activity.currency === "USD"
                            ? "₹"
                            : activity.currency;
                        const description =
                          activity.distance?.trim() || activity.duration || "";
                        const shortDesc =
                          description.length > 100
                            ? description.slice(0, 100).trim() + "…"
                            : description;
                        const openBookingForThis = () => {
                          setSelectedActivityId(activity.id);
                          setOpenBookingWithActivityId(activity.id);
                          setIsBookingDialogOpen(true);
                        };
                        return (
                          <div
                            key={activity.id}
                            className={`experience-detail-activity-card ${
                              isSelected ? "selected" : ""
                            }`}
                            onClick={() => setSelectedActivityId(activity.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              setSelectedActivityId(activity.id)
                            }
                          >
                            <h3 className="experience-detail-activity-card-title">
                              {activity.name}
                            </h3>
                            {shortDesc ? (
                              <p className="experience-detail-activity-card-desc">
                                {shortDesc}
                              </p>
                            ) : null}
                            <div className="experience-detail-activity-card-footer">
                              <div className="experience-detail-activity-card-price-wrap">
                                {hasDiscount && (
                                  <span className="experience-detail-activity-card-original">
                                    {currencySym} {activity.price}
                                  </span>
                                )}
                                <span className="experience-detail-activity-card-price">
                                  {currencySym} {displayPrice}
                                </span>
                              </div>
                              <button
                                type="button"
                                className="experience-detail-activity-card-book-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openBookingForThis();
                                }}
                              >
                                Book Now
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {activities.length > 3 && !showAllActivities && (
                        <div className="experience-detail-activity-show-more-cell">
                          <button
                            type="button"
                            className="experience-detail-activity-show-more-btn"
                            onClick={() => setShowAllActivities(true)}
                          >
                            Show more ({activities.length - 3} more)
                          </button>
                        </div>
                      )}
                    </div>
                    {activities.length > 3 && showAllActivities && (
                      <div className="experience-detail-activity-show-more-wrap">
                        <button
                          type="button"
                          className="experience-detail-activity-show-more-btn"
                          onClick={() => setShowAllActivities(false)}
                        >
                          Show less
                        </button>
                      </div>
                    )}
                  </Card>
                )}
                {experience.description && (
                  <Card className="experience-detail-description-card">
                    <div className="DescriptionEditContainer">
                      <div
                        className="text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: String(experience.description),
                        }}
                      />
                    </div>
                  </Card>
                )}
                <br />
                <div className="ExperienceDetailContainersCards">
                  <Card
                    id="highlights"
                    title="Highlights"
                    className="experience-detail-description-card"
                  >
                    {experience.highlights ? (
                      <div className="DescriptionEditContainer">
                        <div
                          className="text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: String(experience.highlights),
                          }}
                        />
                      </div>
                    ) : null}
                  </Card>
                  <br />
                  <Card
                    id="inclusion"
                    title="Inclusion"
                    className="experience-detail-description-card"
                  >
                    {experience.inclusion ? (
                      <div className="DescriptionEditContainer">
                        <div
                          className="text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: String(experience.inclusion),
                          }}
                        />
                      </div>
                    ) : null}
                  </Card>
                  <br />
                  <Card
                    id="exclusion"
                    title="Exclusion"
                    className="experience-detail-description-card"
                  >
                    {experience.exclusion ? (
                      <div className="DescriptionEditContainer">
                        <div
                          className="text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: String(experience.exclusion),
                          }}
                        />
                      </div>
                    ) : null}
                  </Card>
                  <br />
                  <Card
                    id="eligibility"
                    title="Eligibility"
                    className="experience-detail-description-card"
                  >
                    {experience.eligibility ? (
                      <div className="DescriptionEditContainer">
                        <div
                          className="text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: String(experience.eligibility),
                          }}
                        />
                      </div>
                    ) : null}
                  </Card>
                  <br />
                  <Card
                    id="location"
                    title="Location"
                    className="experience-detail-description-card"
                  >
                    {experience.location_info ? (
                      <div className="DescriptionEditContainer">
                        <div
                          className="text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: String(experience.location_info),
                          }}
                        />
                      </div>
                    ) : null}
                  </Card>
                  <br />
                  <Card
                    id="cancellation"
                    title="Cancellation Policy"
                    className="experience-detail-description-card"
                  >
                    {experience.cancellation_policy ? (
                      <div className="DescriptionEditContainer">
                        <div
                          className="text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: String(experience.cancellation_policy),
                          }}
                        />
                      </div>
                    ) : null}
                  </Card>
                  <br />
                  <Card
                    id="operating-hours"
                    title="Operating Hours"
                    className="experience-detail-description-card"
                  >
                    {experience.operating_hours ? (
                      <div className="DescriptionEditContainer">
                        <div
                          className="text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: String(experience.operating_hours),
                          }}
                        />
                      </div>
                    ) : null}
                  </Card>
                  <br />
                  <Card
                    id="faqs"
                    title="FAQs"
                    className="experience-detail-description-card"
                  >
                    {experience.faqs ? (
                      <div className="DescriptionEditContainer">
                        <div
                          className="text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: String(experience.faqs),
                          }}
                        />
                      </div>
                    ) : null}
                  </Card>
                </div>
              </Col>
              <Col lg={8}>
                <div className="ExperienceDetailRightContainer">
                  {/* <MobileFloatingButton
                      price={experience.price}
                      originalPrice={experience.original_price}
                      currency={experience.currency}
                      bookingButtonText={bookingButtonText}
                      onBookingClick={() => setIsBookingDialogOpen(true)}
                    /> */}
                 

                  <Button
                    size="lg"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    // onClick={() => setIsBookingDialogOpen(true)}
                    onClick={() => {
                      const section =
                        document.getElementById("booking-section");

                      if (section) {
                        const yOffset = -200; // offset
                        const y =
                          section.getBoundingClientRect().top +
                          window.pageYOffset +
                          yOffset;

                        window.scrollTo({ top: y, behavior: "smooth" });

                        // Trigger highlight
                        setIsHighlighted(true);
                        setTimeout(() => setIsHighlighted(false), 2000);
                      }
                    }}
                  >
                    {/* {bookingButtonText} */}
                    Select Activity to Book
                    {/* {!isAgent && " - "}{" "} */}
                    {/* {!isAgent &&
                          appliedCoupon?.discount_calculation?.final_amount
                          ? formatCurrency(
                            appliedCoupon.discount_calculation.final_amount
                          )
                          : discountedPrice &&
                            discountedPrice !==
                            (firstActivity?.price || experience.price)
                            ? formatCurrency(discountedPrice)
                            : experience.original_price &&
                              experience.original_price !== experience.price
                              ? formatCurrency(experience.price)
                              : formatCurrency(
                                firstActivity?.price || experience.price
                              )} */}
                  </Button>

                  {/* Bulk Booking Buttons for Vendor */}
                  {/* {isVendor && ( */}
                  <div className="flex flex-col gap-2 mt-2">
                    {/* <Button
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
                        </Button> */}
                    <input
                      type="file"
                      accept=".csv"
                      style={{ display: "none" }}
                      ref={fileInputRef}
                      onChange={handleBulkUploadFile}
                    />
                  </div>
                  {/* )} */}
                  {/* </Card> */}
                  <div className="WhyBucketlisttContainer">
                    {/* <h3></h3> */}
                    <Card title="Why bucketlistt?" className="why-items">
                      <div className="why-item">
                        <div className="why-icon">
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="why-text">
                          <h4>
                            2000+ happy adventurers{" "}
                            <span
                              onClick={() =>
                                navigate("/?scrollTo=testimonials")
                              }
                              style={{
                                color: "var(--brand-color)",
                                cursor: "pointer",
                                textDecorationLine: "underline",
                              }}
                            >
                              (reviews)
                            </span>
                          </h4>
                        </div>
                      </div>
                      <div className="why-item">
                        <div className="why-icon">
                          <Wallet className="h-4 w-4" />
                        </div>
                        <div className="why-text">
                          <h4>Pay just 10% to reserve — balance at location</h4>
                        </div>
                      </div>
                      <div className="why-item">
                        <div className="why-icon">
                          <Tag className="h-4 w-4" />
                        </div>
                        <div className="why-text">
                          <h4>Lowest prices with last-minute availability</h4>
                        </div>
                      </div>
                      <div className="why-item">
                        <div className="why-icon">
                          <Zap className="h-4 w-4" />
                        </div>
                        <div className="why-text">
                          <h4>Instant booking confirmation</h4>
                        </div>
                      </div>
                      <div className="why-item">
                        <div className="why-icon">
                          <Headset className="h-4 w-4" />
                        </div>
                        <div className="why-text">
                          <h4>
                            24/7 expert{" "}
                            <a
                              href="https://wa.me/918511838237"
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "var(--brand-color)",
                                cursor: "pointer",
                                textDecorationLine: "underline",
                              }}
                            >
                              support
                            </a>
                          </h4>
                        </div>
                      </div>
                      <div className="why-item">
                        <div className="why-icon">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div className="why-text">
                          <h4>No hidden charges. Ever.</h4>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </Col>
            </Row>
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
        <div className="mt-12">
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
        onClose={() => {
          setOpenBookingWithActivityId(null);
          setIsBookingDialogOpen(false);
        }}
        experience={{
          id: experience.id,
          title: experience.title,
          price: experience.price || 0, // Always use original price for coupon validation
          currency: experience.currency || "INR",
          image_url: galleryImages?.[0]?.image_url || experience.image_url,
        }}
        externalSelectedActivityId={
          openBookingWithActivityId ?? selectedActivityId ?? undefined
        }
        appliedCoupon={
          appliedCoupon?.coupon && appliedCoupon?.discount_calculation
            ? {
                coupon: {
                  coupon_code: appliedCoupon.coupon.coupon_code,
                  type: appliedCoupon.coupon.type,
                  discount_value: appliedCoupon.coupon.discount_value,
                },
                discount_calculation: appliedCoupon.discount_calculation,
              }
            : undefined
        }
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
    </div>
  );
};

export default ExperienceDetail;
