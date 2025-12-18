// @ts-nocheck
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExperienceCard } from "@/components/ExperienceCard";
import { LazyImage } from "@/components/LazyImage";
import { DetailedItinerary } from "@/components/DetailedItinerary";
import { IoLocation } from "react-icons/io5";
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
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { DestinationImagesAndVideoData } from "@/components/DestinationImagesAndVideo";
import "@/components/GlobalCss/DestinationsSlider.css";
import "@/components/GlobalCss/TopExperiencesCards.css";
import { useState, useEffect, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "@/components/GlobalCss/itenary.css";
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
      type: "image",
    },
    {
      src: "https://prepseed.s3.ap-south-1.amazonaws.com/ujjain(3).jpg",
      type: "image",
    },
  ],
};

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
  const swiperRef = useRef<any>(null);
  const videoRefs = useRef<Record<number, HTMLVideoElement>>({});

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
      stateDestinationData?.url_name === name
        ? stateDestinationData
        : undefined,
    // Only fetch if we don't have state data or if the data is stale
    staleTime: stateDestinationData?.url_name === name ? 5 * 60 * 1000 : 0, // 5 minutes if we have state data
  });

  // Get destination data from DestinationImagesAndVideoData
  const getDestinationData = () => {
    if (!destination?.title) return null;
    return (
      DestinationImagesAndVideoData[
        destination.title as keyof typeof DestinationImagesAndVideoData
      ] || null
    );
  };

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

  // Helper function to get subtitle
  const getDestinationSubtitle = (destinationTitle: string) => {
    const destinationData =
      DestinationImagesAndVideoData[
        destinationTitle as keyof typeof DestinationImagesAndVideoData
      ];
    return destinationData?.subtitle || destination?.subtitle || "Explore";
  };

  // Handle button click - scroll to next section
  const handleButtonClick = () => {
    const container = document.querySelector(".destinations-slider-container");
    if (container) {
      let nextSection = container.nextElementSibling;
      if (!nextSection) {
        const allSections = document.querySelectorAll(
          'section, .section-wrapper, [class*="section"]'
        );
        const containerIndex = Array.from(allSections).findIndex(
          (el) => el.contains(container) || container.contains(el)
        );
        if (containerIndex !== -1 && containerIndex < allSections.length - 1) {
          nextSection = allSections[containerIndex + 1];
        }
      }
      if (nextSection) {
        nextSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  };

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

      // Play the video for the current slide
      const currentVideo = videoRefs.current[currentIndex];
      if (currentVideo) {
        if (currentVideo.ended) {
          currentVideo.currentTime = 0;
        }
        const playVideo = () => {
          if (currentVideo.paused || currentVideo.ended) {
            currentVideo.play().catch(() => {
              setTimeout(() => {
                if (currentVideo.paused || currentVideo.ended) {
                  currentVideo.currentTime = 0;
                  currentVideo.play().catch(() => {});
                }
              }, 200);
            });
          }
        };
        playVideo();
        setTimeout(playVideo, 100);
      }
    };

    swiper.on("slideChange", handleSlideChange);
    setTimeout(() => {
      handleSlideChange();
    }, 300);

    return () => {
      swiper.off("slideChange", handleSlideChange);
    };
  }, [destination?.title]);

  // Ensure first video plays when ready (for video swiper)
  useEffect(() => {
    const video = videoRef.current;
    if (video && getVideos().length > 0) {
      const playVideo = () => {
        if (video && video.paused && !video.ended) {
          video.play().catch(() => {});
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

  // Fetch all activities for experiences to get discounted prices
  const { data: allActivities } = useQuery({
    queryKey: ["all-experiences-activities", experiences?.map((e) => e.id)],
    queryFn: async () => {
      if (!experiences || experiences.length === 0) return {};

      const experienceIds = experiences.map((e) => e.id);
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

  // Get destination data from DestinationImagesAndVideoData
  const destinationData = getDestinationData();
  const destinationTitle = destination?.title || "";
  const destinationSubtitle = getDestinationSubtitle(destinationTitle);

  // Get all media items (videos and photos) from DestinationImagesAndVideoData
  const allMediaItems: Array<{
    src: string;
    content?: string;
    type: "video" | "photo";
  }> = [];
  if (destinationData) {
    if (destinationData.videos && destinationData.videos.length > 0) {
      destinationData.videos.forEach((video: any) => {
        allMediaItems.push({ ...video, type: "video" });
      });
    }
    if (destinationData.photos && destinationData.photos.length > 0) {
      destinationData.photos.forEach((photo: any) => {
        allMediaItems.push({ ...photo, type: "photo" });
      });
    }
  }

  // If no data in DestinationImagesAndVideoData, fallback to static data
  const mediaItems =
    allMediaItems.length > 0
      ? allMediaItems
      : getVideos()
          .map((v) => ({ src: v.src, type: "video" as const }))
          .concat(
            getImages().map((i) => ({ src: i.src, type: "photo" as const }))
          );

  return (
    <div className="min-h-screen bg-background">
      {/* New Design Swiper - Left Text, Right Media */}
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
          pagination={
            mediaItems.length > 1
              ? {
                  clickable: true,
                  bulletClass: "destinations-pagination-bullet",
                  bulletActiveClass: "destinations-pagination-bullet-active",
                }
              : false
          }
          autoplay={
            mediaItems.length > 1
              ? {
                  delay: 5000,
                  disableOnInteraction: false,
                }
              : false
          }
          loop={mediaItems.length > 1}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          className="destinations-swiper"
        >
          {mediaItems.map((media, index) => {
            const isVideo = media.type === "video";
            const isPhoto = media.type === "photo";

            return (
              <SwiperSlide key={`media-${index}`}>
                <div className="destinations-slide">
                  <div className="destinations-slide-content MaxWidthContainer">
                    {/* Left Side - Text Content */}
                    <div className="destinations-text-section">
                      <div className="destinations-text-wrapper">
                        <h2 className="RairBigHeading textAlignStart ColorWhite">
                          {destinationTitle}
                        </h2>
                        <p className="destinations-tagline textAlignStart ColorWhite">
                          {destinationSubtitle}
                        </p>
                        {media.content && (
                          <p className="destinations-media-content textAlignStart SecondaryColorText">
                            <b>{media.content}</b>
                          </p>
                        )}
                        <Button
                          className="destinations-cta-button"
                          onClick={handleButtonClick}
                        >
                          Explore {destinationTitle}
                          <ChevronRight className="destinations-button-icon" />
                        </Button>
                      </div>
                    </div>

                    {/* Right Side - Image/Video with Clip Path */}
                    <div className="destinations-image-section">
                      <div className="destinations-image-wrapper">
                        {isVideo ? (
                          <video
                            ref={(el) => {
                              if (el) {
                                videoRefs.current[index] = el;
                              }
                            }}
                            src={media.src}
                            className="destinations-image"
                            autoPlay
                            loop
                            muted
                            playsInline
                            webkit-playsinline="true"
                            preload="auto"
                            onLoadedData={(e) => {
                              const video = e.currentTarget;
                              video.play().catch(() => {});
                            }}
                            onLoadedMetadata={(e) => {
                              const video = e.currentTarget;
                              video.play().catch(() => {});
                            }}
                            onCanPlay={(e) => {
                              const video = e.currentTarget;
                              video.play().catch(() => {});
                            }}
                            onCanPlayThrough={(e) => {
                              const video = e.currentTarget;
                              video.play().catch(() => {});
                            }}
                            onEnded={(e) => {
                              const video = e.currentTarget;
                              video.currentTime = 0;
                              requestAnimationFrame(() => {
                                video.play().catch(() => {
                                  setTimeout(() => {
                                    video.currentTime = 0;
                                    video.play().catch(() => {});
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
                              const video = e.currentTarget;
                              if (!video.ended && video.readyState >= 3) {
                                setTimeout(() => {
                                  if (video.paused && !video.ended) {
                                    video.play().catch(() => {});
                                  }
                                }, 100);
                              }
                            }}
                            onTimeUpdate={(e) => {
                              const video = e.currentTarget;
                              if (
                                video.duration &&
                                video.currentTime >= video.duration - 0.1
                              ) {
                                video.currentTime = 0;
                              }
                              if (
                                video.paused &&
                                !video.ended &&
                                video.readyState >= 3
                              ) {
                                video.play().catch(() => {});
                              }
                            }}
                            onWaiting={(e) => {
                              const video = e.currentTarget;
                              const resumeWhenReady = () => {
                                if (video.readyState >= 3) {
                                  if (video.paused) {
                                    video.play().catch(() => {});
                                  }
                                } else {
                                  setTimeout(resumeWhenReady, 100);
                                }
                              };
                              setTimeout(resumeWhenReady, 100);
                            }}
                            onStalled={(e) => {
                              const video = e.currentTarget;
                              setTimeout(() => {
                                if (video.paused && !video.ended) {
                                  video.currentTime = Math.max(
                                    0,
                                    video.currentTime - 0.1
                                  );
                                  video.play().catch(() => {});
                                }
                              }, 200);
                            }}
                            onSeeking={(e) => {
                              const video = e.currentTarget;
                              if (video.paused && !video.ended) {
                                video.play().catch(() => {});
                              }
                            }}
                            onSeeked={(e) => {
                              const video = e.currentTarget;
                              if (video.paused && !video.ended) {
                                video.play().catch(() => {});
                              }
                            }}
                          />
                        ) : isPhoto ? (
                          <img
                            src={media.src}
                            alt={destinationTitle}
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

        {/* Navigation Buttons - Only show if multiple media items */}
        {mediaItems.length > 1 && (
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

      {/* ------------------------ Destination Activities To Do Section-------------------------------- */}

      <section className="SecondaryBackground" id="TopActivitiesToDo">
        <div className="MaxWidthContainer SectionPaddingTop SectionPaddingBottom">
          {/* Category Filters and Sorting */}
          <div
            className={`mb-2 scroll-fade-in ${isAnimated ? "animate" : ""}`}
            style={{ animationDelay: "0.4s" }}
          >
            <div className="FlexContainerChange ">
              <div className="flex items-center gap-4 HeadingADjustMargin">
                {/* <Filter className="h-5 w-5 text-brand-primary" /> */}
                <div className="SectionHeading">
                  Top activities to do in {destination.title}
                </div>
              </div>
            </div>
          </div>

          {/* Experiences - Desktop Swiper / Mobile Static Grid */}
          <div
            className={`scroll-fade-in ${
              isAnimated ? "animate" : ""
            } MarginTopLarge`}
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
                        slidesPerView: 3,
                        spaceBetween: 24,
                      },
                    }}
                    className="experiences-swiper"
                  >
                    {experiences.map((experience, index) => {
                      const handleCardClick = () => {
                        const experienceName =
                          experience.url_name ||
                          experience.title
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
                              image: experience.image_url,
                            },
                            fromPage: "destination-detail-card",
                            timestamp: Date.now(),
                          },
                        });
                      };

                      // Get image
                      const displayImage =
                        experience.image_url || "/placeholder.svg";

                      // Format currency helper function
                      const formatCurrency = (amount: any) => {
                        if (!amount || amount === 0 || isNaN(amount))
                          return "₹0";
                        const numAmount =
                          typeof amount === "number"
                            ? amount
                            : parseFloat(amount);
                        if (isNaN(numAmount)) return "₹0";
                        const currency = experience.currency || "INR";
                        return currency === "USD"
                          ? `$${numAmount.toLocaleString("en-US", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}`
                          : `₹${numAmount.toLocaleString("en-IN", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}`;
                      };

                      // Get activity data for this experience to check discounted price
                      const activityData = allActivities?.[experience.id];
                      const activityDiscountedPrice =
                        activityData?.discounted_price;
                      const activityPrice = activityData?.price;

                      // Determine original and discounted prices
                      const originalPrice =
                        activityPrice || experience.price || 0;
                      const experienceOriginalPrice = experience.original_price;
                      const experiencePrice = experience.price;

                      // Calculate discounted price (activity level takes priority)
                      const discountedPrice =
                        activityDiscountedPrice &&
                        activityDiscountedPrice !== activityPrice
                          ? activityDiscountedPrice
                          : experienceOriginalPrice &&
                            experienceOriginalPrice !== experiencePrice
                          ? experiencePrice
                          : null;

                      // Final price to display
                      const finalPrice = discountedPrice || originalPrice;

                      // Calculate discount percentage
                      const calculateDiscountPercentage = () => {
                        if (
                          !discountedPrice ||
                          discountedPrice === originalPrice
                        )
                          return 0;
                        return Math.round(
                          ((originalPrice - discountedPrice) / originalPrice) *
                            100
                        );
                      };

                      const discountPercentage = calculateDiscountPercentage();
                      const hasDiscount = discountPercentage > 0;

                      // Format prices for display
                      const displayPrice = formatCurrency(finalPrice);
                      const displayOriginalPrice = hasDiscount
                        ? formatCurrency(originalPrice)
                        : null;

                      // Get description overview
                      const overview = experience.description
                        ? experience.description
                            .replace(/<[^>]*>/g, "")
                            .split(" ")
                            .slice(0, 10)
                            .join(" ") + "..."
                        : "";

                      return (
                        <SwiperSlide key={experience.id}>
                          <div
                            className={`scroll-scale-in ${
                              isAnimated ? "animate" : ""
                            }`}
                            style={{ animationDelay: `${0.6 + index * 0.05}s` }}
                          >
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
                                    <span className="rating-value">
                                      {Number(experience.rating).toFixed(1)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="destination-card-content">
                                <h3 className="destination-card-title">
                                  {experience.title}
                                </h3>
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
                                          <div className="destination-card-price-label">
                                            From
                                          </div>
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
                                        <div className="destination-card-price-label">
                                          From
                                        </div>
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
                          </div>
                        </SwiperSlide>
                      );
                    })}
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
                  {experiences.map((experience, index) => {
                    const handleCardClick = () => {
                      const experienceName =
                        experience.url_name ||
                        experience.title
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
                            image: experience.image_url,
                          },
                          fromPage: "destination-detail-card",
                          timestamp: Date.now(),
                        },
                      });
                    };

                    // Get image
                    const displayImage =
                      experience.image_url || "/placeholder.svg";

                    // Format currency helper function
                    const formatCurrency = (amount: any) => {
                      if (!amount || amount === 0 || isNaN(amount)) return "₹0";
                      const numAmount =
                        typeof amount === "number"
                          ? amount
                          : parseFloat(amount);
                      if (isNaN(numAmount)) return "₹0";
                      const currency = experience.currency || "INR";
                      return currency === "USD"
                        ? `$${numAmount.toLocaleString("en-US", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}`
                        : `₹${numAmount.toLocaleString("en-IN", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}`;
                    };

                    // Get activity data for this experience to check discounted price
                    const activityData = allActivities?.[experience.id];
                    const activityDiscountedPrice =
                      activityData?.discounted_price;
                    const activityPrice = activityData?.price;

                    // Determine original and discounted prices
                    const originalPrice =
                      activityPrice || experience.price || 0;
                    const experienceOriginalPrice = experience.original_price;
                    const experiencePrice = experience.price;

                    // Calculate discounted price (activity level takes priority)
                    const discountedPrice =
                      activityDiscountedPrice &&
                      activityDiscountedPrice !== activityPrice
                        ? activityDiscountedPrice
                        : experienceOriginalPrice &&
                          experienceOriginalPrice !== experiencePrice
                        ? experiencePrice
                        : null;

                    // Final price to display
                    const finalPrice = discountedPrice || originalPrice;

                    // Calculate discount percentage
                    const calculateDiscountPercentage = () => {
                      if (!discountedPrice || discountedPrice === originalPrice)
                        return 0;
                      return Math.round(
                        ((originalPrice - discountedPrice) / originalPrice) *
                          100
                      );
                    };

                    const discountPercentage = calculateDiscountPercentage();
                    const hasDiscount = discountPercentage > 0;

                    // Format prices for display
                    const displayPrice = formatCurrency(finalPrice);
                    const displayOriginalPrice = hasDiscount
                      ? formatCurrency(originalPrice)
                      : null;

                    // Get description overview
                    const overview = experience.description
                      ? experience.description
                          .replace(/<[^>]*>/g, "")
                          .split(" ")
                          .slice(0, 10)
                          .join(" ") + "..."
                      : "";

                    return (
                      <div
                        key={experience.id}
                        className={`scroll-scale-in ${
                          isAnimated ? "animate" : ""
                        }`}
                        style={{ animationDelay: `${0.6 + index * 0.05}s` }}
                      >
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
                                <span className="rating-value">
                                  {Number(experience.rating).toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="destination-card-content">
                            <h3 className="destination-card-title">
                              {experience.title}
                            </h3>
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
                                      <div className="destination-card-price-label">
                                        From
                                      </div>
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
                                    <div className="destination-card-price-label">
                                      From
                                    </div>
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
                      </div>
                    );
                  })}
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

      {/* ------------------------ Destination Itinerary Section ends here-------------------------------- */}

      <section className="destinations-itinerary-section  SectionPaddingTop SectionPaddingBottom">
        <div className="destinations-itinerary-container MaxWidthContainer">
          <div className="SectionHeading">Choose Your Perfect Itinerary</div>
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
