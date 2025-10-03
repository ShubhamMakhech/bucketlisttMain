import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Users, MapPin, Route } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LazyImage } from "./LazyImage";
import { FavoriteButton } from "./FavoriteButton";
import { useState } from "react";

interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface ExperienceCardProps {
  id: string;
  image: string;
  title: string;
  category?: string; // Keep for backward compatibility
  categories?: Category[]; // New prop for multiple categories
  rating: number;
  reviews: string;
  price: string;
  originalPrice?: string;
  discountedPrice?: string; // New prop for discounted price
  duration?: string;
  groupSize?: string;
  isSpecialOffer?: boolean;
  distanceKm?: number;
  startPoint?: string;
  endPoint?: string;
  index?: number; // New prop for index number
  description?: string; // New prop for description
}

export function ExperienceCard({
  id,
  image,
  title,
  category,
  categories,
  rating,
  reviews,
  price,
  originalPrice,
  discountedPrice,
  duration,
  groupSize,
  isSpecialOffer,
  distanceKm,
  startPoint,
  endPoint,
  index,
  description,
}: ExperienceCardProps) {
  const navigate = useNavigate();
  const [isClicked, setIsClicked] = useState(false);

  // Fetch primary image from experience_images if main image is not available
  const { data: primaryImage } = useQuery({
    queryKey: ["experience-primary-image", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experience_images")
        .select("image_url")
        .eq("experience_id", id)
        .eq("is_primary", true)
        .single();

      if (error) return null;
      return data?.image_url || null;
    },
    enabled: !image || image === "", // Only fetch if main image is not available
  });

  // Fetch activities data to check for discounted prices
  const { data: activities } = useQuery({
    queryKey: ["activities", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("experience_id", id)
        .eq("is_active", true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Get the first activity's discounted price
  const firstActivity = activities?.[0];
  const activityDiscountedPrice = (firstActivity as any)?.discounted_price;

  // Determine which price to display (same logic as MobileFloatingButton)
  const getDisplayPrice = () => {
    // Priority: discountedPrice prop > activityDiscountedPrice > price
    if (discountedPrice) {
      return {
        displayPrice: discountedPrice,
        originalPrice: price,
        isDiscounted: true
      };
    }
    
    // Check if activity has discounted price
    if (activityDiscountedPrice && firstActivity?.price) {
      const activityOriginalPrice = `₹${firstActivity.price}`;
      const activityDiscountedPriceFormatted = `₹${activityDiscountedPrice}`;
      
      if (activityDiscountedPrice !== firstActivity.price) {
        return {
          displayPrice: activityDiscountedPriceFormatted,
          originalPrice: activityOriginalPrice,
          isDiscounted: true
        };
      }
    }
    
    return {
      displayPrice: price,
      originalPrice: originalPrice,
      isDiscounted: false
    };
  };

  const { displayPrice, originalPrice: displayOriginalPrice, isDiscounted } = getDisplayPrice();

  const handleClick = () => {
    setIsClicked(true);

    // Add a small delay for the animation to be visible before navigation
    setTimeout(() => {
      navigate(`/experience/${id}`);
    }, 200);
  };

  // Use categories if available, otherwise fall back to single category
  const displayCategories =
    categories && categories.length > 0
      ? categories
      : category
        ? [{ id: "fallback", name: category }]
        : [];

  const getDistanceDisplay = () => {
    if (distanceKm === 0) return "On spot";
    if (distanceKm && startPoint && endPoint) {
      return `${distanceKm}km (${startPoint} to ${endPoint})`;
    }
    if (distanceKm) return `${distanceKm}km`;
    return null;
  };

  // Determine which image to use
  const displayImage =
    image && image !== "" ? image : primaryImage || "/placeholder.svg";

  return (
    <Card
      className={`group cursor-pointer overflow-hidden border-0 transition-all duration-300 transform hover:-translate-y-2 zoom-click-animation ${isClicked ? "zoom-in-click" : ""
        } ExperienceCardMobileLayout`}
      onClick={handleClick}
      style={{ boxShadow: "none", borderRadius: "5px" }}
    >
      <CardContent className="p-0">
        {/* Desktop Layout */}
        <div className="OnlyPc">
          <div className="relative">
            {isSpecialOffer && (
              <Badge className="absolute top-3 left-3 z-10" id="BadgeEditStyle">
                Special offer
              </Badge>
            )}
            <div
              className={`absolute z-10 ${index !== undefined ? "top-0 right-0" : "top-0 right-2"
                }`}
              style={{ marginTop: "-2px" }}
            >
              <FavoriteButton experienceId={id} className="HeaderFavoriteButton" />
            </div>
            <LazyImage
              src={displayImage}
              alt={title}
              className="group-hover:scale-105 transition-transform duration-200"
              aspectRatio="aspect-[4/3]"
            />
          </div>

          <div className="p-3 space-y-1">
            <div>
              {displayCategories.length > 0 && (
                <div>
                  {displayCategories.slice(0, 2).map((cat, index) => (
                    <span
                      key={cat.id || index}
                      className="flex items-center gap-1"
                    >
                      {/* {cat.icon && <span>{cat.icon}</span>}
                      <div id="FlexContainerRowBetween">
                        <span className="fontSizeSm">{cat.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 fontSizeSm" />
                            <span className="font-medium fontSizeSm">
                              {rating}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground fontSizeSm">
                            ({reviews})
                          </span>
                        </div>
                      </div> */}

                      {index < Math.min(displayCategories.length, 2) - 1 && (
                        <span>•</span>
                      )}
                    </span>
                  ))}
                  {displayCategories.length > 2 && (
                    <span className="text-xs">
                      +{displayCategories.length - 2} more
                    </span>
                  )}
                </div>
              )}
            </div>

            <h3 className="CommonH3 text-start FontAdjustForMobile">{title}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground marginUnset">
              {duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 fontSizeSm" />
                  <span className="fontSizeSm">{duration}</span>
                </div>
              )}
              {groupSize && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span className="fontSizeSm">{groupSize}</span>
                </div>
              )}
            </div>

            {getDistanceDisplay() && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground ">
                {distanceKm === 0 ? (
                  <MapPin className="h-4 w-4" />
                ) : (
                  <Route className="h-4 w-4" />
                )}
                <span>{getDistanceDisplay()}</span>
              </div>
            )}
            <div>
              <div id="PriceContainerOfferHomePageCards">
                {isDiscounted ? (
                  <div className="flex flex-col gap-0" style={{textAlign: "start"}}>
                    <div className="FlexAdjustContainer font-bold fontSizeMd">
                    <span style={{ color: "grey" }}>From</span>&nbsp;
                      <span className="text-muted-foreground line-through">
                        {displayOriginalPrice}
                      </span>
                    </div>
                    <span
                      className="font-bold fontSizeMd text-green-600"
                    >
                      {displayPrice}
                    </span>
                  </div>
                ) : (
                  <div className="FlexAdjustContainer">
                    <span
                      className="text-lg font-bold fontSizeMd"
                      style={{ color: "var(--brand-color)" }}
                    > 
                      <span style={{ color: "grey" }}>From</span> {displayPrice}
                    </span>
                    {displayOriginalPrice && (
                      <span className="text-sm text-muted-foreground line-through fontSizeSm">
                        {displayOriginalPrice}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="OnlyMobile ExperienceCardMobileGrid">
          <div className="relative ExperienceCardMobileImage">
            {isSpecialOffer && (
              <Badge className="absolute top-2 left-2 z-10" id="BadgeEditStyle">
                Special offer
              </Badge>
            )}

            {/* Index Number - Only on Mobile */}
            {index !== undefined && (
              <div className="absolute top-2 right-2 z-20 ExperienceCardIndexNumber">
                {index + 1}
              </div>
            )}
            <LazyImage
              src={displayImage}
              alt={title}
              className="group-hover:scale-105 transition-transform duration-200"
              aspectRatio="aspect-[1/1]"
            />
          </div>

          <div className="ExperienceCardMobileContent p-3 space-y-1">
            <div className="RelativeContainer">
              <div>
                {displayCategories.length > 0 && (
                  <div>
                    {displayCategories.slice(0, 1).map((cat, index) => (
                      <span
                        key={cat.id || index}
                        className="flex items-center gap-1"
                      >
                        {/* {cat.icon && <span>{cat.icon}</span>} */}
                        <div id="FlexContainerRowBetween">
                          {/* <span className="fontSizeSm">{cat.name}</span> */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 fontSizeSm" />
                              <span className="font-medium fontSizeSm">
                                {rating}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground fontSizeSm">
                              ({reviews})
                            </span>
                          </div>
                        </div>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div
                className={`absolute z-10 ${index !== undefined ? "top-0 right-0" : "top-0 right-2"
                  }`}
                style={{ marginTop: "-2px" }}
              >
                <FavoriteButton experienceId={id} className="HeaderFavoriteButton" />
              </div>
            </div>

            <h3 className="CommonH3 text-start FontAdjustForMobile">{title}</h3>

            <div
              className="DescriptionContainer"
              dangerouslySetInnerHTML={{
                __html: description ?
                  description.replace(/<[^>]*>/g, '').split(" ").slice(0, 10).join(" ") +
                  (description.replace(/<[^>]*>/g, '').split(" ").length > 20 ? "..." : "")
                  : ""
              }}
            />
            <div id="PriceContainerOfferHomePageCards">
              {isDiscounted ? (
                <div className="flex flex-col gap-0" style={{textAlign: "start"}}>
                  <div className="FlexAdjustContainer">
                    <span className="FromText textSmall">from</span>
                    <span className="text-muted-foreground line-through textSmall">
                      {displayOriginalPrice}
                    </span>
                  </div>
                  <div style={{ marginTop: "-5px" }}>
                    <span
                      className="text-lg font-bold fontSizeMd text-green-600"
                    >
                      {displayPrice}
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <span className="FromText">from</span>{" "}
                    {displayOriginalPrice && (
                      <span className="text-sm text-muted-foreground line-through fontSizeSm">
                        {displayOriginalPrice}
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: "-5px" }}>
                    <span
                      className="text-lg font-bold fontSizeMd"
                      style={{ color: "var(--brand-color)" }}
                    >
                      {displayPrice}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
