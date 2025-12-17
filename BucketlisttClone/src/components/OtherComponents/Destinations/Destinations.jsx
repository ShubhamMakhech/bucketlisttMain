import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SectionHeader from "@/components/commonComponent/SectionHeader";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./Destinations.css";
import { DestinationImagesAndVideoData } from "./DestinationImagesAndVideo";
import { destinationCardsData } from "./DestinationCardsData";

const Destinations = () => {
    const swiperRef = React.useRef(null);
    const videoRefs = React.useRef({});
    const { name } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Get destination data from navigation state (if available)
    const stateDestinationData = location.state?.destinationData;

    // Helper function to get subtitle
    function getDestinationSubtitle(destination) {
        const subtitles = {
            Rishikesh: "Adventure Capital",
            Goa: "Beach Paradise",
            Matheran: "Hill Station Escape",
            Jaipur: "Royal Heritage",
            Kerala: "God's Own Country",
            Mysore: "Palace City",
            Darjeeling: "Queen of Hills",
            Saputara: "Hill Station Gem"
        };
        return subtitles[destination] || "Explore";
    }

    // Helper function to get description
    function getDestinationDescription(destination) {
        const descriptions = {
            Rishikesh: "Experience the ultimate adventure in Rishikesh with thrilling activities and breathtaking landscapes that will leave you spellbound.",
            Goa: "Discover the vibrant beaches and rich culture of Goa, where every moment is a celebration of life and adventure.",
            Matheran: "Escape to the serene hills of Matheran and immerse yourself in nature's tranquility and scenic beauty.",
            Jaipur: "Explore the royal heritage and magnificent architecture of Jaipur, the Pink City of India.",
            Kerala: "Experience the backwaters, lush greenery, and rich cultural heritage of God's Own Country.",
            Mysore: "Discover the grandeur of Mysore with its majestic palaces and rich cultural traditions.",
            Darjeeling: "Enjoy the breathtaking views and cool climate of Darjeeling, the Queen of Hills.",
            Saputara: "Experience the natural beauty and peaceful atmosphere of Saputara hill station."
        };
        return descriptions[destination] || `Discover the amazing experiences and attractions in ${destination}.`;
    }

    // Get all destinations from data
    const allDestinations = Object.keys(DestinationImagesAndVideoData).map((destination) => {
        const destinationData = DestinationImagesAndVideoData[destination];

        // Get primary media (video first if available, otherwise first photo)
        const primaryVideo = destinationData.videos && destinationData.videos.length > 0 ? destinationData.videos[0] : null;
        const primaryPhoto = destinationData.photos && destinationData.photos.length > 0 ? destinationData.photos[0] : null;
        const primaryMedia = primaryVideo || primaryPhoto;

        return {
            id: destination,
            title: destination,
            subtitle: destinationData.subtitle || getDestinationSubtitle(destination),
            description: destinationData.description || getDestinationDescription(destination),
            image: primaryMedia?.src || "",
            buttonText: "Explore " + destination,
            hasVideo: destinationData.hasVideo || false,
            hasPhotos: destinationData.hasPhotos || false,
            videos: destinationData.videos || [],
            photos: destinationData.photos || []
        };
    });

    // Filter destinations based on URL parameter - if name provided, show only that destination
    const getDisplayDestinations = () => {
        if (!name) {
            // No name in URL - show all destinations
            return allDestinations;
        }

        // Name provided - show only that destination
        const destinationName = name
            .split("-")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

        const selectedDestination = allDestinations.find(
            dest => dest.title.toLowerCase() === destinationName.toLowerCase()
        );

        return selectedDestination ? [selectedDestination] : allDestinations;
    };

    const displayDestinations = getDisplayDestinations();

    // Update swiper when name changes
    useEffect(() => {
        if (swiperRef.current && displayDestinations.length === 1) {
            // Only one destination - ensure we're on slide 0
            setTimeout(() => {
                swiperRef.current.slideTo(0);
            }, 100);
        }
    }, [name, displayDestinations.length]);

    // Handle video playback when slide changes
    useEffect(() => {
        const swiper = swiperRef.current;
        if (!swiper) return;

        const handleSlideChange = () => {
            const activeIndex = swiper.activeIndex;
            const realIndex = swiper.realIndex;
            const currentIndex = realIndex !== undefined ? realIndex : activeIndex;

            // Pause all videos except the current one
            Object.values(videoRefs.current).forEach((video, idx) => {
                if (video && idx !== currentIndex) {
                    if (video && !video.paused) {
                        video.pause();
                    }
                }
            });

            // Play the video for the current slide with aggressive retry
            const currentVideo = videoRefs.current[currentIndex];
            if (currentVideo) {
                // Reset if ended
                if (currentVideo.ended) {
                    currentVideo.currentTime = 0;
                }

                // Aggressive play attempt
                const playVideo = () => {
                    if (currentVideo.paused || currentVideo.ended) {
                        currentVideo.play().catch(() => {
                            // Retry after a short delay
                            setTimeout(() => {
                                if (currentVideo.paused || currentVideo.ended) {
                                    currentVideo.currentTime = 0;
                                    currentVideo.play().catch(() => { });
                                }
                            }, 200);
                        });
                    }
                };

                // Try immediately
                playVideo();

                // Also try after a short delay to ensure it starts
                setTimeout(playVideo, 100);
            }
        };

        swiper.on('slideChange', handleSlideChange);

        // Play video on initial load
        setTimeout(() => {
            handleSlideChange();
        }, 300);

        return () => {
            swiper.off('slideChange', handleSlideChange);
        };
    }, [displayDestinations]);

    // Fetch destination data from database if available
    const { data: destinationData } = useQuery({
        queryKey: ["destination-by-title", name],
        queryFn: async () => {
            if (!name) return null;

            const destinationName = name
                .split("-")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");

            const { data, error } = await supabase
                .from("destinations")
                .select("*")
                .ilike("title", destinationName)
                .single();

            if (error) {
                console.log("Destination not found in database, using static data");
                return null;
            }
            return data;
        },
        enabled: !!name,
    });

    // Fetch destination from database if we don't have destinationData but have a name
    const { data: destinationForExperiences } = useQuery({
        queryKey: ["destination-for-experiences", name],
        queryFn: async () => {
            // If we already have destinationData with ID, return it
            if (destinationData?.id) {
                return destinationData;
            }

            // If we have a name in URL, fetch destination from database
            if (name) {
                const destinationName = name
                    .split("-")
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");

                const { data, error } = await supabase
                    .from("destinations")
                    .select("*")
                    .ilike("title", destinationName)
                    .single();

                if (!error && data) {
                    return data;
                }
            }

            // Fallback: try to get from first display destination
            if (displayDestinations.length > 0) {
                const firstDest = displayDestinations[0];
                const { data, error } = await supabase
                    .from("destinations")
                    .select("*")
                    .ilike("title", firstDest.title)
                    .single();

                if (!error && data) {
                    return data;
                }
            }

            return null;
        },
        enabled: !destinationData?.id && (!!name || displayDestinations.length > 0),
    });

    const finalDestinationId = destinationData?.id || destinationForExperiences?.id;

    const { data: experiences, isLoading: experiencesLoading } = useQuery({
        queryKey: ["destination-experiences-for-cards", finalDestinationId],
        queryFn: async () => {
            if (!finalDestinationId) return [];

            const { data, error } = await supabase
                .from("experiences")
                .select(
                    `
                    *,
                    experience_categories (
                        categories (
                            id,
                            name,
                            icon,
                            color
                        )
                    )
                `
                )
                .eq("destination_id", finalDestinationId)
                .eq("is_active", true)
                .order("rating", { ascending: false })
                .limit(4);

            if (error) {
                console.log("Error fetching experiences:", error);
                return [];
            }
            return data || [];
        },
        enabled: !!finalDestinationId,
    });

    // Fetch activities for all experiences to get discounted prices (similar to ExperienceCard)
    const experienceIds = experiences?.map(exp => exp.id) || [];
    const { data: allActivities } = useQuery({
        queryKey: ["activities-for-cards", experienceIds],
        queryFn: async () => {
            if (experienceIds.length === 0) return {};

            const { data, error } = await supabase
                .from("activities")
                .select("experience_id, price, discounted_price")
                .in("experience_id", experienceIds)
                .eq("is_active", true)
                .order("created_at", { ascending: true });

            if (error) {
                console.log("Error fetching activities:", error);
                return {};
            }

            // Group activities by experience_id and get first activity's discounted price
            const activitiesMap = {};
            data?.forEach(activity => {
                if (!activitiesMap[activity.experience_id]) {
                    activitiesMap[activity.experience_id] = activity;
                }
            });

            return activitiesMap;
        },
        enabled: experienceIds.length > 0,
    });

    const handleButtonClick = () => {
        // Scroll to the next section smoothly
        const container = document.querySelector('.destinations-slider-container');

        if (container) {
            // Find the next sibling section or element
            let nextSection = container.nextElementSibling;

            // If no direct sibling, look for the next section element
            if (!nextSection) {
                const allSections = document.querySelectorAll('section, .section-wrapper, [class*="section"]');
                const containerIndex = Array.from(allSections).findIndex(el =>
                    el.contains(container) || container.contains(el)
                );
                if (containerIndex !== -1 && containerIndex < allSections.length - 1) {
                    nextSection = allSections[containerIndex + 1];
                }
            }

            if (nextSection) {
                // Scroll to the next section
                nextSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            } else {
                // Fallback: scroll by container height
                const containerRect = container.getBoundingClientRect();
                const scrollPosition = window.scrollY + containerRect.bottom;

                window.scrollTo({
                    top: scrollPosition,
                    behavior: 'smooth'
                });
            }
        } else {
            // Fallback: scroll by viewport height
            window.scrollTo({
                top: window.scrollY + window.innerHeight,
                behavior: 'smooth'
            });
        }
    };

    return (
        <>
            <div className="destinations-slider-container">
                <Swiper
                    modules={[Navigation, Pagination, Autoplay]}
                    spaceBetween={0}
                    slidesPerView={1}
                    initialSlide={0}
                    navigation={{
                        prevEl: ".destinations-swiper-button-prev",
                        nextEl: ".destinations-swiper-button-next",
                    }}
                    pagination={displayDestinations.length > 1 ? {
                        clickable: true,
                        bulletClass: "destinations-pagination-bullet",
                        bulletActiveClass: "destinations-pagination-bullet-active",
                    } : false}
                    autoplay={displayDestinations.length > 1 ? {
                        delay: 5000,
                        disableOnInteraction: false,
                    } : false}
                    loop={displayDestinations.length > 1}
                    onSwiper={(swiper) => {
                        swiperRef.current = swiper;
                    }}
                    className="destinations-swiper"
                >
                    {displayDestinations.map((destination, index) => {
                        // Use database data if available, otherwise use static data
                        const displayDestination = destinationData && destinationData.title === destination.title
                            ? {
                                ...destination,
                                description: destinationData.description || destination.description,
                                subtitle: destinationData.subtitle || destination.subtitle,
                            }
                            : destination;

                        // Get primary media (video first if available, otherwise first photo)
                        const primaryVideo = displayDestination.videos && displayDestination.videos.length > 0
                            ? displayDestination.videos[0]
                            : null;
                        const primaryPhoto = displayDestination.photos && displayDestination.photos.length > 0
                            ? displayDestination.photos[0]
                            : null;
                        const primaryMedia = primaryVideo || primaryPhoto;

                        return (
                            <SwiperSlide key={destination.id}>
                                <div className="destinations-slide">
                                    <div className="destinations-slide-content MaxWidthContainer">
                                        {/* Left Side - Text Content */}
                                        <div className="destinations-text-section">
                                            <div className="destinations-text-wrapper">
                                                <h2 className="RairBigHeading textAlignStart ColorWhite">
                                                    {displayDestination.title}
                                                </h2>
                                                <p className="destinations-tagline textAlignStart ColorWhite">
                                                    {displayDestination.subtitle}
                                                </p>
                                                {/* <p className="destinations-description textAlignStart ColorWhite">
                                                {displayDestination.description}
                                            </p> */}
                                                {primaryMedia?.content && (
                                                    <p className="destinations-media-content textAlignStart SecondaryColorText">

                                                        <b>     {primaryMedia.content}</b>
                                                    </p>
                                                )}
                                                <Button
                                                    className="destinations-cta-button"
                                                    onClick={handleButtonClick}
                                                >
                                                    {displayDestination.buttonText}
                                                    <ChevronRight className="destinations-button-icon" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Right Side - Image/Video with Clip Path */}
                                        <div className="destinations-image-section">
                                            <div className="destinations-image-wrapper">
                                                {primaryVideo ? (
                                                    <video
                                                        ref={(el) => {
                                                            if (el) {
                                                                videoRefs.current[index] = el;
                                                            }
                                                        }}
                                                        src={primaryVideo.src}
                                                        className="destinations-image"
                                                        autoPlay
                                                        loop
                                                        muted
                                                        playsInline
                                                        webkit-playsinline="true"
                                                        preload="auto"
                                                        onLoadedData={(e) => {
                                                            const video = e.currentTarget;
                                                            video.play().catch(() => { });
                                                        }}
                                                        onLoadedMetadata={(e) => {
                                                            const video = e.currentTarget;
                                                            video.play().catch(() => { });
                                                        }}
                                                        onCanPlay={(e) => {
                                                            const video = e.currentTarget;
                                                            video.play().catch(() => { });
                                                        }}
                                                        onCanPlayThrough={(e) => {
                                                            const video = e.currentTarget;
                                                            video.play().catch(() => { });
                                                        }}
                                                        onEnded={(e) => {
                                                            // Force immediate restart when video ends
                                                            const video = e.currentTarget;
                                                            video.currentTime = 0;
                                                            // Use requestAnimationFrame for immediate restart
                                                            requestAnimationFrame(() => {
                                                                video.play().catch(() => {
                                                                    // If play fails, try again after a tiny delay
                                                                    setTimeout(() => {
                                                                        video.currentTime = 0;
                                                                        video.play().catch(() => { });
                                                                    }, 50);
                                                                });
                                                            });
                                                        }}
                                                        onError={(e) => {
                                                            console.log("Video error:", e);
                                                        }}
                                                        onPlay={() => {
                                                            // Video is playing - ensure it continues
                                                        }}
                                                        onPause={(e) => {
                                                            // If paused unexpectedly (not by user), resume
                                                            const video = e.currentTarget;
                                                            if (!video.ended && video.readyState >= 3) {
                                                                // Only auto-resume if it's not intentionally paused
                                                                setTimeout(() => {
                                                                    if (video.paused && !video.ended) {
                                                                        video.play().catch(() => { });
                                                                    }
                                                                }, 100);
                                                            }
                                                        }}
                                                        onTimeUpdate={(e) => {
                                                            // Critical: Monitor and fix playback continuously
                                                            const video = e.currentTarget;

                                                            // If video is very close to end (within 0.1 seconds), reset to start
                                                            if (video.duration && video.currentTime >= video.duration - 0.1) {
                                                                video.currentTime = 0;
                                                            }

                                                            // If video is paused but should be playing, resume
                                                            if (video.paused && !video.ended && video.readyState >= 3) {
                                                                video.play().catch(() => { });
                                                            }
                                                        }}
                                                        onWaiting={(e) => {
                                                            // Video is buffering - resume when ready
                                                            const video = e.currentTarget;
                                                            const resumeWhenReady = () => {
                                                                if (video.readyState >= 3) {
                                                                    if (video.paused) {
                                                                        video.play().catch(() => { });
                                                                    }
                                                                } else {
                                                                    // Still buffering, check again
                                                                    setTimeout(resumeWhenReady, 100);
                                                                }
                                                            };
                                                            setTimeout(resumeWhenReady, 100);
                                                        }}
                                                        onStalled={(e) => {
                                                            // Video stalled - force resume
                                                            const video = e.currentTarget;
                                                            setTimeout(() => {
                                                                if (video.paused && !video.ended) {
                                                                    video.currentTime = Math.max(0, video.currentTime - 0.1);
                                                                    video.play().catch(() => { });
                                                                }
                                                            }, 200);
                                                        }}
                                                        onSeeking={(e) => {
                                                            // When seeking completes, ensure playback
                                                            const video = e.currentTarget;
                                                            if (video.paused && !video.ended) {
                                                                video.play().catch(() => { });
                                                            }
                                                        }}
                                                        onSeeked={(e) => {
                                                            // After seeking, ensure playback
                                                            const video = e.currentTarget;
                                                            if (video.paused && !video.ended) {
                                                                video.play().catch(() => { });
                                                            }
                                                        }}
                                                    />
                                                ) : primaryPhoto ? (
                                                    <img
                                                        src={primaryPhoto.src}
                                                        alt={displayDestination.title}
                                                        className="destinations-image"
                                                    />
                                                ) : (
                                                    <div className="destinations-image-placeholder">
                                                        No media available
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>

                {/* Navigation Buttons - Only show if multiple destinations */}
                {displayDestinations.length > 1 && (
                    <>
                        <button className="destinations-swiper-button-prev destinations-nav-button">
                            <ChevronLeft />
                        </button>
                        <button className="destinations-swiper-button-next destinations-nav-button">
                            <ChevronRight />
                        </button>
                    </>
                )}
            </div>

            {/* Experiences Cards Section */}
            {experiences && experiences.length > 0 && (
                <section className="destinations-cards-section MaxWidthContainer SectionPaddingTop SectionPaddingBottom">
                    <div>
                        {/* Section Header with Dynamic Destination Name */}
                        {(() => {
                            // Get destination name dynamically
                            const destinationName = destinationData?.title ||
                                displayDestinations[0]?.title ||
                                (name ? name.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") : "Destination");

                            return (
                                <SectionHeader
                                    icon="/Images/NewIcons/Icons/parachute.png"
                                    tag="Explore"
                                    heading={
                                        <>
                                            Top activities to do in <span>{destinationName}</span>
                                        </>
                                    }
                                    alignment="start"
                                    iconStyle="white-circle"
                                />
                            );
                        })()}

                        {experiencesLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-pulse space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className="h-[500px] bg-muted rounded-lg"></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="destinations-cards-grid">
                                {experiences.map((experience) => {
                                    const handleCardClick = () => {
                                        const experienceName = experience.url_name || experience.title
                                            .toLowerCase()
                                            .replace(/[^a-z0-9\s-]/g, "")
                                            .replace(/\s+/g, "-")
                                            .replace(/-+/g, "-")
                                            .trim();

                                        // Navigate to the new DestinationActivity component
                                        navigate(`/activity/${experienceName}`, {
                                            state: {
                                                activityData: {
                                                    id: experience.id,
                                                    title: experience.title,
                                                    image: experience.image_url,
                                                    categories: experience.experience_categories?.map(
                                                        (ec) => ec.categories
                                                    ) || [],
                                                    rating: experience.rating,
                                                    reviews: experience.reviews_count?.toString() || "0",
                                                    price: `${experience.currency === "USD"
                                                        ? "₹"
                                                        : experience.currency == "INR"
                                                            ? "₹"
                                                            : experience.currency
                                                        } ${experience.price}`,
                                                    originalPrice: experience.original_price
                                                        ? `${experience.currency === "USD"
                                                            ? "₹"
                                                            : experience.currency
                                                        } ${experience.original_price}`
                                                        : undefined,
                                                    duration: experience.duration || undefined,
                                                    groupSize: experience.group_size || undefined,
                                                    isSpecialOffer: experience.is_special_offer || false,
                                                    description: experience.description || undefined,
                                                    url_name: experience.url_name,
                                                },
                                                fromPage: "destination-experiences-card",
                                                timestamp: Date.now(),
                                            },
                                        });
                                    };

                                    // Get image - use main image_url or fallback
                                    const displayImage = experience.image_url || "/placeholder.svg";

                                    // Format currency helper function (same as DestinationActivity)
                                    const formatCurrency = (amount) => {
                                        if (!amount || amount === 0 || isNaN(amount)) return "₹0";
                                        const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
                                        if (isNaN(numAmount)) return "₹0";
                                        const currency = experience.currency || "INR";
                                        return currency === "USD"
                                            ? `$${numAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                                            : `₹${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                                    };

                                    // Get activity data for this experience to check discounted price
                                    const activityData = allActivities?.[experience.id];
                                    const activityDiscountedPrice = activityData?.discounted_price;
                                    const activityPrice = activityData?.price;

                                    // Determine original and discounted prices (same logic as DestinationActivity)
                                    const originalPrice = activityPrice || experience.price || 0;
                                    const experienceOriginalPrice = experience.original_price;
                                    const experiencePrice = experience.price;

                                    // Calculate discounted price (activity level takes priority)
                                    const discountedPrice = activityDiscountedPrice && activityDiscountedPrice !== activityPrice
                                        ? activityDiscountedPrice
                                        : experienceOriginalPrice && experienceOriginalPrice !== experiencePrice
                                            ? experiencePrice
                                            : null;

                                    // Final price to display
                                    const finalPrice = discountedPrice || originalPrice;

                                    // Calculate discount percentage
                                    const calculateDiscountPercentage = () => {
                                        if (!discountedPrice || discountedPrice === originalPrice) return 0;
                                        return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
                                    };

                                    const discountPercentage = calculateDiscountPercentage();
                                    const hasDiscount = discountPercentage > 0;

                                    // Format prices for display
                                    const displayPrice = formatCurrency(finalPrice);
                                    const displayOriginalPrice = hasDiscount ? formatCurrency(originalPrice) : null;

                                    // Get description overview
                                    const overview = experience.description
                                        ? experience.description.replace(/<[^>]*>/g, "").split(" ").slice(0, 10).join(" ") + "..."
                                        : "";

                                    return (
                                        <div
                                            key={experience.id}
                                            className="destination-card"
                                            onClick={handleCardClick}
                                        >
                                            <div className="destination-card-image-wrapper">
                                                <img
                                                    src={displayImage}
                                                    alt={experience.title}
                                                    className="destination-card-image"
                                                />
                                                {/* Cinematic Shadow Overlay */}
                                                <div className="destination-card-shadow-overlay"></div>
                                                {/* Rating Badge */}
                                                {experience.rating && (
                                                    <div className="destination-card-rating">
                                                        <span className="rating-star">★</span>
                                                        <span className="rating-value">{Number(experience.rating).toFixed(1)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="destination-card-content">
                                                <h3 className="destination-card-title">{experience.title}</h3>
                                                {overview && (
                                                    <p className="destination-card-overview">
                                                        Overview: {overview}
                                                    </p>
                                                )}
                                                <div className="destination-card-footer">
                                                    <div className="destination-card-price-container">
                                                        {hasDiscount ? (
                                                            <>
                                                                <div className="destination-card-price-header">
                                                                    <div className="destination-card-price-label">From</div>
                                                                    {discountPercentage > 0 && (
                                                                        <div className="destination-card-discount-badge">
                                                                            {discountPercentage}% OFF
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="destination-card-price-wrapper">
                                                                    <div className="destination-card-original-price">
                                                                        {displayOriginalPrice}
                                                                    </div>
                                                                    <div className="destination-card-discounted-price">
                                                                        {displayPrice}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="destination-card-price-label">From</div>
                                                                <div className="destination-card-price">
                                                                    {displayPrice}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                    <Button className="destination-card-button">
                                                        EXPLORE
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Itinerary Selection Section */}
            <section className="destinations-itinerary-section  SectionPaddingTop SectionPaddingBottom">
                <div className="destinations-itinerary-container MaxWidthContainer">
                    <SectionHeader
                        icon="/Images/NewIcons/Icons/parachute.png"
                        tag="Itinerary"
                        heading="Choose Your Perfect Itinerary"
                        alignment="center"
                        iconStyle="white-circle"
                    />
                    <div className="destinations-itinerary-cards MarginTopLarge">
                        <div className="destinations-itinerary-card itinerary-card-day1">
                            <div className="itinerary-card-background"></div>
                            <div className="itinerary-card-overlay"></div>
                            <div className="itinerary-card-number">01</div>
                            <div className="itinerary-card-content">
                                <div className="itinerary-card-badge">1 Day</div>
                                <h3 className="itinerary-card-title">Quick Getaway</h3>
                                <p className="itinerary-card-description">
                                    Perfect for a quick getaway with essential experiences
                                </p>
                            </div>
                        </div>
                        <div className="destinations-itinerary-card itinerary-card-day2">
                            <div className="itinerary-card-background"></div>
                            <div className="itinerary-card-overlay"></div>
                            <div className="itinerary-card-number">02</div>
                            <div className="itinerary-card-content">
                                <div className="itinerary-card-badge">2 Days</div>
                                <h3 className="itinerary-card-title">Weekend Escape</h3>
                                <p className="itinerary-card-description">
                                    Ideal weekend escape with balanced activities
                                </p>
                            </div>
                        </div>
                        <div className="destinations-itinerary-card itinerary-card-day5">
                            <div className="itinerary-card-background"></div>
                            <div className="itinerary-card-overlay"></div>
                            <div className="itinerary-card-number">05</div>
                            <div className="itinerary-card-content">
                                <div className="itinerary-card-badge">5 Days</div>
                                <h3 className="itinerary-card-title">Complete Exploration</h3>
                                <p className="itinerary-card-description">
                                    Complete exploration with all major attractions
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Destinations;
