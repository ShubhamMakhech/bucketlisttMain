// @ts-nocheck
import { HeroHome } from "@/components/HomeRoutes/HeroHomeFolder";
import { DestinationCard } from "@/components/DestinationCard";
import { ExperienceCard } from "@/components/ExperienceCard";
import { TestimonialCarousel } from "@/components/TestimonialCarousel";
import AppDownloadBanner from "@/components/AppDownloadBanner";
import { SEO } from "@/components/SEO";
import HomepageModal from "@/components/HomepageModal";

import { LoadingGrid } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { SimpleHorizontalScroll } from "@/components/ui/SimpleHorizontalScroll";

import { BidirectionalAnimatedSection } from "@/components/BidirectionalAnimatedSection";
import { ArrowRight, Star, Gift, ChevronLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import RotatingText from "@/components/ui/RotatingText";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, FreeMode } from "swiper/modules";
import { IoIosArrowRoundBack } from "react-icons/io";
import { IoIosArrowRoundForward } from "react-icons/io";

import "swiper/css";
import "swiper/css/free-mode";
import "../Styles/Index.css";
import "../components/GlobalCss/WhyUsHome.css";
import "@/components/GlobalCss/TopExperiencesCards.css";
const Index = () => {
  const navigate = useNavigate();
  const experiencesSwiperRef = useRef<SwiperType | null>(null);
  const { user } = useAuth();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Get user location and store in profiles table
  useEffect(() => {
    const updateUserLocation = async () => {
      if (!user?.id) return;

      // Check if geolocation is available
      if (!navigator.geolocation) {
        console.log("Geolocation is not supported by this browser.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            // Try to get readable location name using reverse geocoding
            let locationString = `${latitude},${longitude}`;

            try {
              // Use OpenStreetMap Nominatim API for reverse geocoding (free, no API key required)
              // Note: Nominatim requires a User-Agent header
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
                {
                  headers: {
                    "User-Agent": "bucketlistt-app/1.0",
                  },
                }
              );

              if (response.ok) {
                const data = await response.json();

                if (data && data.address) {
                  const address = data.address;

                  // Build a readable location string (city, state) - excluding country
                  const locationParts = [];

                  // Get city name (try multiple fields)
                  if (address.city) {
                    locationParts.push(address.city);
                  } else if (address.town) {
                    locationParts.push(address.town);
                  } else if (address.village) {
                    locationParts.push(address.village);
                  } else if (address.suburb) {
                    locationParts.push(address.suburb);
                  } else if (address.county) {
                    locationParts.push(address.county);
                  } else if (address.district) {
                    locationParts.push(address.district);
                  }

                  // Get state (try multiple fields)
                  if (address.state) {
                    locationParts.push(address.state);
                  } else if (address.state_district) {
                    locationParts.push(address.state_district);
                  } else if (address.region) {
                    locationParts.push(address.region);
                  }

                  if (locationParts.length > 0) {
                    locationString = locationParts.join(", ");
                  } else {
                    // Fallback: try to extract city and state from display_name
                    if (data.display_name) {
                      // Parse display_name to extract city and state
                      // Format is usually: "City, State, Country, ..."
                      const parts = data.display_name
                        .split(",")
                        .map((p) => p.trim());
                      if (parts.length >= 2) {
                        // Take first two parts (city and state)
                        locationString = parts.slice(0, 2).join(", ");
                      } else {
                        locationString = data.display_name;
                      }
                    }
                  }
                }
              } else {
              }
            } catch (geocodeError) {
              // If reverse geocoding fails, just use coordinates
              console.log(
                "Reverse geocoding failed, using coordinates:",
                geocodeError
              );
            }
            // Update the profile with recent_location
            const { data: updateData, error } = await supabase
              .from("profiles")
              .update({
                recent_location: locationString as any,
                updated_at: new Date().toISOString(),
              })
              .eq("id", user.id)
              .select();

            if (error) {
              console.error("Error updating user location:", error);
              console.error("Error details:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
              });
            } else {
            }
          } catch (error) {
            console.error("Error updating user location:", error);
          }
        },
        (error) => {
          console.error("Error getting user location:", error);
          // Optionally, you can store error info or a default location
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // Cache for 5 minutes
        }
      );
    };

    updateUserLocation();
  }, [user?.id]);

  const { data: destinations, isLoading: destinationsLoading } = useQuery({
    queryKey: ["destinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: experiences, isLoading: experiencesLoading } = useQuery({
    queryKey: ["experiences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select(
          `
          *,
          experience_images!inner (
            image_url,
            is_primary
          )
        `
        )
        .order("created_at", { ascending: true })
        .eq("is_active", true)
        .limit(8);

      if (error) throw error;
      return data;
    },
  });

  // Fetch all activities for experiences to get discounted prices
  const { data: allActivities } = useQuery({
    queryKey: ["all-experiences-activities", experiences?.map(e => e.id)],
    queryFn: async () => {
      if (!experiences || experiences.length === 0) return {};

      const experienceIds = experiences.map(e => e.id);
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .in("experience_id", experienceIds)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group activities by experience_id and get first one for each
      const activitiesMap: Record<string, any> = {};
      data?.forEach((activity) => {
        if (!activitiesMap[activity.experience_id]) {
          activitiesMap[activity.experience_id] = activity;
        }
      });

      return activitiesMap;
    },
    enabled: !!experiences && experiences.length > 0,
  });

  const getExperienceImage = (experience: any) => {
    // Use main image_url if available, otherwise use primary image from experience_images
    if (experience.image_url) {
      return experience.image_url;
    }

    // Find primary image from experience_images
    const primaryImage = experience.experience_images?.find(
      (img: any) => img.is_primary
    );
    return primaryImage?.image_url || "/placeholder.svg";
  };

  // Generate structured data for homepage
  const homepageStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.bucketlistt.com/#website",
        url: "https://www.bucketlistt.com/",
        name: "bucketlistt",
        description:
          "India's premier adventure tourism platform offering curated experiences",
        potentialAction: [
          {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate:
                "https://www.bucketlistt.com/search?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
          },
        ],
      },
      {
        "@type": "TravelAgency",
        "@id": "https://www.bucketlistt.com/#organization",
        name: "bucketlistt",
        url: "https://www.bucketlistt.com/",
        logo: {
          "@type": "ImageObject",
          url: "https://www.bucketlistt.com/bucketListt_logo.svg",
        },
        description:
          "ATOAI certified adventure tourism company offering premium travel experiences across India",
        address: {
          "@type": "PostalAddress",
          addressCountry: "IN",
        },
        sameAs: ["https://www.atoai.org/"],
      },
    ],
  };
  const hideDestinations = ["Matheran", "Matheran", "Saputara", "Mysore"];

  const WhyUsData = [
    {
      icon: "/Images/NewIcons/Icons/RiverRaftingImage.svg",
      title: "Premium Adventures",
      description: "Curated experiences with certified operators and safety-first approach.",
    },
    {
      icon: "/Images/NewIcons/Icons/RiverRaftingImage.svg",
      title: "Best Value Deals",
      description: "Competitive pricing with exclusive offers and flexible booking options.",
    },
    {
      icon: "/Images/NewIcons/Icons/RiverRaftingImage.svg",
      title: "Seamless Booking",
      description: "Instant confirmation with free cancellation and 24/7 support.",
    },
    {
      icon: "/Images/NewIcons/Icons/RiverRaftingImage.svg",
      title: "Trusted Platform",
      description: "Verified reviews and ATOAI-certified partners for safe adventures.",
    }
  ]
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="bucketlistt - Discover Adventures & Plan Your Dream Trips"
        description="Discover India's best adventure experiences with bucketlistt. Book bungee jumping, rafting, trekking & more. ATOAI certified tours with lowest prices guaranteed."
        keywords="adventure tours, travel experiences, India tourism, bungee jumping, rafting, trekking, ATOAI certified, bucket list adventures, adventure activities India"
        structuredData={homepageStructuredData}
      />
      {/* <HomepageModal /> */}

      <BidirectionalAnimatedSection
        animation="fade-up"
        delay={100}
        duration={800}
      >
        <div>
          <HeroHome />
        </div>
      </BidirectionalAnimatedSection>

      {/* Popular Destinations */}
      <BidirectionalAnimatedSection
        animation="fade-up"
        delay={200}
        duration={700}
      >
        {/* <section className="section-wrapper section-bg-primary">
          <div className="container">
            <BidirectionalAnimatedSection
              animation="fade-up"
              delay={100}
              duration={600}
            >
              <div className="flex items-center gap-3 mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-bold">
                  Our popular destinations
                </h2>
              </div>
            </BidirectionalAnimatedSection>

            {destinationsLoading ? (
              <SimpleHorizontalScroll showNavigation={false} disableScrollAnimations={true}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="w-40 md:w-48 h-32 md:h-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
                  />
                ))}
              </SimpleHorizontalScroll>
            ) : (
              <>
                <SimpleHorizontalScroll
                  itemClassName="w-40 md:w-48"
                  className="mt-4"
                  disableScrollAnimations={true}
                >
                  {destinations?.slice(0, 8).map((destination, index) => (
                    <div key={destination.id} className="card-hover">
                      <DestinationCard
                        id={destination.id}
                        image={destination.image_url || ""}
                        title={destination.title}
                        subtitle={destination.subtitle || ""}
                      />
                    </div>
                  ))}
                </SimpleHorizontalScroll>

                <BidirectionalAnimatedSection
                  animation="fade-up"
                  delay={400}
                  duration={600}
                >
                  <div className="text-center mt-8 md:mt-12">
                    <Button
                      variant="outline"
                      size="lg"
                      className="hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-950 button-smooth w-full sm:w-auto"
                      onClick={() => navigate("/destinations")}
                    >
                      View all destinations
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </BidirectionalAnimatedSection>
              </>
            )}
          </div>
        </section> */}
        <section
          className="MaxWidthContainer section-bg-primary SectionPaddingTop  SectionPaddingBottom"
          id="ExploreIndiaTopDestinations"
        >
          <div>
            <BidirectionalAnimatedSection
              animation="fade-up"
              delay={100}
              duration={600}
            >
                <div className="SectionHeading textStart">Explore India's top destinations</div>
            
            </BidirectionalAnimatedSection>

            {destinationsLoading ? (
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="w-40 md:w-48 h-32 md:h-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex-shrink-0"
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="mt-4">
                  <Swiper
                    modules={[FreeMode, Autoplay]}
                    freeMode={true}
                    slidesPerView={4}
                    spaceBetween={16}
                    // loop={true}
                    speed={800}
                    // autoplay={{
                    //   delay: 2500,
                    //   disableOnInteraction: false,
                    //   // pauseOnMouseEnter: true,
                    // }}
                    breakpoints={{
                      320: {
                        slidesPerView: 1.9,
                        spaceBetween: 8,
                      },
                      640: {
                        slidesPerView: 2.3,
                        spaceBetween: 12,
                      },
                      1024: {
                        slidesPerView: 4,
                        spaceBetween: 16,
                      },
                    }}
                    className="mySwiper"
                  >
                    {destinations
                      ?.slice(0, 8)
                      .filter(
                        (destination) =>
                          !hideDestinations.includes(destination.title)
                      )
                      .map((destination) => (
                        <SwiperSlide key={destination.id}>
                          <div
                            className="card-hover"
                            id="DestinationsSwiperCardStyles"
                          >
                            <div className="DestinationCardTagOverlay">
                              <span className="DestinationCardTagPill">
                                {destination.title === "Rishikesh"
                                  ? "Available"
                                  : "Coming Soon"}
                              </span>
                            </div>
                            <DestinationCard
                              id={destination.id}
                              image={destination.image_url || ""}
                              title={destination.title}
                              subtitle={destination.subtitle || ""}
                            />
                          </div>
                        </SwiperSlide>
                      ))}
                  </Swiper>
                </div>

                {/* <BidirectionalAnimatedSection
                  animation="fade-up"
                  delay={400}
                  duration={600}
                >
                  <div className="text-center mt-8 md:mt-12">
                    <Button
                      variant="outline"
                      size="lg"
                      className="hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-950 button-smooth w-full sm:w-auto"
                      onClick={() => navigate("/destinations")}
                    >
                      View all destinations
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </BidirectionalAnimatedSection> */}
              </>
            )}
          </div>
        </section>
      </BidirectionalAnimatedSection>

      {/* Offers Section */}
      <BidirectionalAnimatedSection
        animation="fade-up"
        delay={200}
        duration={700}
      >
        <section id="TopExperiencesSection" className="SecondaryBackground SectionPaddingTop SectionPaddingBottom">
          <div className="MaxWidthContainer">
            <BidirectionalAnimatedSection
              animation="fade-up"
              delay={100}
              duration={600}
            >
              <div className="HeadingHeaderCommonUsed">
                <h2 className="SectionHeading">Top Experiences</h2>
                <div className="SwiperButtonsControls">
                  <button
                    onClick={() => experiencesSwiperRef.current?.slidePrev()}
                  >
                    <IoIosArrowRoundBack />
                  </button>
                  <button
                    onClick={() => experiencesSwiperRef.current?.slideNext()}
                  >
                    <IoIosArrowRoundForward />
                  </button>
                </div>
              </div>
            </BidirectionalAnimatedSection>

            {experiencesLoading ? (
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="w-64 md:w-72 h-80 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex-shrink-0"
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="mt-4">
                  <Swiper
                    modules={[FreeMode, Autoplay]}
                    freeMode={true}
                    slidesPerView={1.5}
                    spaceBetween={16}
                    loop={true}
                    speed={600}
                    onSwiper={(swiper) => {
                      experiencesSwiperRef.current = swiper;
                    }}
                    // autoplay={{
                    //   delay: 2000,
                    //   disableOnInteraction: false,
                    // }}
                    breakpoints={{
                      320: {
                        slidesPerView: 1.3,
                        spaceBetween: 8,
                      },
                      640: {
                        slidesPerView: 2,
                        spaceBetween: 12,
                      },
                      1024: {
                        slidesPerView: 3,
                        spaceBetween: 16,
                      },
                    }}
                    className="mySwiper"
                  >
                    {experiences?.map((experience) => {
                      const handleCardClick = () => {
                        const experienceName = experience.url_name || experience.title
                          .toLowerCase()
                          .replace(/[^a-z0-9\s-]/g, "")
                          .replace(/\s+/g, "-")
                          .replace(/-+/g, "-")
                          .trim();

                        navigate(`/experience/${experienceName}`, {
                          state: {
                            experienceData: {
                              id: experience.id,
                              title: experience.title,
                              image: getExperienceImage(experience),
                            },
                            fromPage: "home-experience-card",
                            timestamp: Date.now(),
                          },
                        });
                      };

                      // Get image
                      const displayImage = getExperienceImage(experience);

                      // Format currency helper function
                      const formatCurrency = (amount: any) => {
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

                      // Determine original and discounted prices
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
                        <SwiperSlide key={experience.id}>
                          <div
                            className="destination-card"
                            onClick={handleCardClick}
                            style={{ height: "100%", cursor: "pointer" }}
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
                        </SwiperSlide>
                      );
                    })}
                  </Swiper>
                </div>
              </>
            )}

            {/* <BidirectionalAnimatedSection
              animation="fade-up"
              delay={400}
              duration={600}
            >
              <div className="text-center mt-5 md:mt-12">
                <Button
                  variant="outline"
                  size="lg"
                  className="hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-950 button-smooth w-full sm:w-auto"
                  onClick={() => navigate("/experiences")}
                >
                  View all experiences
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </BidirectionalAnimatedSection> */}
          </div>
        </section>
      </BidirectionalAnimatedSection>







      {/* ---------------------------------Why Choose Us Section Starts Here --------------------------------- */}


      <div className='BackgroundImageContainer  SectionPaddingTop SectionPaddingBottom'>
        <div className='MaxWidthContainer'>
          <div className='overlayImageContainer'>
            <img src="/Images/SkyDivingBackGroundImage.jpeg" alt="" />
          </div>
          <div>
            <div id='WhyChooseBucketListtHomeContainer'>
              {/* <div className='WhyChooseBucketListtPointsContainer'>
                    <div>
                        <div className='MediumHeading textAlignStart'>
                            And we are ATOAI certified
                        </div>
                        <div className='ATOAIContainer'>
                            <img src="/Images/NewIcons/ATOAI_logo.jpg" alt="" />
                        </div>
                        <div>
                            <p className='textAlignStart'>bucketlistt strictly adheres to the safety, ethical, and operational standards set by the Adventure Tour Operators Association of India (ATOAI). All activities offered on our platform comply with the Basic Minimum Standards prescribed for adventure tourism, ensuring responsible practices, trained staff, certified equipment, and a strong commitment to environmental sustainability. Your safety and experience are our top priorities.</p>
                        </div>

                    </div>
                </div> */}
              {/* <div className='WhyChooseBucketListtHomeImageContainer'>
                    <div>
                        <img src="https://images.unsplash.com/photo-1677464769678-1a152f183c05?q=80&w=1064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="" />
                    </div>
                </div> */}
              <div className='WhyChooseBucketListtHomeContent'>
                <div>
                  <div className='SectionHeading textAlignStart ColorWhite'>Why Choose bucketlistt?</div>
                  <p className='textAlignStart MarginTopSmall ColorWhite'>Our values shape every journey, every interaction, and every detail we design.</p>
                </div>
                <div className='MarginTopLarge'>
                  {WhyUsData.map((item, index) => (
                    <div key={index}>
                      {/* <div>
                                        <img src={item.icon} alt="" />
                                    </div> */}
                      <div className='WidthShort'>
                        <h3 className='SmallHeading textAlignStart ColorWhite'>{item.title}</h3>
                        <p className='textAlignStart MarginTopSmall ColorWhite'>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className='WhyChooseBucketListtHomeImageContainer'>
                  <img src="https://images.unsplash.com/photo-1659221876406-31a3746f41b9?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* ---------------------------------Why Choose Us Section Ends Here --------------------------------- */}






      {/* Testimonials Section */}
      <BidirectionalAnimatedSection
        animation="fade-up"
        delay={200}
        duration={700}
      >
        <TestimonialCarousel />
      </BidirectionalAnimatedSection>

      {/* App Download Banner */}
      {/* <AppDownloadBanner /> */}







      <div className="MaxWidthContainer SectionPaddingBottom"  >
      <div className="ContainerDesinsPurposeOnly MaxWidth800">
        <div className="mt-12 md:mt-16 md:space-y-5">
          <BidirectionalAnimatedSection
            animation="fade-up"
            delay={100}
            duration={600}
          >
            <div className="SectionHeading textCenter">
            We are following ATOAI guidelines
            </div>
            <img
              className="LogoATOAIStyles"
              src="/ATOAI_logo.jpg"
              alt="ATOAI Logo"
            // className="mx-auto w-32 md:w-48 h-auto rounded-lg"
            />
          </BidirectionalAnimatedSection>

          <div className="WhyChooseFlexContainerColumnCenter">
            <BidirectionalAnimatedSection
              animation="fade-up"
              delay={100}
              duration={600}
            >
              <p className="TextAlignment text-sm">
                <span className="font-bold">bucketlistt</span> strictly
                adheres to the safety, ethical, and operational standards
                set by the{" "}
                <a
                  href="https://www.atoai.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold hover:text-orange-500"
                >
                  Adventure Tour Operators Association of India (ATOAI)
                </a>
                . All activities offered on our platform comply with the
                Basic Minimum Standards prescribed for adventure tourism,
                ensuring responsible practices, trained staff, certified
                equipment, and a strong commitment to environmental
                sustainability. Your safety and experience are our top
                priorities.
              </p>
            </BidirectionalAnimatedSection>
            <br />
            <BidirectionalAnimatedSection
              animation="fade-up"
              delay={100}
              duration={600}
            >
              <div className="FlexTestContainerEdit">
                <h2 className="CommonH2">Proudly Made in</h2>
                <div style={{ minWidth: "100px" }}>
                  <RotatingText
                    texts={["India", "भारत", "ભારત"]}
                    className="text-2xl md:text-4xl font-bold BrandColor"
                    rotationInterval={2000}
                  />
                </div>
              </div>
              <br />
              <div className="IndianFlagStyles">
                <img
                  src="/indian_flag.gif"
                  alt="Indian Flag"
                  className="mx-auto w-32 md:w-48 h-auto rounded-lg"
                  id="IndianFlagStyles"
                />
              </div>
            </BidirectionalAnimatedSection>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Index;
