import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { LazyImage } from "./LazyImage";
import { useState } from "react";

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

  const handleClick = () => {
    setIsClicked(true);

    // Add a small delay for the animation to be visible before navigation
    setTimeout(() => {
      navigate(navigatePage ? navigatePage : `/destination/${id}`);
    }, 200);
  };

  return (
    <Card
      className={`group cursor-pointer overflow-hidden border-0 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 zoom-click-animation ${
        isClicked ? "zoom-in-click" : ""
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-0 relative" id="DestinationCardStyles">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="DestinationsImage"
          // aspectRatio="aspect-[4/3]"
        />
      </CardContent>
      <div className=" bottom-0 left-0 right-0 p-4  from-black/60 to-transparent text-black">
        <p className="text-sm opacity-90 mb-1" style={{ textAlign: "start" }}>
          {subtitle.length > 80
            ? subtitle.substring(0, 80) + "..."
            : subtitle}
        </p>
        <h2
          className=""
          style={{ textAlign: "start", color: "var(--brand-color)" }}
        >
          {title}
        </h2>
      </div>
    </Card>
  );
}
