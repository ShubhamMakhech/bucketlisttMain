// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { MapPin, Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createPortal } from "react-dom";
import "./HeroHome.css";
import { color } from "framer-motion";

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Words to rotate through
  const rotatingWords = [
    "Travellers",
    "Adventurers",
    "Explorers",
    "Wanderers",
    "Backpackers",
  ];

  // Static background images
  const desktopBackgroundImage = "/Images/5.png";
  const mobileBackgroundImage = "/Images/CompressHomeImages/1.jpg";

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const backgroundImage = isMobile
    ? mobileBackgroundImage
    : desktopBackgroundImage;

  // Rotate words every 3 seconds with fade effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Start fade out
      setFadeOut(true);

      // After fade out completes (500ms), change word and fade in
      setTimeout(() => {
        setCurrentWordIndex(
          (prevIndex) => (prevIndex + 1) % rotatingWords.length,
        );
        setFadeOut(false);
      }, 500);
    }, 2000);

    return () => clearInterval(interval);
  }, [rotatingWords.length]);

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["search-suggestions", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.length < 2)
        return { destinations: [], experiences: [] };

      const [destinationsResponse, experiencesResponse] = await Promise.all([
        supabase
          .from("destinations")
          .select("id, title, subtitle")
          .or(`title.ilike.%${searchQuery}%,subtitle.ilike.%${searchQuery}%`)
          .limit(3),
        supabase
          .from("experiences")
          .select("id, title, category, location")
          .eq("is_active", true)
          .or(
            `title.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`,
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
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
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
    };

    const handleResize = () => {
      if (showDropdown) {
        updateDropdownPosition();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [showDropdown]);

  const handleSearch = (value) => {
    if (value && value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value.trim())}`);
      setShowDropdown(false);
    }
  };

  const handleInputChange = (e) => {
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

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowDropdown(false);
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch(searchQuery);
    }
  };

  const hasResults =
    suggestions &&
    (suggestions.destinations.length > 0 || suggestions.experiences.length > 0);

  return (
    <div id="HeroHomeContainer">
      <div className="HeroHomeContentContainer">
        {/* Static Background Image */}
        <div className="HeroBackgroundSliderItem active">
          <div className="HeroBackgroundImageWrapper">
            <img
              src={backgroundImage}
              alt="Hero background"
              className="HeroBackgroundImage"
            />
          </div>
        </div>
        <div className="HeroHomeContentGridContainer MaxWidthContainer">
          <div>
            <div >
              <h1 className="HeroHomeContentGridContainerTitle RairBigHeading textAlignStart ColorWhite">
                Hand-picked experiences for &nbsp;
                <span className="TouristWithLine">
                  tourists
                  <svg
                    className="CurvedLine"
                    viewBox="0 0 200 20"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,15 Q100,5 200,15"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{" "}
                <span
                  className={`RotatingWord ${fadeOut ? "fade-out" : "fade-in"}`}
                >
                  {rotatingWords[currentWordIndex]}
                </span>
              </h1>
              {/* <p className="textAlignStart ColorWhite MarginTopSmall SecondaryColorText">
                                Curated with intention. Delivered with trust. Designed for meaningful moments.
                            </p> */}

              {/* Search bar */}
              {/* <div className="HeroSearchBarWrapper" ref={searchContainerRef}>
                <Input
                  size="large"
                  placeholder="Search for experiences and cities..."
                  prefix={<SearchOutlined />}
                  className="HeroSearchInput"
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  onPressEnter={() => handleSearch(searchQuery)}
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
                />
              </div> */}
            </div>
            {/* <div className="VideoContainer">
                            <div>
                                <video
                                    autoPlay
                                    muted
                                    loop
                                    src="https://prepseed.s3.ap-south-1.amazonaws.com/Hero+page+video+-+draft.mp4"
                                ></video>
                            </div>
                        </div> */}
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
            className="HeroSearchDropdown"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
          >
            {isLoading ? (
              <div className="HeroSearchDropdownLoading">
                <div className="HeroSearchDropdownLoadingText">
                  Searching adventures...
                </div>
              </div>
            ) : hasResults ? (
              <div className="HeroSearchDropdownContent">
                {suggestions?.destinations &&
                  suggestions.destinations.length > 0 && (
                    <div>
                      <div className="HeroSearchDropdownSectionTitle">
                        Destinations
                      </div>
                      {suggestions.destinations.map((destination) => (
                        <div
                          key={`dest-${destination.id}`}
                          onClick={() =>
                            handleSuggestionClick(destination.title)
                          }
                          className="HeroSearchDropdownItem"
                        >
                          <div className="HeroSearchDropdownItemContent">
                            <MapPin className="HeroSearchDropdownIcon HeroSearchDropdownIconPrimary" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="HeroSearchDropdownItemTitle">
                                {destination.title}
                              </div>
                              {destination.subtitle && (
                                <div className="HeroSearchDropdownItemSubtitle">
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
                      <div className="HeroSearchDropdownSectionTitle HeroSearchDropdownSectionTitleInfo">
                        Activities
                      </div>
                      {suggestions.experiences.map((experience) => (
                        <div
                          key={`exp-${experience.id}`}
                          onClick={() =>
                            handleSuggestionClick(experience.title)
                          }
                          className="HeroSearchDropdownItem"
                        >
                          <div className="HeroSearchDropdownItemContent">
                            <Compass className="HeroSearchDropdownIcon HeroSearchDropdownIconInfo" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="HeroSearchDropdownItemTitle">
                                {experience.title}
                              </div>
                              <div className="HeroSearchDropdownItemSubtitle">
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
              <div className="HeroSearchDropdownNoResults">
                <img
                  src="/Images/NoDataFoundIcon.png"
                  alt="No results found"
                  className="HeroSearchDropdownNoResultsImage"
                />
                <div className="HeroSearchDropdownNoResultsText">
                  No adventures found for "{searchQuery}"
                </div>
                <div className="HeroSearchDropdownNoResultsSubtext">
                  Try different keywords
                </div>
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
};

export default Hero;
