import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, CreditCard, XCircle, Smartphone, Clock, Users, MapPin, Compass, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Image } from 'antd';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './DestinationActivity.css';

const DestinationActivity = () => {
    const navigate = useNavigate();
    const { name } = useParams();
    const location = useLocation();
    const swiperRef = React.useRef(null);
    const [mounted, setMounted] = useState(false);
    const [showBottomBar, setShowBottomBar] = useState(false);

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

        window.addEventListener('scroll', handleScroll, { passive: true });
        // Check initial scroll position
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [mounted]);

    // Get activity data from navigation state (if available)
    const stateActivityData = location.state?.activityData;

    // Fetch activity/experience data from database
    const { data: activity, isLoading } = useQuery({
        queryKey: ["activity", name],
        queryFn: async () => {
            if (!name) return null;

            const activityName = name
                .split("-")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");

            const { data, error } = await supabase
                .from("experiences")
                .select("*")
                .eq("url_name", name)
                .single();

            if (error) {
                console.log("Activity not found in database");
                return null;
            }
            return data;
        },
        enabled: !!name,
        initialData: stateActivityData?.url_name === name ? stateActivityData : undefined,
    });

    // Fetch activity images
    const activityId = activity?.id || stateActivityData?.id;
    const { data: images } = useQuery({
        queryKey: ["activity-images", activityId],
        queryFn: async () => {
            if (!activityId) return [];
            const { data, error } = await supabase
                .from("experience_images")
                .select("*")
                .eq("experience_id", activityId)
                .order("display_order");

            if (error) {
                console.log("Error fetching images:", error);
                return [];
            }
            return data || [];
        },
        enabled: !!activityId,
    });

    // Fetch activities data for pricing
    const { data: activities } = useQuery({
        queryKey: ["activities", activityId],
        queryFn: async () => {
            if (!activityId) return [];
            const { data, error } = await supabase
                .from("activities")
                .select("*")
                .eq("experience_id", activityId)
                .eq("is_active", true);

            if (error) {
                console.log("Error fetching activities:", error);
                return [];
            }
            return data || [];
        },
        enabled: !!activityId,
    });

    // Get pricing information - EXACT SAME LOGIC AS ExperienceDetail.tsx
    const firstActivity = activities?.[0];
    const discountedPrice = firstActivity?.discounted_price;

    // Base price: use firstActivity price if available, otherwise experience price
    // This matches the old component logic: firstActivity?.price || experience.price
    const basePrice = firstActivity?.price || activity?.price;

    // Determine which price to display (same priority as ExperienceDetail)
    let finalPrice, originalPrice, hasDiscount, discountPercentage;

    if (discountedPrice && discountedPrice !== basePrice) {
        // Activity has discounted price
        hasDiscount = true;
        originalPrice = basePrice;
        finalPrice = discountedPrice;
        discountPercentage = Math.round(((basePrice - discountedPrice) / basePrice) * 100);
    } else if (activity?.original_price && activity?.original_price !== activity?.price) {
        // Experience has original_price discount
        hasDiscount = true;
        originalPrice = activity.original_price;
        finalPrice = activity.price;
        discountPercentage = Math.round(((activity.original_price - activity.price) / activity.original_price) * 100);
    } else {
        // No discount - use base price
        hasDiscount = false;
        originalPrice = null;
        finalPrice = basePrice;
        discountPercentage = 0;
    }

    // Format currency
    const formatCurrency = (amount) => {
        if (!amount || amount === 0 || isNaN(amount)) return "₹0";
        const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
        if (isNaN(numAmount)) return "₹0";
        const currency = activity?.currency || activityData?.currency || "INR";
        return currency === "USD" ? `$${numAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : `₹${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    // Use dynamic data or fallback to dummy data
    const activityData = activity || stateActivityData || {
        title: "Swiss Alps Explorer",
        duration: "2 Days",
        group_size: "Max 15 People",
        rating: 4.8,
        reviews_count: 320
    };

    // Format activity info
    const formattedDate = activityData.duration || "September 3, 2025";
    const formattedMaxPeople = activityData.group_size || "Max 15 People";
    const formattedRating = activityData.rating
        ? `${activityData.rating} (${activityData.reviews_count || 0}+ reviews)`
        : "4.8 (320+ reviews)";

    // Get images - use database images or fallback to dummy
    const activityImages = images && images.length > 0
        ? images.map((img, index) => ({
            id: img.id || index,
            url: img.image_url || img.video_url || "",
            alt: img.alt_text || `${activityData.title} - Image ${index + 1}`
        }))
        : activityData.image
            ? [{
                id: 1,
                url: activityData.image,
                alt: activityData.title
            }]
            : [
                {
                    id: 1,
                    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop",
                    alt: "Activity Image 1"
                },
                {
                    id: 2,
                    url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop",
                    alt: "Activity Image 2"
                },
                {
                    id: 3,
                    url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=2035&auto=format&fit=crop",
                    alt: "Activity Image 3"
                }
            ];

    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const handlePreviewSlideChange = (swiper) => {
        const activeIndex = swiper.activeIndex;
        setSelectedImageIndex(activeIndex);
    };

    const handleBackClick = () => {
        // Navigate back to the destination page if we have the destination name
        const fromPage = location.state?.fromPage;
        if (fromPage === "destination-experiences-card") {
            navigate(-1); // Go back to previous page (destination page)
        } else {
            navigate(-1);
        }
    };

    if (isLoading) {
        return (
            <div className="destination-activity-page">
                <div className="MaxWidthContainer" style={{ padding: "40px 20px", textAlign: "center" }}>
                    <div>Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div id='DestinationActivity' className="destination-activity-page destination-activity-container">
            {/* Top Section with Title and Info */}
            <div className="destination-activity-top-section SectionPaddingTop ">
                <div className="MaxWidthContainer">
                    <div className="destination-activity-header">
                        <Button
                            variant="ghost"
                            onClick={handleBackClick}
                            className="destination-activity-back-button"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to activities
                        </Button>
                    </div>

                    <div className="destination-activity-title-section">
                        <div className="destination-activity-title-content">
                            <h1 className="destination-activity-title">{activityData.title}</h1>
                            <div className="destination-activity-info">
                                <div className="activity-info-item">
                                    <CheckCircle2 className="activity-info-icon" />
                                    <span>ATOAI Certified</span>
                                </div>
                                <div className="activity-info-item">
                                    <CreditCard className="activity-info-icon" />
                                    <span>Book Now, Pay Later</span>
                                </div>
                                <div className="activity-info-item">
                                    <CheckCircle2 className="activity-info-icon" />
                                    <span>Free Cancellation</span>
                                </div>
                                <div className="activity-info-item">
                                    <Smartphone className="activity-info-icon" />
                                    <span>Tickets to your mobile</span>
                                </div>
                            </div>
                        </div>

                        {/* Swiper Navigation Buttons - Right Side */}
                        {activityImages.length > 1 && (
                            <div className="destination-activity-nav-buttons">
                                <button
                                    className="activity-nav-button activity-nav-prev"
                                    onClick={() => swiperRef.current?.slidePrev()}
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                    className="activity-nav-button activity-nav-next"
                                    onClick={() => swiperRef.current?.slideNext()}
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Preview Images Swiper */}
                    {activityImages.length > 0 && (
                        <div className="destination-activity-preview-swiper">
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
                                    className="activity-preview-swiper"
                                >
                                    {activityImages.map((image, index) => (
                                        <SwiperSlide key={image.id}>
                                            <div
                                                className={`activity-preview-image ${selectedImageIndex === index ? 'active' : ''}`}
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


            {/* Details and Pricing Grid Section */}
            <div className="destination-activity-details-section SectionPaddingTop SectionPaddingBottom">
                <div className="MaxWidthContainer">
                    <div className="destination-activity-grid">
                        {/* Left Column - Activity Details */}
                        <div className="destination-activity-details-left">
                            {activityData.description && (
                                <div className="destination-activity-description">
                                    <div
                                        className="DescriptionEditContainer"
                                        dangerouslySetInnerHTML={{
                                            __html: activityData.description,
                                        }}
                                    />
                                </div>
                            )}

                            {/* Additional Activity Info */}
                            <div className="destination-activity-meta">
                                {activityData.duration && (
                                    <div className="activity-meta-item">
                                        <Clock className="activity-meta-icon" />
                                        <span>{activityData.duration}</span>
                                    </div>
                                )}
                                {activityData.group_size && (
                                    <div className="activity-meta-item">
                                        <Users className="activity-meta-icon" />
                                        <span>{activityData.group_size}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Merged Pricing and Benefits Card */}
                        <div className="destination-activity-details-right">
                            <div className="activity-unified-card">
                                {/* Tilted Badge */}
                                {hasDiscount ? (
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
                                {(activityData.duration || activityData.group_size) && (
                                    <div className="activity-pricing-meta">
                                        {activityData.duration && (
                                            <div className="activity-pricing-meta-item">
                                                <Clock className="h-4 w-4" />
                                                <span>{activityData.duration}</span>
                                            </div>
                                        )}
                                        {activityData.group_size && (
                                            <div className="activity-pricing-meta-item">
                                                <Users className="h-4 w-4" />
                                                <span>{activityData.group_size}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Pricing Section */}
                                <div className="activity-pricing">
                                    <span className="pricing-label">Starting from</span>
                                    <div className="pricing-wrapper">
                                        {hasDiscount ? (
                                            <>
                                                <span className="pricing-original">
                                                    {formatCurrency(originalPrice)}
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

                                {/* Book Now Button */}
                                <Button
                                    size="lg"
                                    className="activity-book-button"
                                    onClick={() => {
                                        // Navigate to booking details page
                                        navigate(`/booking/${activityData.url_name}`, {
                                            state: {
                                                experienceData: activityData,
                                            },
                                        });
                                    }}
                                >
                                    Book Now - {formatCurrency(finalPrice)}
                                </Button>

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

            {/* Mobile Fixed Bottom Bar - Rendered via Portal */}
            {mounted && typeof window !== 'undefined' && createPortal(
                <div className={`mobile-fixed-bottom-bar ${showBottomBar ? 'mobile-bottom-bar-visible' : ''}`}>
                    <div className="mobile-bottom-bar-content">
                        {/* Discount Badge */}
                        {hasDiscount && (
                            <div className="mobile-discount-badge">
                                <span>{discountPercentage}% OFF</span>
                            </div>
                        )}

                        {/* Pricing */}
                        <div className="mobile-pricing-section">
                            {hasDiscount ? (
                                <>
                                    <span className="mobile-original-price">
                                        {formatCurrency(originalPrice)}
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
                            onClick={() => {
                                // Navigate to booking details page
                                navigate(`/booking/${activityData.url_name}`, {
                                    state: {
                                        experienceData: activityData,
                                    },
                                });
                            }}
                        >
                            Book Now
                        </Button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default DestinationActivity;
