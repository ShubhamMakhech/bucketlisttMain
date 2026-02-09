import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoReel {
  id: string;
  src: string;
  poster?: string;
  instagramUrl?: string;
}

interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  image: string;
  review: string;
  experience: string;
  initial: string;
}

// Avatar component with image fallback to initial
function TestimonialAvatar({
  image,
  initial,
  name
}: {
  image: string;
  initial: string;
  name: string;
}) {
  const [imageError, setImageError] = useState(false);

  const isValidImage = image && image !== "-" && image.trim() !== "";

  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base overflow-hidden"
      style={{ background: "rgb(39, 28, 55)" }}
    >
      {isValidImage && !imageError ? (
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover object-center"
          onError={() => setImageError(true)}
        />
      ) : (
        <div>{initial}</div>
      )}
    </div>
  );
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Arjun Sharma",
    location: "Delhi, India",
    rating: 5,
    image: "https://rishikeshcamp.in/img/act/bungee2.jpg",
    review:
      "Bungee jumping in Rishikesh was absolutely thrilling! The 83-meter jump from Jumpin Heights was the most exhilarating experience of my life. The staff was professional and made sure I felt safe throughout.",
    experience: "Rishikesh Bungee Jumping",
    initial: "A",
  },
  {
    id: "2",
    name: "Priya Patel",
    location: "Mumbai, India",
    rating: 5,
    image:
      "https://www.panchvaticottage.com/images/ganga-river-rating-in-rishikesh.jpg",
    review:
      "River rafting on the Ganges was incredible! The rapids were exciting and the scenery was breathtaking. Our guide Ravi was amazing and taught us so much about the local culture and river safety.",
    experience: "Rishikesh River Rafting",
    initial: "P",
  },
  {
    id: "3",
    name: "Vikram Singh",
    location: "Jaipur, India",
    rating: 5,
    image:
      "https://rishikesh.app/te/activities/rock-climbing/rock-climbing-03.jpg",
    review:
      "The cliff jumping and rock climbing combo was perfect! Rishikesh offers such diverse adventure activities. The instructors were well-trained and the equipment was top-notch. Highly recommend!",
    experience: "Rishikesh Adventure Sports",
    initial: "V",
  },
  {
    id: "4",
    name: "Ananya Gupta",
    location: "Bangalore, India",
    rating: 4,
    image:
      "https://www.seawatersports.com/images/activies/slide/ziplining-in-uttarakhand-price.jpg",
    review:
      "Zip-lining across the valley was amazing! The views of the Himalayas and Ganges were spectacular. It's a must-do activity when in Rishikesh. The whole experience was well-organized and safe.",
    experience: "Rishikesh Zip Lining",
    initial: "A",
  },
  {
    id: "5",
    name: "Rohit Kumar",
    location: "Chennai, India",
    rating: 5,
    image: "https://rishikeshcamp.in/img/act/bungee2.jpg",
    review:
      "Trekking to Neer Garh Waterfall was refreshing after all the adventure activities. The natural beauty of Rishikesh is unmatched. Perfect combination of adventure and nature therapy!",
    experience: "Rishikesh Trekking & Waterfall",
    initial: "R",
  },
  {
    id: "6",
    name: "Kavya Reddy",
    location: "Hyderabad, India",
    rating: 5,
    image: "-",
    review:
      "Flying fox was an adrenaline rush like no other! Soaring over the Ganges at high speed was both scary and exciting. The team at Rishikesh made sure everything was perfect. Unforgettable experience!",
    experience: "Rishikesh Flying Fox",
    initial: "K",
  },
  {
    id: "7",
    name: "Megha Joshi",
    location: "Pune, India",
    rating: 4,
    image:
      "https://www.tourmyindia.com/blog//wp-content/uploads/2018/04/Camping-in-Rishikesh.jpg",
    review:
      "Camping by the riverside in Rishikesh was a peaceful escape from city life. The tents were clean and comfortable, and the bonfire nights were a highlight. Food could have been better, but overall a memorable experience.",
    experience: "Rishikesh Riverside Camping",
    initial: "M",
  },
  {
    id: "8",
    name: "Siddharth Menon",
    location: "Kochi, India",
    rating: 5,
    image:
      "https://www.adventurenation.com/blog/wp-content/uploads/2015/09/rafting-in-rishikesh.jpg",
    review:
      "I was a bit nervous about rafting, but the safety measures and the friendly guides put me at ease. The thrill of conquering the rapids with my friends is something I’ll never forget. Highly recommended for first-timers!",
    experience: "White Water Rafting",
    initial: "S",
  },
  {
    id: "9",
    name: "Neha Saini",
    location: "Lucknow, India",
    rating: 3,
    image:
      "https://www.holidify.com/images/cmsuploads/compressed/Neergarh-Waterfall_20180322163913.jpg",
    review:
      "The trek to Neergarh Waterfall was beautiful, but the trail was a bit crowded and littered in some places. The waterfall itself was stunning and worth the effort. Go early in the morning for a quieter experience.",
    experience: "Neergarh Waterfall Trek",
    initial: "N",
  },
  {
    id: "10",
    name: "Amitabh Verma",
    location: "Gurgaon, India",
    rating: 5,
    image: "https://www.rishikeshtourism.in/images/rafting-in-rishikesh.jpg",
    review:
      "Tried the adventure package with my family. The organizers were punctual and everything was well-coordinated. My kids loved the zipline and the food at the camp was delicious. Will definitely come back next year!",
    experience: "Adventure Family Package",
    initial: "A",
  },
  {
    id: "11",
    name: "Tanvi Desai",
    location: "Ahmedabad, India",
    rating: 4,
    image: "https://www.rishikeshadventure.com/images/rock-climbing.jpg",
    review:
      "Rock climbing was tougher than I expected but the instructors were patient and encouraging. I felt a real sense of achievement reaching the top. Would love to try more activities next time.",
    experience: "Rock Climbing",
    initial: "T",
  },
  {
    id: "12",
    name: "Rahul Chatterjee",
    location: "Kolkata, India",
    rating: 5,
    image: "-",
    review:
      "The adventure team was very professional and safety was their top priority. I did bungee jumping and it was a once-in-a-lifetime experience. The view from the top was breathtaking!",
    experience: "Bungee Jumping",
    initial: "R",
  },
];

