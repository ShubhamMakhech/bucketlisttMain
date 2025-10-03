import { useRef } from "react";
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
    image: "https://rishikeshcamp.in/img/act/bungee2.jpg",
    review:
      "Flying fox was an adrenaline rush like no other! Soaring over the Ganges at high speed was both scary and exciting. The team at Rishikesh made sure everything was perfect. Unforgettable experience!",
    experience: "Rishikesh Flying Fox",
    initial: "K",
  },
];

export function TestimonialCarousel() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -320,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 320,
        behavior: 'smooth'
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
    <section className="py-5 md:py-24 px-4 " style={{ background: "rgb(39 28 55)" }}>
      <div className=" max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row  items-start justify-between gap-8">
          {/* Left Side - Title and Navigation */}
          <div className="flex-shrink-0 lg:w-80 w-full text-center lg:text-left" id="GapAddedForTestimonial">
            <h1 className="text-white CommonH1 leading-tight">
              {/* <br /> */}
              People love completing bucketlistt&nbsp;
              {/* <br /> */}
              with us 💖
            </h1>
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
          <div className="flex-1 relative w-full overflow-x-auto">
            <div
              ref={scrollContainerRef}
              className="flex gap-6  scrollbar-hide pb-4"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="bg-gray-800 rounded-2xl  flex flex-col flex-shrink-0 w-80 "
                >
                  {/* Image */}
                  <div className="h-40 w-full bg-gradient-to-br from-blue-500 to-purple-600 relative " id="TestimonialImage">
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
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col" style={{ background: "rgb(28 21 37)" }}>
                    {/* Header with Avatar and Info */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base" style={{ background: "rgb(39, 28, 55)" }}>
                        {testimonial.initial}
                      </div>
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
                      <p className="text-gray-300 text-sm leading-relaxed" style={{ textAlign: "start" }}>
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
