import { Card, CardContent } from "@/components/ui/card";
import { Star, ArrowUpRight } from "lucide-react";
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
  urlName?: string; // New prop for URL-friendly name
  variant?: "vertical" | "horizontal"; // New prop for layout variant
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
  urlName,
  variant = "vertical",
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
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      // .order("created_at", { ascending: false });
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
        isDiscounted: true,
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
          isDiscounted: true,
        };
      }
    }

    return {
      displayPrice: price,
      originalPrice: originalPrice,
      isDiscounted: false,
    };
  };

  const {
    displayPrice,
    originalPrice: displayOriginalPrice,
    isDiscounted,
  } = getDisplayPrice();

  // Discount % for badge (e.g. "6% off") when we have original and discounted price
  const discountPercent = (() => {
    if (!isDiscounted || !displayOriginalPrice) return null;
    const strip = (s: string) => parseFloat(String(s).replace(/[^0-9.]/g, "")) || 0;
    const original = strip(displayOriginalPrice);
    const discounted = strip(displayPrice);
    if (original <= 0 || discounted >= original) return null;
    return Math.round((1 - discounted / original) * 100);
  })();

  const handleClick = () => {
    setIsClicked(true);

    // Add a small delay for the animation to be visible before navigation
    setTimeout(() => {
      // Use url_name if available, otherwise fall back to generating slug from title
      const experienceName = urlName || title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      navigate(`/experience/${experienceName}`, {
        state: {
          experienceData: {
            id,
            title,
            image,
            category,
            categories,
            rating,
            reviews,
            price,
            originalPrice,
            discountedPrice,
            duration,
            groupSize,
            distanceKm,
            startPoint,
            endPoint,
            description,
            isSpecialOffer,
            url_name: urlName,
          },
          fromPage: "experience-card",
          timestamp: Date.now(),
        },
      });
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

  // Truncate title to 12 characters with ellipsis
  const truncateTitle = (text: string, maxLength: number = 40) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Truncate HTML description to 100 characters (text only, preserving HTML tags)
  const truncateHTMLDescription = (html: string, maxLength: number = 100) => {
    if (!html) return "";

    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Get plain text content
    const plainText = tempDiv.textContent || tempDiv.innerText || "";

    // If plain text is within limit, return original HTML
    if (plainText.length <= maxLength) return html;

    // Truncate plain text to maxLength
    const truncatedText = plainText.substring(0, maxLength);

    // Try to truncate at word boundary (find last space)
    const lastSpace = truncatedText.lastIndexOf(" ");
    const finalText = lastSpace > maxLength * 0.8
      ? truncatedText.substring(0, lastSpace)
      : truncatedText;

    // Return truncated text with ellipsis
    return finalText + "...";
  };

  const truncatedTitle = variant === "horizontal" ? title : truncateTitle(title);
  const categoryLabel = displayCategories.length > 0 ? displayCategories[0].name : category || "";

  return (
    <Card
      id="ExperienceCardStylesCard"
      className={`experience-card-minimal group cursor-pointer overflow-hidden border-0 transition-all duration-300 ExperienceCardMobileLayout ${variant === "horizontal" ? "destination-horizontal-card" : ""}`}
      onClick={handleClick}
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderRadius: "12px" }}
    >
      <CardContent className="p-0">
        {variant === "horizontal" ? (
          <>
            {/* Horizontal Layout (Visible ONLY on Mobile) */}
            <div className="experience-card-horizontal-wrapper mobile-only-layout">
              <div className="experience-card-horizontal-image">
                {isSpecialOffer && (
                  <span className="experience-card-minimal-badge">Free cancellation</span>
                )}
                <div className="experience-card-minimal-favorite">
                  <FavoriteButton
                    experienceId={id}
                    className="HeaderFavoriteButton"
                  />
                </div>
                <LazyImage
                  src={displayImage}
                  alt={title}
                  className="group-hover:scale-[1.02] transition-transform duration-300 h-full w-full object-cover"
                />
              </div>

              <div className="experience-card-horizontal-content">
                <div className="experience-card-horizontal-meta">
                  <span className="experience-card-horizontal-rating">
                    <Star className="experience-card-horizontal-star" />
                    {rating}
                    <span className="experience-card-horizontal-reviews">({reviews})</span>
                  </span>
                </div>
                <h3 className="experience-card-horizontal-title">{truncatedTitle}</h3>
                <p className="experience-card-horizontal-description">
                  {truncateHTMLDescription(description || "", 30)}
                </p>

                <div className="experience-card-horizontal-separator" />

                <div className="experience-card-horizontal-footer">
                  <div className="experience-card-horizontal-price">
                    <div className="experience-card-horizontal-label">from</div>
                    <div className="experience-card-horizontal-prices-row">
                      {isDiscounted && displayOriginalPrice && (
                        <span className="experience-card-horizontal-original">{displayOriginalPrice}</span>
                      )}
                      <span className="experience-card-horizontal-value">{displayPrice}</span>
                    </div>
                  </div>
                  <div className="experience-card-horizontal-action">
                    <div className="experience-card-horizontal-arrow">
                      <ArrowUpRight className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vertical Layout (Visible ONLY on Desktop) */}
            <div className="desktop-only-layout">
              <div className="experience-card-minimal-image">
                {isSpecialOffer && (
                  <span className="experience-card-minimal-badge">Free cancellation</span>
                )}
                <div className="experience-card-minimal-favorite">
                  <FavoriteButton
                    experienceId={id}
                    className="HeaderFavoriteButton"
                  />
                </div>
                <LazyImage
                  src={displayImage}
                  alt={title}
                  className="group-hover:scale-[1.02] transition-transform duration-300"
                  aspectRatio="aspect-[4/3]"
                />
              </div>

              <div className="experience-card-minimal-content">
                <div className="experience-card-minimal-meta">
                  {categoryLabel ? (
                    <span className="experience-card-minimal-category">{categoryLabel}</span>
                  ) : null}
                  <span className="experience-card-minimal-rating">
                    <Star className="experience-card-minimal-star" />
                    {rating}
                    <span className="experience-card-minimal-reviews">({reviews})</span>
                  </span>
                </div>
                <h3 className="experience-card-minimal-title">{truncatedTitle}</h3>
                <div className="experience-card-minimal-price">
                  <div className="experience-card-minimal-from-line">from</div>
                  {isDiscounted && displayOriginalPrice && (
                    <div className="experience-card-minimal-original-line">
                      <span className="experience-card-minimal-original">{displayOriginalPrice}</span>
                    </div>
                  )}
                  <div className="experience-card-minimal-value-line">
                    <span className="experience-card-minimal-value">{displayPrice}</span>
                    {discountPercent != null && discountPercent > 0 && (
                      <span className="experience-card-minimal-discount-badge">{discountPercent}% off</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Standard Vertical Layout */}
            <div className="experience-card-minimal-image">
              {isSpecialOffer && (
                <span className="experience-card-minimal-badge">Free cancellation</span>
              )}
              <div className="experience-card-minimal-favorite">
                <FavoriteButton
                  experienceId={id}
                  className="HeaderFavoriteButton"
                />
              </div>
              <LazyImage
                src={displayImage}
                alt={title}
                className="group-hover:scale-[1.02] transition-transform duration-300"
                aspectRatio="aspect-[4/3]"
              />
            </div>

            <div className="experience-card-minimal-content">
              <div className="experience-card-minimal-meta">
                {categoryLabel ? (
                  <span className="experience-card-minimal-category">{categoryLabel}</span>
                ) : null}
                <span className="experience-card-minimal-rating">
                  <Star className="experience-card-minimal-star" />
                  {rating}
                  <span className="experience-card-minimal-reviews">({reviews})</span>
                </span>
              </div>
              <h3 className="experience-card-minimal-title">{truncatedTitle}</h3>
              <div className="experience-card-minimal-price">
                <div className="experience-card-minimal-from-line">from</div>
                {isDiscounted && displayOriginalPrice && (
                  <div className="experience-card-minimal-original-line">
                    <span className="experience-card-minimal-original">{displayOriginalPrice}</span>
                  </div>
                )}
                <div className="experience-card-minimal-value-line">
                  <span className="experience-card-minimal-value">{displayPrice}</span>
                  {discountPercent != null && discountPercent > 0 && (
                    <span className="experience-card-minimal-discount-badge">{discountPercent}% off</span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
