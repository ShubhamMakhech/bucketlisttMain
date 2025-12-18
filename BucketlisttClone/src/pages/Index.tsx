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
import RotatingText from "@/components/ui/RotatingText";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, FreeMode } from "swiper/modules";
import { IoIosArrowRoundBack } from "react-icons/io";
import { IoIosArrowRoundForward } from "react-icons/io";


import "swiper/css";
import "swiper/css/free-mode";
import "../Styles/Index.css";
import "@/components/GlobalCss/TopExperiencesCards.css";
const Index = () => {
  const navigate = useNavigate();
  const experiencesSwiperRef = useRef<SwiperType | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
        <div id="PaddingTopNewForOnlyMobile">
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
        <section className="section-wrapper section-bg-primary SectionPaddingTop SectionPaddingBottom" id="ExploreIndiaTopDestinations">
          <div className="container">
            <BidirectionalAnimatedSection
              animation="fade-up"
              delay={100}
              duration={600}
            >
              <div className="HeadingHeaderCommonUsed">
                <h2 className="CommonH2">
                  Explore India's top destinations
                </h2>
              </div>
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
                        slidesPerView: 2.3,
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











      {/* ---------------------------------Top Experiences Section Starts Here --------------------------------- */}
      <BidirectionalAnimatedSection
        animation="fade-up"
        delay={200}
        duration={700}
      >
        <section id="TopExperiencesHomeSection" className="section-wrapper SecondaryBackground SectionPaddingTop SectionPaddingBottom">
          <div className="container">
            <BidirectionalAnimatedSection
              animation="fade-up"
              delay={100}
              duration={600}
            >
              <div className="HeadingHeaderCommonUsed">
                <h2 className="CommonH2">Top Experiences</h2>
                <div className="SwiperButtonsControls">
                  <button onClick={() => experiencesSwiperRef.current?.slidePrev()}>
                    <IoIosArrowRoundBack />
                  </button>
                  <button onClick={() => experiencesSwiperRef.current?.slideNext()}>
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
                    autoplay={{
                      delay: 2000,
                      disableOnInteraction: false,
                    }}
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
          </div>
        </section>
      </BidirectionalAnimatedSection>


      {/* ---------------------------------Top Experiences Section Ends Here --------------------------------- */}










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

      {/* Why Choose Us */}
      <BidirectionalAnimatedSection
        animation="fade-up"
        delay={200}
        duration={700}
      >
        <section className="section-wrapper section-bg-primary PaddingSectionTop WhyChooseUsSection">
          <div className="container">
            <BidirectionalAnimatedSection
              animation="fade-up"
              delay={100}
              duration={600}
            >
              <h2 className="CommonH2">Why Choose bucketlistt?</h2>
            </BidirectionalAnimatedSection>
            {/* <br />
<br /> */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-3 "
              id="WhyChooseUsGrid"
            >
              {[
                {
                  icon: Star,
                  gradient: "from-orange-400 to-red-500",
                  title: "Premium Adventures",
                  description:
                    "Curated experiences with certified operators and safety-first approach.",
                },
                {
                  icon: Gift,
                  gradient: "from-blue-400 to-purple-500",
                  title: "Best Value Deals",
                  description:
                    "Competitive pricing with exclusive offers and flexible booking options.",
                },
                {
                  icon: ArrowRight,
                  gradient: "from-green-400 to-teal-500",
                  title: "Seamless Booking",
                  description:
                    "Instant confirmation with free cancellation and 24/7 support.",
                },
                {
                  icon: Star,
                  gradient: "from-pink-400 to-rose-500",
                  title: "Trusted Platform",
                  description:
                    "Verified reviews and ATOAI-certified partners for safe adventures.",
                },
              ].map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <BidirectionalAnimatedSection
                    key={index}
                    animation="fade-up"
                    delay={300 + index * 100}
                    duration={600}
                  >
                    <div
                      className="text-center group md:p-0"
                      id="WhyChooseUsCard"
                    >
                      <div
                        id="WhyChooseUsCardIcon"
                        className={`w-10 BorderGrdientContainer h-10 md:w-13 md:h-13  mb-3 md:mb-4  ${feature.gradient} rounded-4xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                      >
                        <IconComponent className="h-6 w-6 md:h-6 md:w-6 text-white" />
                      </div>
                      <h3
                        className="CommonH3 text-start text_Adjust_For_Mobile
                      "
                      >
                        {feature.title}
                      </h3>
                      <p className="text-start text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </BidirectionalAnimatedSection>
                );
              })}
            </div>

            <div className="ContainerDesinsPurposeOnly MaxWidth800">
              <div className="mt-12 md:mt-16 md:space-y-5">
                <BidirectionalAnimatedSection
                  animation="fade-up"
                  delay={100}
                  duration={600}
                >
                  <h2 className="CommonH2 TextAlignment">
                    And we are ATOAI certified
                  </h2>
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
        </section>
      </BidirectionalAnimatedSection>
    </div>
  );
};

export default Index;
