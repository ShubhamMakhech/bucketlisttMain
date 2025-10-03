import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { DestinationCard } from "@/components/DestinationCard";
import { ExperienceCard } from "@/components/ExperienceCard";
import { TestimonialCarousel } from "@/components/TestimonialCarousel";
import AppDownloadBanner from "@/components/AppDownloadBanner";
import { SEO } from "@/components/SEO";

import { LoadingGrid } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { SimpleHorizontalScroll } from "@/components/ui/SimpleHorizontalScroll";

import { BidirectionalAnimatedSection } from "@/components/BidirectionalAnimatedSection";
import { ArrowRight, Star, Gift } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import RotatingText from "@/components/ui/RotatingText";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "../Styles/Index.css";
const Index = () => {
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="bucketlistt - Discover Adventures & Plan Your Dream Trips"
        description="Discover India's best adventure experiences with bucketlistt. Book bungee jumping, rafting, trekking & more. ATOAI certified tours with lowest prices guaranteed."
        keywords="adventure tours, travel experiences, India tourism, bungee jumping, rafting, trekking, ATOAI certified, bucket list adventures, adventure activities India"
        structuredData={homepageStructuredData}
      />
      <Header />

      <BidirectionalAnimatedSection
        animation="fade-up"
        delay={100}
        duration={800}
      >
        <div id="PaddingTopNewForOnlyMobile">
          <Hero />
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
        <section className="section-wrapper section-bg-primary PaddingSectionTop">
          <div className="container">
            <BidirectionalAnimatedSection
              animation="fade-up"
              delay={100}
              duration={600}
            >
              <div className="flex items-center gap-3 mb-6 md:mb-8">
                <h2 className="CommonH2 text-2xl md:text-3xl font-bold">
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
                    loop={true}
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
                    {destinations?.slice(0, 8).map((destination) => (
                      <SwiperSlide key={destination.id}>
                        <div
                          className="card-hover"
                          id="DestinationsSwiperCardStyles"
                        >
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
        <section className="section-wrapper section-bg-secondary PaddingSectionTop">
          <div className="container">
            <BidirectionalAnimatedSection
              animation="fade-up"
              delay={100}
              duration={600}
            >
              <div className="flex items-center gap-3 mb-6 md:mb-8">
                <h2 className="CommonH2">Top Experiences</h2>
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
                        slidesPerView: 4,
                        spaceBetween: 16,
                      },
                    }}
                    className="mySwiper"
                  >
                    {experiences?.map((experience) => (
                      <SwiperSlide key={experience.id}>
                        {/* console.log(experience.currency) */}
                        <div className="card-hover">
                          <ExperienceCard
                            id={experience.id}
                            image={getExperienceImage(experience)}
                            title={experience.title}
                            description={experience.description || undefined}
                            category={experience.category}
                            rating={Number(experience.rating)}
                            reviews={
                              experience.reviews_count?.toString() || "0"
                            }
                            price={`${
                              experience.currency === "USD"
                                ? "₹"
                                : experience.currency == "INR"
                                ? "₹"
                                : experience.currency
                            } ${experience.price}`}
                            originalPrice={
                              experience.original_price
                                ? `${
                                    experience.currency === "USD"
                                      ? "₹"
                                      : experience.currency == "INR"
                                      ? "₹"
                                      : experience.currency
                                  } ${experience.original_price}`
                                : undefined
                            }
                            duration={experience.duration || undefined}
                            groupSize={experience.group_size || undefined}
                            isSpecialOffer={
                              experience.is_special_offer || false
                            }
                          />
                        </div>
                      </SwiperSlide>
                    ))}
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

      {/* Testimonials Section */}
      <BidirectionalAnimatedSection
        animation="fade-up"
        delay={200}
        duration={700}
      >
        <TestimonialCarousel />
      </BidirectionalAnimatedSection>

      {/* App Download Banner */}
      <AppDownloadBanner />

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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 "
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
                        className={`w-12 BorderGrdientContainer h-12 md:w-16 md:h-16  mb-3 md:mb-4  ${feature.gradient} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                      >
                        <IconComponent className="h-6 w-6 md:h-8 md:w-8 text-white" />
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
                    <img
                      src="/indian_flag.gif"
                      alt="Indian Flag"
                      className="mx-auto w-32 md:w-48 h-auto rounded-lg"
                      id="IndianFlagStyles"
                    />
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
