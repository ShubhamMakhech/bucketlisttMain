// @ts-nocheck
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      id="TestimonialCarouselBackgroundStyles"
    >
      <div className="max-w-7xl mx-auto MaxWidthContainer">
        <div>
          {/* Left Side - Title and Navigation */}
          <div>
            <div className="text-white SectionHeading">
              {/* <br /> */}
              People's experience with us &nbsp;💜
            </div>
            {/* <br /> */}
            {/* Navigation Buttons */}
            {/* <div className="flex gap-3 justify-center lg:justify-start">
              <Button
                variant="outline"
                size="icon"
                onClick={scrollLeft}
                className="border-white/20 rounded-full w-12 h-12 bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={scrollRight}
                className="border-white/20 rounded-full w-12 h-12 bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div> */}
          </div>

          {/* Right Side - Horizontal Scrollable Testimonials */}
          <div className="flex-1 relative w-full overflow-x-auto mt-4 PaddingTopSet">
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
                  className="TestimonialCardContainer"

                >
                  {/* Image */}
                  {/* <div
                    className="h-40 w-full bg-gradient-to-br from-blue-500 to-purple-600 relative "
                    id="TestimonialImage"
                  >
                    <img
                      src={testimonial.image}
                      alt={`${testimonial.experience} - ${testimonial.name}`}
                      className="w-full h-full object-cover object-center"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-white text-xs font-medium">
                        {testimonial.rating}
                      </span>
                    </div>
                  </div> */}

                  {/* Content */}
                  <div
                    className="p-6 flex-1 flex flex-col"
                    style={{ background: "rgb(28 21 37)", borderRadius: "20px",heigh:"100%" }}

                  >
                    {/* Header with Avatar and Info */}
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

                    {/* Review Text */}
                    <div className="flex-1 mb-4">
                      <p
                        className="text-gray-300 text-sm leading-relaxed"
                        style={{ textAlign: "start" }}
                      >
                        {testimonial.review}
                      </p>
                    </div>

                    {/* Experience Link */}
                    <div className="text-xs text-white font-medium border-t border-gray-700 pt-3">
                      {testimonial.experience}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
