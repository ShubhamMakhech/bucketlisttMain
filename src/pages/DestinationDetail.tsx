import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExperienceCard } from "@/components/ExperienceCard";
import { LazyImage } from "@/components/LazyImage";
import { DetailedItinerary } from "@/components/DetailedItinerary";
import { IoLocation } from "react-icons/io5";
import { Breadcrumb } from "@/components/Breadcrumb";

// Helper function to detect media type from URL
const getMediaType = (url: string): "video" | "image" => {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".avi", ".mov"];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some((ext) => lowerUrl.includes(ext))
    ? "video"
    : "image";
};

// Static destination media mapping with type information
type MediaItem = {
  src: string;
  type: "video" | "image";
};

const staticDestinationImages: Record<string, MediaItem[]> = {
  Darjeeling: [
    {
      src: "https://images.unsplash.com/photo-1637737118663-f1a53ee1d5a7?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      type: "image",
    },
    {
      src: "https://images.unsplash.com/photo-1544894062-f500cf4fbd2c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      type: "image",
    },
    {
      src: "https://images.unsplash.com/photo-1661970131022-714b905f7031?q=80&w=3132&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      type: "image",
    },
  ],
  Goa: [
    {
      src: "https://images.unsplash.com/photo-1496566084516-c5b96fcbd5c8?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      type: "image",
    },
    {
      src: "https://images.unsplash.com/photo-1580741186862-c5d0bf2aff33?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      type: "image",
    },
    {
      src: "https://images.unsplash.com/photo-1682743710558-b338ba285925?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      type: "image",
    },
  ],
  Jaipur: [
    {
      src: "https://prepseed.s3.ap-south-1.amazonaws.com/Jaipur.svg",
      type: "image",
    },
    {
      src: "https://images.unsplash.com/photo-1539650116574-75c0c6d73c0e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
      type: "image",
    },
    {
      src: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
      type: "image",
    },
  ],
  Kerala: [
    {
      src: "https://prepseed.s3.ap-south-1.amazonaws.com/Kerela.svg",
      type: "image",
    },
    {
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
      type: "image",
    },
    {
      src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
      type: "image",
    },
  ],
  Rishikesh: [
    {
      src: "https://s3.ap-south-1.amazonaws.com/prepseed/prod/ldoc/media/RishikeshVideo.mp4",
      type: "video",
    },
  ],
  Mysore: [
    {
      src: "https://plus.unsplash.com/premium_photo-1697730494992-7d5a0c46ea52?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      type: "image",
    },
    {
      src: "https://images.unsplash.com/photo-1698688513674-d38bea6a34c2?q=80&w=3133&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      type: "image",
    },
  ],
  Matheran: [
    {
      src: "https://images.unsplash.com/photo-1663070549709-8b524a0560e7?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      type: "image",
    },
    {
      src: "https://images.unsplash.com/photo-1590812854696-65cefa66f181?q=80&w=2108&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      type: "image",
    },
  ],
  Saputara: [
    {
      src: "https://s3.ap-south-1.amazonaws.com/prepseed/prod/ldoc/media/SaputaraHillStationImage1.jpg",
      type: "image",
    },
    {
      src: "https://s3.ap-south-1.amazonaws.com/prepseed/prod/ldoc/media/SaputaraHillStationImage2.jpg",
      type: "image",
    },
  ],
  Mandvi: [
    {
      src: "https://prepseed.s3.ap-south-1.amazonaws.com/Mandvi+Beach+(1).jpg",
      type: "image",
    },
    {
      src: "https://prepseed.s3.ap-south-1.amazonaws.com/Mandvi+Beach+(2).jpg",
      type: "image",
    },
    {
      src: "https://prepseed.s3.ap-south-1.amazonaws.com/mandvi(3).jpg",
      type: "image",
    },
  ],
  "Shivrajpur Beach": [
    {
      src: "https://prepseed.s3.ap-south-1.amazonaws.com/shivrajpur+(1).jpeg",
      type: "image",
    },
    {
      src: "https://prepseed.s3.ap-south-1.amazonaws.com/shivrajpur+(2).jpeg",
      type: "image",
    },
    {
      src: "https://prepseed.s3.ap-south-1.amazonaws.com/shivrajpur+(3).jpg",
      type: "image",
    },
  ],
  Ujjain: [
    {
      src: "https://prepseed.s3.ap-south-1.amazonaws.com/ujjain(2).jpg",
      type: "image"
    },
    {
      src: "https://prepseed.s3.ap-south-1.amazonaws.com/ujjain(3).jpg",
      type: "image"
    }
  ]
};
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
import { useState, useEffect, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = "rating" | "price_low" | "price_high" | "newest" | "name";

const DestinationDetail = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Get destination data from navigation state (if available)
  const stateDestinationData = location.state?.destinationData;
  const fromPage = location.state?.fromPage;

  // Get ID from state, fallback to undefined if not available
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [isAnimated, setIsAnimated] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Scroll to top and trigger animations when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: destination, isLoading: destinationLoading } = useQuery({
    queryKey: ["destination", name],
    queryFn: async () => {
      if (!name) throw new Error("Destination URL name is required");

      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .eq("url_name", name)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!name,
    // Use state data as initial data if available and url_name matches
    initialData:
      stateDestinationData?.url_name === name ? stateDestinationData : undefined,
    // Only fetch if we don't have state data or if the data is stale
    staleTime: stateDestinationData?.url_name === name ? 5 * 60 * 1000 : 0, // 5 minutes if we have state data
  });

  const id = destination?.id;

  // Get all media items for the destination with type information
  const getDestinationMedia = (): MediaItem[] => {
    const staticMedia = staticDestinationImages[destination?.title || ""];
    return staticMedia || [];
  };

  // Get the first video URL for the destination
  const getVideoUrl = () => {
    const media = getDestinationMedia();
    const video = media.find((item) => item.type === "video");
    return video ? video.src : null;
  };

  // Get all images for the destination
  const getImages = (): MediaItem[] => {
    return getDestinationMedia().filter((item) => item.type === "image");
  };

  // Get all videos for the destination
  const getVideos = (): MediaItem[] => {
    return getDestinationMedia().filter((item) => item.type === "video");
  };

  // Ensure first video plays when ready (for video swiper)
  useEffect(() => {
    const video = videoRef.current;
    if (video && getVideos().length > 0) {
      const playVideo = () => {
        if (video && video.paused && !video.ended) {
          video.play().catch(() => { });
        }
      };

      // Try to play immediately
      playVideo();

      // Also set up event listeners as backup
      video.addEventListener("canplay", playVideo, { once: true });
      video.addEventListener("loadeddata", playVideo, { once: true });
      video.addEventListener("canplaythrough", playVideo, { once: true });

      // Try again after short delays
      const timer1 = setTimeout(playVideo, 300);
      const timer2 = setTimeout(playVideo, 1000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        video.removeEventListener("canplay", playVideo);
        video.removeEventListener("loadeddata", playVideo);
        video.removeEventListener("canplaythrough", playVideo);
      };
    }
  }, [destination?.title]);

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
        .eq("is_active", true)
        .order("created_at", { ascending: true });

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

  // Get the image source - use static image if title matches, otherwise use database image
  const getImageSource = () => {
    const media = getDestinationMedia();
    const firstImage = media.find((item) => item.type === "image");
    return firstImage?.src || destination.image_url;
  };
  // ✅ Put this helper ABOVE your component (outside DestinationDetail)
  const playActiveSlideVideo = (swiper: any) => {
    if (!swiper?.el) return;

    // Pause + reset all videos
    swiper.el.querySelectorAll("video").forEach((v: HTMLVideoElement) => {
      v.pause();
      v.currentTime = 0;
    });

    const activeSlide = swiper.slides?.[swiper.activeIndex];
    if (!activeSlide) return;

    const video = activeSlide.querySelector("video") as HTMLVideoElement | null;

    if (video) {
      swiper.autoplay?.stop();

      // iOS-friendly
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "true");

      // Play after DOM settles
      requestAnimationFrame(() => {
        video.play().catch(() => { });
      });
    } else {
      swiper.autoplay?.start();
    }
  };

  return (
    <div className="min-h-screen bg-background">

      <br />
      <div className="MaxWidthContainer">
        <Breadcrumb
          items={[
            { label: "Destinations", href: "/destinations" },
            { label: destination.title, current: true }
          ]}
          className="hero-breadcrumb"
        />
      </div>
      {/* Split Hero Section */}
      <section className="destination-hero-container">
        <div className=" MaxWidthContainer">
          <div className="destination-hero-split">
            {/* Left Side: Minimal Text Content */}
            <div className="hero-text-side">

              <h1 className="hero-main-title">
                Discover the best things to do in {destination.title}
              </h1>
              <p className="hero-subtitle">
                Discover must-see sights, savour authentic cuisine, and experience the essence of local culture.
              </p>
            </div>

            {/* Right Side: Media Content */}
            <div className="hero-media-side">
              <div className="hero-media-wrapper">
                {getDestinationMedia().length > 0 ? (
                  <Swiper
                    modules={[Autoplay, Navigation, Pagination]}
                    spaceBetween={0}
                    slidesPerView={1}
                    autoplay={{
                      delay: 3000,
                      disableOnInteraction: false,
                    }}
                    pagination={{
                      clickable: true,
                      bulletClass: "swiper-pagination-bullet",
                      bulletActiveClass: "swiper-pagination-bullet-active",
                    }}
                    loop={getDestinationMedia().length > 1}
                    className="h-full w-full"
                    onSwiper={(swiper) => playActiveSlideVideo(swiper)}
                    onSlideChangeTransitionEnd={(swiper) => playActiveSlideVideo(swiper)}
                  >
                    {getDestinationMedia().map((media, index) => (
                      <SwiperSlide key={`${media.type}-${index}`}>
                        <div className="relative h-full w-full">
                          {media.type === "video" ? (
                            <video
                              src={media.src}
                              className="h-full w-full object-cover"
                              muted
                              playsInline
                              preload="auto"
                              controls={false}
                              disablePictureInPicture
                              loop={getDestinationMedia().length === 1}
                              onEnded={(e) => {
                                const swiperEl = e.currentTarget.closest(".swiper") as any;
                                const swiper = swiperEl?.swiper;
                                if (swiper && getDestinationMedia().length > 1) {
                                  swiper.slideNext();
                                }
                              }}
                            />
                          ) : (
                            <LazyImage
                              src={media.src}
                              alt={`${destination?.title} - View ${index + 1}`}
                              aspectRatio="aspect-auto"
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                ) : (
                  <div className="h-full w-full bg-muted flex items-center justify-center">
                    <p className="text-muted-foreground">No media available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Destination Info Section */}

      {/* <div className="features-badges-container container">
        <div className="features-badges-grid">
          {destination.best_time_to_visit && (
            <div className="feature-badge">
              <div className="feature-badge-icon">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="feature-badge-content">
                <p>Best time to visit</p>
                <p className="feature-badge-value">
                  {destination.best_time_to_visit}
                </p>
              </div>
            </div>
          )}

          {destination.recommended_duration && (
            <div className="feature-badge">
              <div className="feature-badge-icon">
                <Clock className="h-5 w-5" />
              </div>
              <div className="feature-badge-content">
                <p>Recommended duration</p>
                <p className="feature-badge-value">
                  {destination.recommended_duration}
                </p>
              </div>
            </div>
          )}

          {destination.timezone && (
            <div className="feature-badge">
              <div className="feature-badge-icon">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="feature-badge-content">
                <p>Timezone</p>
                <p className="feature-badge-value">{destination.timezone}</p>
              </div>
            </div>
          )}

          {weatherInfo && (
            <div className="feature-badge">
              <div className="feature-badge-icon">
                <Thermometer className="h-5 w-5" />
              </div>
              <div className="feature-badge-content">
                <p>Weather</p>
                <p className="feature-badge-value">
                  {weatherInfo.nov_apr?.temp} (Cool season)
                </p>
              </div>
            </div>
          )}
        </div>
      </div> */}
      <section
        className="section-wrapper  SectionPaddingTop SectionPaddingBottom MaxWidthContainer "
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
                  style={{ textTransform: "unset", margin: "10px 0px" }}
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
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                id="ExperienceCardContainerSpecificDestinationDetail"
              >
                {experiences.map((experience, index) => (
                  <div
                    key={experience.id}
                    className={`scroll-scale-in h-full ${isAnimated ? "animate" : ""}`}
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
                      index={index}
                      urlName={experience.url_name}
                    />
                  </div>
                ))}
              </div>
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
