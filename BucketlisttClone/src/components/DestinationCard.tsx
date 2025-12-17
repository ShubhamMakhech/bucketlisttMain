import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { LazyImage } from "./LazyImage";
import { useState } from "react";

// Static destination images mapping - now supports multiple images per destination
const staticDestinationImages: Record<string, string[]> = {
  Darjeeling: ["https://prepseed.s3.ap-south-1.amazonaws.com/Darjeeling.svg"],
  Goa: [
    "https://images.unsplash.com/photo-1580741186862-c5d0bf2aff33?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  ],
  Jaipur: [
    "https://images.unsplash.com/photo-1735050080783-7b3a661fb7cf?q=80&w=1035&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  ],
  Kerala: ["https://prepseed.s3.ap-south-1.amazonaws.com/Kerela.svg"],
  Rishikesh: ["https://prepseed.s3.ap-south-1.amazonaws.com/Rishikesh.svg"],
  Matheran: [
    "https://images.unsplash.com/photo-1713545396351-b848e4707cb2?q=80&w=1035&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  ],
  Saputara: [
    "https://s3.ap-south-1.amazonaws.com/prepseed/prod/ldoc/media/SaputaraAdventureImage.jpg",
  ],
};

interface DestinationCardProps {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  navigatePage?: string;
}

export function DestinationCard({
  id,
  image,
  title,
  subtitle,
  navigatePage,
}: DestinationCardProps) {
  const navigate = useNavigate();
  const [isClicked, setIsClicked] = useState(false);

  // Get the image source - use first static image if title matches, otherwise use database image
  const getImageSource = () => {
    const staticImages = staticDestinationImages[title];
    return staticImages?.[0] || image;
  };

  const handleClick = () => {
    setIsClicked(true);

    // Add a small delay for the animation to be visible before navigation
    setTimeout(() => {
      if (navigatePage) {
        navigate(navigatePage);
      } else {
        const destinationName = title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim();
        navigate(`/destination/${destinationName}`, {
          state: {
            destinationData: {
              id,
              title,
              subtitle,
              image,
            },
            fromPage: "destination-card",
            timestamp: Date.now(),
          },
        });
      }
    }, 200);
  };

  return (
    <Card
    id="DestinationCardStylesCard"
      className={`group cursor-pointer overflow-hidden border-0 hover:shadow-xl transition-all duration-300 
        }`}
      onClick={handleClick}
    >
      <CardContent className="p-0 relative" id="DestinationCardStyles">
        <img
          src={getImageSource()}
          alt={title}
          loading="lazy"
          className="DestinationsImage"
        // aspectRatio="aspect-[4/3]"
        />
        <div className=" bottom-0 left-0 right-0 p-4  from-black/60 to-transparent text-black" id="DestinationCardContentStyles">
          <p className="text-sm opacity-90" style={{ textAlign: "start", color: "white" }}>
            {subtitle.length > 80 ? subtitle.substring(0, 80) + "..." : subtitle}
          </p>
          <h2
            className="WhiteColorText"
            style={{ textAlign: "start" }}
          >
            {title}
          </h2>
        </div>
      </CardContent>

    </Card>
  );
}