// Video Reel component with mute/unmute + sequential play (only plays when isActive)
function VideoReelCard({
  reel,
  index,
  isActive,
  onEnded,
  onRequestPlay,
}: {
  reel: VideoReel;
  index: number;
  isActive: boolean;
  onEnded: () => void;
  onRequestPlay: (index: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Clicking the audio button makes this reel the active one so it starts playing
    onRequestPlay(index);
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  // Sequential: play when this reel is active, pause and reset when not
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.currentTime = 0;
      setIsMuted(video.muted); // keep icon in sync with actual audio state
      video.play().catch(() => { });
    } else {
      video.pause();
      video.currentTime = 0;
      setIsMuted(true);
    }
  }, [isActive]);

  const handleEnded = () => {
    onEnded();
  };

  // Open the Instagram link in a new tab
  const openInstagram = () => {
    if (reel.instagramUrl) {
      window.open(reel.instagramUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className={`testimonial-reel-card ${isActive ? "testimonial-reel-active" : ""}`} onClick={openInstagram}>
      <video
        ref={videoRef}
        src={reel.src}
        poster={reel.poster}
        muted
        playsInline
        className="testimonial-reel-video"
        onEnded={handleEnded}
      />

      {/* Gradient overlay */}
      <div className="testimonial-reel-overlay" />

      {/* Mute/Unmute Button */}
      <button
        onClick={toggleMute}
        className="testimonial-reel-mute-btn"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </button>

      {/* Instagram attribution */}
      <div className="testimonial-reel-badge">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
        <span>Reel</span>
      </div>
    </div>
  );
}

// Video reels data - from public/Images/InstaReelsReview/
const videoReels: VideoReel[] = [

  {
    id: "reel-3",
    src: "/Images/InstaReelsReview/3.mp4",
    instagramUrl: "https://www.instagram.com/s/aGlnaGxpZ2h0OjE4MDgxODc3OTYxMTU1OTYy?story_media_id=3794722450379551696&igsh=MXVyc3I1cGswNG10bw==",
  },
  {
    id: "reel-2",
    src: "/Images/InstaReelsReview/2.mp4",
    instagramUrl: "https://www.instagram.com/s/aGlnaGxpZ2h0OjE4MDgxODc3OTYxMTU1OTYy?story_media_id=3796190244044414878&igsh=MXVyc3I1cGswNG10bw==",
  },
  {
    id: "reel-1",
    src: "/Images/InstaReelsReview/1.mp4",
    instagramUrl: "https://www.instagram.com/s/aGlnaGxpZ2h0OjE4MDgxODc3OTYxMTU1OTYy?story_media_id=3793801262773963986&igsh=MXVyc3I1cGswNG10bw==",
  },

  {
    id: "reel-3",
    src: "/Images/InstaReelsReview/4.mp4",
    instagramUrl: "https://www.instagram.com/s/aGlnaGxpZ2h0OjE4MDgxODc3OTYxMTU1OTYy?story_media_id=3794722450379551696&igsh=MXVyc3I1cGswNG10bw==",
  },
];

// Grid that runs reels in sequence: 1 → 2 → 3 → 4 → 1 → ...
function SequentialReelsGrid() {
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(0);

  const handleReelEnded = () => {
    setCurrentPlayingIndex((prev) => (prev + 1) % videoReels.length);
  };

  // When user clicks the audio button on any reel, that reel becomes active and starts
  const handleRequestPlay = (index: number) => {
    setCurrentPlayingIndex(index);
  };

  return (
    <div className="testimonial-reels-grid PaddingTopSet">
      {videoReels.map((reel, index) => (
        <VideoReelCard
          key={`reel-${index}`}
          reel={reel}
          index={index}
          isActive={currentPlayingIndex === index}
          onEnded={handleReelEnded}
          onRequestPlay={handleRequestPlay}
        />
      ))}
    </div>
  );
}

export function TestimonialCarousel() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -320,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 320,
        behavior: "smooth",
      });
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
          }`}
      />
    ));
  };

  return (
    <section
      className="SectionPaddingBottom SectionPaddingTop"
      id="testimonials-section"
    >
      <div className="MaxWidthContainer">
        <div>
          {/* Title */}
          <div>
            <h2 className="text-white CommonH2 leading-tight">
              Hear what our customers are saying&nbsp;💜
            </h2>
          </div>

          {/* Video Reels Grid - sequential play: 1st → 2nd → 3rd → 1st... */}
          <SequentialReelsGrid />

          {/* Review Cards - Hidden for now */}
          {/* <div className="flex-1 relative w-full overflow-x-auto mt-4 PaddingTopSet">
            <div
              ref={scrollContainerRef}
              className="flex gap-4  scrollbar-hide pb-4"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="bg-gray-800 rounded-2xl  flex flex-col flex-shrink-0 w-80 "

                >
                  <div
                    className="p-6 flex-1 flex flex-col"
                    style={{ background: "rgb(28 21 37)", borderRadius: "20px" }}

                  >
                    <div className="flex items-center gap-3 mb-4">
                      <TestimonialAvatar
                        image={testimonial.image}
                        initial={testimonial.initial}
                        name={testimonial.name}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white text-base">
                            {testimonial.name}
                          </h3>
                          <div className="flex items-center gap-1">
                            {renderStars(testimonial.rating)}
                          </div>
                        </div>
                        <p className="text-gray-400 text-xs text-start">
                          🇮🇳 {testimonial.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 mb-4">
                      <p
                        className="text-gray-300 text-sm leading-relaxed"
                        style={{ textAlign: "start" }}
                      >
                        {testimonial.review}
                      </p>
                    </div>

                    <div className="text-xs text-white font-medium border-t border-gray-700 pt-3">
                      {testimonial.experience}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div> */}
        </div>
      </div>
    </section>
  );
}
