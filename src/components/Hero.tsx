import { Search, MapPin, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createPortal } from "react-dom";
import "../Styles/HeroHome.css";
export function Hero() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [videoScale, setVideoScale] = useState(1.2);
  const [scrollZoomScale, setScrollZoomScale] = useState(1);
  const [scrollTranslateY, setScrollTranslateY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["search-suggestions", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.length < 2)
        return { destinations: [], experiences: [] };

      const [destinationsResponse, experiencesResponse] = await Promise.all([
        supabase
          .from("destinations")
          .select("id, title, subtitle")
          .eq("is_active", true)
          .or(`title.ilike.%${searchQuery}%,subtitle.ilike.%${searchQuery}%`)
          .limit(3),
        supabase
          .from("experiences")
          .select("id, title, category, location")
          .eq("is_active", true)
          .or(
            `title.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`
          )
          .limit(3),
      ]);

      return {
        destinations: destinationsResponse.data || [],
        experiences: experiencesResponse.data || [],
      };
    },
    enabled: searchQuery.length >= 2,
  });

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 768);
      }
    };

    const updateVideoScale = () => {
      if (typeof window !== "undefined") {
        const aspectRatio = window.innerWidth / window.innerHeight;
        const videoAspectRatio = 16 / 9;

        if (aspectRatio < videoAspectRatio) {
          // Portrait or narrow screen - scale based on height
          setVideoScale(videoAspectRatio / aspectRatio);
        } else {
          // Landscape or wide screen - minimal scale
          setVideoScale(1.2);
        }
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    const updateDropdownPosition = () => {
      if (searchContainerRef.current) {
        const rect = searchContainerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    const handleScroll = () => {
      if (showDropdown) {
        updateDropdownPosition();
      }

      // Calculate parallax effect based on scroll position
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      // Calculate scroll progress (0 to 1) within the hero section
      const scrollProgress = Math.min(scrollY / windowHeight, 1);

      // Enhanced parallax zoom effect: starts at 1 and zooms in to 2.2 as user scrolls
      // This creates a more dramatic parallax effect
      const zoomScale = 1 + scrollProgress * 1.2;
      setScrollZoomScale(zoomScale);

      // Add subtle translate effect for more dynamic parallax
      // Video moves up slightly as user scrolls down
      const translateY = scrollProgress * 50; // Move up to 50px
      setScrollTranslateY(translateY);
    };

    const handleResize = () => {
      if (showDropdown) {
        updateDropdownPosition();
      }
      updateVideoScale();
      checkMobile();
    };

    // Initial setup
    checkMobile();
    updateVideoScale();

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [showDropdown]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowDropdown(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    const shouldShow = value.length >= 2;
    setShowDropdown(shouldShow);

    if (shouldShow && searchContainerRef.current) {
      const rect = searchContainerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowDropdown(false);
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  const hasResults =
    suggestions &&
    (suggestions.destinations.length > 0 || suggestions.experiences.length > 0);

  return (
    <section id="HeroVideoContainer" className="relative h-screen flex items-center justify-center overflow-hidden -mt-16 ">
      {/* Background - Video for Both Desktop and Mobile */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden parallax-container" >
        {/* YouTube Video Background for all devices */}
        <div

          className="absolute inset-0 w-full h-full"
          style={{
            background: "linear-gradient(135deg, hsl(var(--gradient-secondary-start)) 0%, hsl(var(--gradient-secondary-end)) 100%)", // Fallback gradient
          }}
        >
          <video
            src="https://prepseed.s3.ap-south-1.amazonaws.com/Hero+page+video+-+draft+(5)+(1).mp4"
            autoPlay
            muted
            loop
            playsInline
            webkit-playsinline="true"
            controls={false}
            disablePictureInPicture
            className="absolute top-1/2 left-1/2 pointer-events-none transition-transform duration-75 ease-out parallax-video"
            style={{
              transform: `translate(-50%, calc(-50% + ${scrollTranslateY}px)) scale(${videoScale * scrollZoomScale})`,
              transformOrigin: "center center",
              // width: isMobile ? "100vw" : "100%",
              // height: isMobile ? "100vh" : "100%",
              // minWidth: isMobile ? "100vw" : "100%",
              // minHeight: isMobile ? "100vh" : "100%",
              objectFit: "cover"
            }}
          />
          {/* <iframe
            src="https://prepseed.s3.ap-south-1.amazonaws.com/Hero+page+video+-+draft+(5)+(1).mp4"
            title="Background Video"
            className="absolute top-1/2 left-1/2 pointer-events-none transition-transform duration-75 ease-out"
            style={{
              transform: `translate(-50%, -50%) scale(${videoScale * scrollZoomScale
                })`,
              transformOrigin: "center center",
              width: isMobile ? "100vw" : "100%",
              height: isMobile ? "100vh" : "100%",
              minWidth: isMobile ? "100vw" : "100%",
              minHeight: isMobile ? "100vh" : "100%",
            }}
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
          /> */}
        </div>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40 z-10" />

        {/* Top fading shadow */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 via-black/30 to-transparent z-15" />

        {/* Bottom fading shadow */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 via-black/30 to-transparent z-15" />
      </div>

      {/* Content - Perfectly centered */}
      <div id="MobileChangeAlignment" className="relative max-w-7xl z-20 w-full px-4 text-center flex flex-col items-center justify-center">
        <div className=" MobileChangeAlignmentContainer">
          {/* Main Heading */}
          <div>
            <h1 id="MobileTextFontSize" className={`CommonH1  text-white leading-tight mb-4 ${isMobile ? "text-start" : ""}`}>
              India's best experiences  curated just for you
              {/* <br /> */}

            </h1>
          </div>

          {/* Search Bar */}
          <div
            className="MaxVideoWidth"
            // className={`w-full mx-auto relative z-30 ${isMobile ? "px-6 max-w-sm" : "px-4 max-w-2xl"
            //   }`}
            id="SearchBarAdjustContainer"
            ref={dropdownRef}
          >
            <form onSubmit={handleSearch}>
              <div className="relative" ref={searchContainerRef}>
                <div className={`flex items-stretch bg-white/95 backdrop-blur-sm shadow-2xl transition-all duration-300 ${isMobile
                  ? "flex-col rounded-0xl p-0 gap-4 border border-white/20"
                  : "flex-row rounded-lg p-2 gap-2 sm:gap-0"
                  }`}>
                  <div className={`flex items-center flex-1 ${isMobile
                    ? "px-4 py-1 bg-gray-50/80 border border-gray-200/50"
                    : "px-4 py-2 sm:py-0"
                    }`}>
                    <Search id="SearchBarAdjustContainerIcon" className={`text-gray-400 mr-3 flex-shrink-0  ${isMobile ? "h-6 w-6" : "h-5 w-5"
                      }`} />
                    <Input
                      placeholder={isMobile ? "Search for experiences and cities..." : "Search for experiences and cities..."}
                      value={searchQuery}
                      onChange={handleInputChange}
                      onFocus={() => {
                        if (searchQuery.length >= 2) {
                          setShowDropdown(true);
                          if (searchContainerRef.current) {
                            const rect =
                              searchContainerRef.current.getBoundingClientRect();
                            setDropdownPosition({
                              top: rect.bottom + 8,
                              left: rect.left,
                              width: rect.width,
                            });
                          }
                        }
                      }}
                      className={`border-0 bg-transparent text-gray-800 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 font-medium !border-none !outline-none w-full ${isMobile ? " py-1" : "text-base"
                        }`}
                    />
                  </div>
                  {/* <Button
                    type="submit"
                    size={isMobile ? "lg" : "lg"}
                    className={`bg-gradient-to-r from-brand-primary to-brand-primary-light hover:from-brand-primary-dark hover:to-brand-primary text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${isMobile
                      ? "rounded-xl py-4 px-6 text-lg w-full"
                      : "rounded-md px-6 py-3 sm:py-2 w-full sm:w-auto"
                      }`}
                  >
                    {isMobile ? "🔍 Search" : "Search"}
                  </Button> */}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Portal-based dropdown */}
      {showDropdown &&
        searchQuery.length >= 2 &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-[99999] max-h-96 overflow-y-auto"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
          >
            {isLoading ? (
              <div className="p-6 text-center text-gray-600">
                <div className="text-sm animate-pulse">
                  Searching adventures...
                </div>
              </div>
            ) : hasResults ? (
              <div className="py-2">
                {suggestions?.destinations &&
                  suggestions.destinations.length > 0 && (
                    <div>
                      <div className="px-6 py-3 text-xs font-bold text-brand-primary uppercase tracking-wider border-b border-neutral-100">
                        Destinations
                      </div>
                      {suggestions.destinations.map((destination) => (
                        <div
                          key={`dest-${destination.id}`}
                          onClick={() =>
                            handleSuggestionClick(destination.title)
                          }
                          className="px-6 py-4 hover:bg-neutral-50 cursor-pointer border-b border-neutral-50 last:border-0 transition-all duration-200"
                        >
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-brand-primary mr-4 flex-shrink-0" />
                            <div>
                              <div className="font-semibold text-gray-800">
                                {destination.title}
                              </div>
                              {destination.subtitle && (
                                <div className="text-sm text-gray-600">
                                  {destination.subtitle}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                {suggestions?.experiences &&
                  suggestions.experiences.length > 0 && (
                    <div>
                      <div className="px-6 py-3 text-xs font-bold text-info uppercase tracking-wider border-b border-neutral-100">
                        Activities
                      </div>
                      {suggestions.experiences.map((experience) => (
                        <div
                          key={`exp-${experience.id}`}
                          onClick={() =>
                            handleSuggestionClick(experience.title)
                          }
                          className="px-6 py-4 hover:bg-neutral-50 cursor-pointer border-b border-neutral-50 last:border-0 transition-all duration-200"
                        >
                          <div className="flex items-center">
                            <Compass className="h-4 w-4 text-info mr-4 flex-shrink-0" />
                            <div>
                              <div className="font-semibold text-gray-800">
                                {experience.title}
                              </div>
                              <div className="text-sm text-gray-600">
                                {experience.category}
                                {experience.location &&
                                  ` • ${experience.location}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-600">
                <div className="text-sm">
                  No adventures found for "{searchQuery}"
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Try different keywords
                </div>
              </div>
            )}
          </div>,
          document.body
        )}
    </section>
  );
}
