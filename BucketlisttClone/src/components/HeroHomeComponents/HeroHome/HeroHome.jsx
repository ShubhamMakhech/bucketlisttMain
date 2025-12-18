import React, { useState, useEffect, useRef } from "react";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { MapPin, Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createPortal } from "react-dom";
import "./HeroHome.css";

const HeroHome = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({
        top: 0,
        left: 0,
        width: 0,
    });
    const [currentSlide, setCurrentSlide] = useState(0);
    const [previousSlide, setPreviousSlide] = useState(null);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const searchContainerRef = useRef(null);

    // Background images for slider
    const backgroundImages = [
        "https://images.unsplash.com/photo-1521673252667-e05da380b252?q=80&w=3132&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1559677624-3c956f10d431?q=80&w=1925&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1627241129356-137242cf14f0?q=80&w=2134&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://s3.ap-south-1.amazonaws.com/prepseed/prod/ldoc/media/HomeSliderSkyDivingImage.jpg",
    ];

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

    // Auto-slide background images every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setPreviousSlide(currentSlide);
            setCurrentSlide((prev) => (prev + 1) % backgroundImages.length);

            // Clear previous slide after animation completes
            setTimeout(() => {
                setPreviousSlide(null);
            }, 1500);
        }, 3000);

        return () => clearInterval(interval);
    }, [currentSlide, backgroundImages.length]);

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
                {/* Background Image Slider */}
                {backgroundImages.map((image, index) => {
                    const isActive = index === currentSlide;
                    const isExiting = index === previousSlide;

                    // Only render active and exiting slides
                    if (!isActive && !isExiting) return null;

                    return (
                        <div
                            key={index}
                            className={`HeroBackgroundSliderItem ${isActive ? "active" : ""} ${isExiting ? "exiting" : ""}`}
                        >
                            <div className="HeroBackgroundImageWrapper">
                                <img
                                    src={image}
                                    alt={`Hero background ${index + 1}`}
                                    className="HeroBackgroundImage"
                                />
                            </div>
                        </div>
                    );
                })}
                <div className="HeroHomeContentGridContainer MaxWidthContainer">
                    <div>
                        <div>
                            <h1 className="HeroHomeContentGridContainerTitle RairBigHeading textAlignStart ColorWhite">
                                India's trusted platform for curated experiences
                            </h1>
                            <p className="textAlignStart ColorWhite MarginTopSmall SecondaryColorText">
                            Curated with intention. Delivered with trust. Designed for meaningful moments.
                            </p>

                            {/* Search bar */}
                            <div className="HeroSearchBarWrapper" ref={searchContainerRef}>
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
                                                const rect = searchContainerRef.current.getBoundingClientRect();
                                                setDropdownPosition({
                                                    top: rect.bottom + 8,
                                                    left: rect.left,
                                                    width: rect.width,
                                                });
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <div className="VideoContainer">
                            <div>
                                <video
                                    autoPlay
                                    muted
                                    loop
                                    src="https://prepseed.s3.ap-south-1.amazonaws.com/Hero+page+video+-+draft.mp4"
                                ></video>
                            </div>
                        </div>
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
                                    src="/Images/NewIcons/NoDataFoundIcon.png"
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
                    document.body
                )}
        </div>
    );
};

export default HeroHome;
