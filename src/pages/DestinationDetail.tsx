import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExperienceCard } from "@/components/ExperienceCard";
import { LazyImage } from "@/components/LazyImage";
import { DetailedItinerary } from "@/components/DetailedItinerary";
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Thermometer,
  Calendar,
  Users,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = "rating" | "price_low" | "price_high" | "newest" | "name";

const DestinationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [isAnimated, setIsAnimated] = useState(false);

  // Scroll to top and trigger animations when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: destination, isLoading: destinationLoading } = useQuery({
    queryKey: ["destination", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const { data: experiences, isLoading: experiencesLoading } = useQuery({
    queryKey: ["destination-experiences", id, selectedCategory, sortBy],
    queryFn: async () => {
      let query = supabase
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
        .eq("destination_id", id)
        .eq("is_active", true);

      if (selectedCategory) {
        // Filter by category using the junction table
        const { data: experienceIds, error: categoryError } = await supabase
          .from("experience_categories")
          .select("experience_id")
          .eq("category_id", selectedCategory);

        if (categoryError) throw categoryError;

        const ids = experienceIds.map((item) => item.experience_id);
        if (ids.length > 0) {
          query = query.in("id", ids);
        } else {
          // No experiences found for this category
          return [];
        }
      }

      // Apply sorting
      switch (sortBy) {
        case "rating":
          query = query.order("rating", { ascending: false });
          break;
        case "price_low":
          query = query.order("price", { ascending: true });
          break;
        case "price_high":
          query = query.order("price", { ascending: false });
          break;
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        case "name":
          query = query.order("title", { ascending: true });
          break;
        default:
          query = query.order("rating", { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: attractions } = useQuery({
    queryKey: ["destination-attractions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attractions")
        .select("*")
        .eq("destination_id", id)
        .order("title");

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (destinationLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 px-4">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-64 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-48 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 px-4">
          <div className="text-center">
            <div className="scroll-fade-in animate">
              <h1 className="text-2xl font-bold mb-2">Destination not found</h1>
              <p className="text-muted-foreground">
                The destination you're looking for doesn't exist.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const weatherInfo = destination.weather_info as any;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Full Screen Image Swiper */}
      <section
        className="relative h-screen w-full container"
        id="DestinationDetailSwiper"
      >
        <Swiper
          modules={[Autoplay, Navigation, Pagination]}
          // slidesPerView={1}
          spaceBetween={20}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
          }}
          // navigation={{
          //   nextEl: '.destination-swiper-button-next',
          //   prevEl: '.destination-swiper-button-prev',
          // }}
          pagination={{
            clickable: true,
            bulletClass: "swiper-pagination-bullet",
            bulletActiveClass: "swiper-pagination-bullet-active",
          }}
          loop={true}
          className="h-full w-full"
        >
          <SwiperSlide>
            <div className="relative h-full w-full SwiperSlideBorderRadius">
              <LazyImage
                src={destination.image_url || ""}
                alt={destination.title}
                aspectRatio="aspect-auto"
                className="h-full w-full object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40"></div>
              {/* Back Button */}
              <div className="absolute top-4 left-4 z-10">
                {/* <Button
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button> */}
              </div>
              {/* Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                <h2 className="CommonH2 text-white">{destination.title}</h2>
                <p className="text-white">{destination.subtitle}</p>
              </div>
            </div>
          </SwiperSlide>

          {/* Additional slides can be added here if you have multiple images */}
          <SwiperSlide>
            <div className="relative h-full w-full SwiperSlideBorderRadius">
              <LazyImage
                src={destination.image_url || ""}
                alt={destination.title}
                aspectRatio="aspect-auto"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40"></div>
              {/* <div className="absolute top-4 left-4 z-10">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </div> */}
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                <h2 className="CommonH2 text-white">{destination.title}</h2>
                <p className="text-white">{destination.subtitle}</p>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>

        {/* Custom Navigation Buttons */}
        {/* <div className="destination-swiper-button-prev destination-nav-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="destination-swiper-button-next destination-nav-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div> */}
      </section>

      {/* Destination Info Section */}
      <section
        className="section-wrapper section-bg-primary"
        style={{ marginTop: "-20px", paddingBottom: "10px" }}
      >
        <div className="container">
          <div
            className={`scroll-fade-in ${isAnimated ? "animate" : ""}`}
            style={{ animationDelay: "0.1s" }}
          >
            <div className="space-y-6">
              <div>
                {/* <h1 className="CommonH1 textStart">About {destination.title}</h1> */}
                {/* {destination.description && (
                  <p className="text-sm textStart">
                    {destination.description}
                  </p>
                )} */}
                {/* <p style={{ textAlign: "start", }} >Rishikesh is where adventure meets spirituality—rafting, bungee jumping, yoga, and the sacred Triveni Sangam all in one unforgettable destination!</p> */}
                <p
                  style={{
                    textAlign: "start",
                    fontSize: "14px",
                    marginTop: "-5px",
                  }}
                >
                  Rishikesh is where adventure meets spirituality—rafting,
                  bungee jumping, yoga, and the sacred Triveni Sangam all in one
                  unforgettable destination!
                </p>
                {/* <br /> */}
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 container">
        {destination.best_time_to_visit && (
          <div className="flex items-center gap-3  bg-white dark:bg-gray-800 rounded-lg shadow-sm CardStyles">
            <Calendar className="h-6 w-6 text-brand-primary flex-shrink-0 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground textStart md:textsm">
                Best time to visit
              </p>
              <p className="font-medium textStart adjustFontSize">{destination.best_time_to_visit}</p>
            </div>
          </div>
        )}

        {destination.recommended_duration && (
          <div className="flex items-center gap-3  bg-white dark:bg-gray-800 rounded-lg shadow-sm CardStyles">
            <Clock className="h-6 w-6 text-brand-primary flex-shrink-0 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground textStart">
                Recommended duration
              </p>
              <p className="font-medium textStart adjustFontSize">{destination.recommended_duration}</p>
            </div>
          </div>
        )}

        {destination.timezone && (
          <div className="flex items-center gap-3  bg-white dark:bg-gray-800 rounded-lg shadow-sm CardStyles">
            <MapPin className="h-6 w-6 text-brand-primary flex-shrink-0 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground textStart">Timezone</p>
              <p className="font-medium textStart adjustFontSize">{destination.timezone}</p>
            </div>
          </div>
        )}

        {weatherInfo && (
          <div className="flex items-center gap-3  bg-white dark:bg-gray-800 rounded-lg shadow-sm CardStyles">
            <Thermometer className="h-6 w-6 text-brand-primary flex-shrink-0 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground textStart">Weather</p>
              <p className="font-medium textStart adjustFontSize">
                {weatherInfo.nov_apr?.temp} (Cool season)
              </p>
            </div>
          </div>
        )}
      </div>
      <section
        className="section-wrapper section-bg-primary"
        id="TopActivitiesToDo"
      >
        <div className="container">
          {/* Category Filters and Sorting */}
          <div
            className={`mb-2 scroll-fade-in ${isAnimated ? "animate" : ""}`}
            style={{ animationDelay: "0.4s" }}
          >
            <div className="FlexContainerChange ">
              <div className="flex items-center gap-4 HeadingADjustMargin">
                {/* <Filter className="h-5 w-5 text-brand-primary" /> */}
                <h2
                  className="CommonH2"
                  style={{ textTransform: "unset", marginBottom: "10px" }}
                >
                  Top activities to do in {destination.title}
                </h2>
              </div>

              {/* <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest rated</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}
            </div>

            {/* <div className="flex flex-wrap gap-3 mb-8">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
                className={selectedCategory === null ? "bg-brand-primary hover:bg-brand-primary-dark" : ""}
              >
                All
              </Button>
              {categories?.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id ? "bg-brand-primary hover:bg-brand-primary-dark" : ""}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </Button>
              ))}
            </div> */}
          </div>

          {/* Experiences - Desktop Swiper / Mobile Static Grid */}
          <div
            className={`scroll-fade-in ${isAnimated ? "animate" : ""}`}
            style={{ animationDelay: "0.5s" }}
          >
            {experiencesLoading ? (
              <div className="text-center py-12">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-muted rounded w-48 mx-auto"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="space-y-3">
                        <div className="h-48 bg-muted rounded-lg"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : experiences && experiences.length > 0 ? (
              <>
                {/* Desktop Swiper - Hidden on mobile */}
                <div className="hidden lg:block relative">
                  <Swiper
                    modules={[Navigation]}
                    navigation={{
                      nextEl: ".experiences-swiper-button-next",
                      prevEl: ".experiences-swiper-button-prev",
                    }}
                    breakpoints={{
                      1024: {
                        slidesPerView: 4,
                        spaceBetween: 24,
                      },
                    }}
                    className="experiences-swiper"
                  >
                    {experiences.map((experience, index) => (
                      <SwiperSlide key={experience.id}>
                        <div
                          className={`scroll-scale-in ${isAnimated ? "animate" : ""
                            }`}
                          style={{ animationDelay: `${0.6 + index * 0.05}s` }}

                        >
                          <ExperienceCard
                            id={experience.id}
                            image={experience.image_url || ""}
                            title={experience.title}
                            categories={
                              experience.experience_categories?.map(
                                (ec) => ec.categories
                              ) || []
                            }
                            rating={Number(experience.rating)}
                            reviews={
                              experience.reviews_count?.toString() || "0"
                            }
                            price={`${experience.currency === "USD"
                              ? "₹"
                              : experience.currency == "INR"
                                ? "₹"
                                : experience.currency
                              } ${experience.price}`}
                            originalPrice={
                              experience.original_price
                                ? `${experience.currency === "USD"
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
                            index={index}
                            description={experience.description || undefined}
                          />
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>

                  {/* Custom Navigation Buttons for Desktop */}
                  <div className="experiences-swiper-button-prev experiences-nav-btn">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15 18L9 12L15 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="experiences-swiper-button-next experiences-nav-btn">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 18L15 12L9 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* Mobile Static Grid - Hidden on desktop */}
                <div className="lg:hidden grid grid-cols-1 gap-6">
                  {experiences.map((experience, index) => (
                    <div
                      key={experience.id}
                      className={`scroll-scale-in ${isAnimated ? "animate" : ""
                        }`}
                      style={{ animationDelay: `${0.6 + index * 0.05}s` }}
                      id="ExperienceCardContainerSpecificDestinationDetail"
                    >
                      <ExperienceCard
                        id={experience.id}
                        image={experience.image_url || ""}
                        title={experience.title}
                        categories={
                          experience.experience_categories?.map(
                            (ec) => ec.categories
                          ) || []
                        }
                        rating={Number(experience.rating)}
                        reviews={experience.reviews_count?.toString() || "0"}
                        price={`${experience.currency === "USD"
                          ? "₹"
                          : experience.currency == "INR"
                            ? "₹"
                            : experience.currency
                          } ${experience.price}`}
                        originalPrice={
                          experience.original_price
                            ? `${experience.currency === "USD"
                              ? "₹"
                              : experience.currency == "INR"
                                ? "₹"
                                : experience.currency
                            } ${experience.original_price}`
                            : undefined
                        }
                        duration={experience.duration || undefined}
                        groupSize={experience.group_size || undefined}
                        isSpecialOffer={experience.is_special_offer || false}
                        index={index}
                        description={experience.description || undefined}
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div
                  className={`scroll-fade-in ${isAnimated ? "animate" : ""}`}
                  style={{ animationDelay: "0.6s" }}
                >
                  <h2 className="text-muted-foreground text-4xl">
                    {/* No activities found for this category. But we'll surely add
                    some later. */}
                    Coming soon...
                  </h2>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="IternarySectionContainer">
        <div className="container">
          <div
            className={`scroll-fade-in ${isAnimated ? "animate" : ""}`}
            style={{ animationDelay: "0.7s" }}
          >
            <h2 className="CommonH2 text-center mb-8">
              Choose Your Perfect Itinerary
            </h2>
            <div className="itinerary-cards-grid">
              {/* 1 Day Itinerary Card */}
              <div className="itinerary-card itinerary-card-1day">
                <div className="itinerary-card-overlay">
                  <span className="itinerary-card-number">1</span>
                </div>
                <div className="itinerary-card-content">
                  <h3 className="itinerary-card-title">1 Day Trip</h3>
                  <p className="itinerary-card-description">
                    Perfect for a quick getaway with essential experiences
                  </p>
                </div>
              </div>

              {/* 2 Days Itinerary Card */}
              <div className="itinerary-card itinerary-card-2day">
                <div className="itinerary-card-overlay">
                  <span className="itinerary-card-number">2</span>
                </div>
                <div className="itinerary-card-content">
                  <h3 className="itinerary-card-title">2 Days Trip</h3>
                  <p className="itinerary-card-description">
                    Ideal weekend escape with balanced activities
                  </p>
                </div>
              </div>

              {/* 5 Days Itinerary Card */}
              <div className="itinerary-card itinerary-card-5day">
                <div className="itinerary-card-overlay">
                  <span className="itinerary-card-number">5</span>
                </div>
                <div className="itinerary-card-content">
                  <h3 className="itinerary-card-title">5 Days Trip</h3>
                  <p className="itinerary-card-description">
                    Complete exploration with all major attractions
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
      {/* Must-Visit Attractions */}
      {/* {attractions && attractions.length > 0 && (
        <section className="section-wrapper section-bg-secondary">
          <div className="container">
            <div
              className={`scroll-fade-in ${isAnimated ? "animate" : ""}`}
              style={{ animationDelay: "0.2s" }}
            >
              <h2 className="text-2xl font-bold mb-6">
                Must-visit tourist spots
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {attractions.map((attraction, index) => (
                  <div
                    key={attraction.id}
                    className={`group cursor-pointer scroll-scale-in ${isAnimated ? "animate" : ""
                      }`}
                    style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                  >
                    <LazyImage
                      src={attraction.image_url || ""}
                      alt={attraction.title}
                      aspectRatio="aspect-[4/3]"
                      className="rounded-lg mb-3 group-hover:scale-105 transition-transform duration-300"
                    />
                    <h3 className="font-semibold mb-1">{attraction.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {attraction.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )} */}

      {/* Detailed Itinerary */}
      {/* <section className="section-wrapper section-bg-tertiary">
        <div className="container">
          <div
            className={`scroll-fade-in ${isAnimated ? "animate" : ""}`}
            style={{ animationDelay: "0.3s" }}
          >
            <DetailedItinerary destinationName={destination.title} />
          </div>
        </div>
      </section> */}

      {/* Things to Do Section */}
    </div>
  );
};

export default DestinationDetail;
