import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, ArrowRight } from "lucide-react";
import SectionHeader from '../../commonComponent/SectionHeader';
import "./Testimonials.css";

const Testimonials = () => {
    const leftScrollRef = useRef(null);
    const rightScrollRef = useRef(null);
    const [isPaused, setIsPaused] = useState(false);
    const leftAnimationRef = useRef(null);
    const rightAnimationRef = useRef(null);

    // Testimonials data from TestimonialCarousel
    const testimonials = [
        {
            id: "1",
            name: "Arjun Sharma",
            location: "Delhi, India",
            rating: 5,
            image: "https://rishikeshcamp.in/img/act/bungee2.jpg",
            review: "Bungee jumping in Rishikesh was absolutely thrilling! The 83-meter jump from Jumpin Heights was the most exhilarating experience of my life. The staff was professional and made sure I felt safe throughout.",
            experience: "Rishikesh Bungee Jumping",
            initial: "A",
        },
        {
            id: "2",
            name: "Priya Patel",
            location: "Mumbai, India",
            rating: 5,
            image: "https://www.panchvaticottage.com/images/ganga-river-rating-in-rishikesh.jpg",
            review: "River rafting on the Ganges was incredible! The rapids were exciting and the scenery was breathtaking. Our guide Ravi was amazing and taught us so much about the local culture and river safety.",
            experience: "Rishikesh River Rafting",
            initial: "P",
        },
        {
            id: "3",
            name: "Vikram Singh",
            location: "Jaipur, India",
            rating: 5,
            image: "https://rishikesh.app/te/activities/rock-climbing/rock-climbing-03.jpg",
            review: "The cliff jumping and rock climbing combo was perfect! Rishikesh offers such diverse adventure activities. The instructors were well-trained and the equipment was top-notch. Highly recommend!",
            experience: "Rishikesh Adventure Sports",
            initial: "V",
        },
        {
            id: "4",
            name: "Ananya Gupta",
            location: "Bangalore, India",
            rating: 4,
            image: "https://www.seawatersports.com/images/activies/slide/ziplining-in-uttarakhand-price.jpg",
            review: "Zip-lining across the valley was amazing! The views of the Himalayas and Ganges were spectacular. It's a must-do activity when in Rishikesh. The whole experience was well-organized and safe.",
            experience: "Rishikesh Zip Lining",
            initial: "A",
        },
        {
            id: "5",
            name: "Rohit Kumar",
            location: "Chennai, India",
            rating: 5,
            image: "https://rishikeshcamp.in/img/act/bungee2.jpg",
            review: "Trekking to Neer Garh Waterfall was refreshing after all the adventure activities. The natural beauty of Rishikesh is unmatched. Perfect combination of adventure and nature therapy!",
            experience: "Rishikesh Trekking & Waterfall",
            initial: "R",
        },
        {
            id: "6",
            name: "Kavya Reddy",
            location: "Hyderabad, India",
            rating: 5,
            image: "-",
            review: "Flying fox was an adrenaline rush like no other! Soaring over the Ganges at high speed was both scary and exciting. The team at Rishikesh made sure everything was perfect. Unforgettable experience!",
            experience: "Rishikesh Flying Fox",
            initial: "K",
        },
        {
            id: "7",
            name: "Megha Joshi",
            location: "Pune, India",
            rating: 4,
            image: "https://www.tourmyindia.com/blog//wp-content/uploads/2018/04/Camping-in-Rishikesh.jpg",
            review: "Camping by the riverside in Rishikesh was a peaceful escape from city life. The tents were clean and comfortable, and the bonfire nights were a highlight. Food could have been better, but overall a memorable experience.",
            experience: "Rishikesh Riverside Camping",
            initial: "M",
        },
        {
            id: "8",
            name: "Siddharth Menon",
            location: "Kochi, India",
            rating: 5,
            image: "https://www.adventurenation.com/blog/wp-content/uploads/2015/09/rafting-in-rishikesh.jpg",
            review: "I was a bit nervous about rafting, but the safety measures and the friendly guides put me at ease. The thrill of conquering the rapids with my friends is something I'll never forget. Highly recommended for first-timers!",
            experience: "White Water Rafting",
            initial: "S",
        },
        {
            id: "9",
            name: "Neha Saini",
            location: "Lucknow, India",
            rating: 3,
            image: "https://www.holidify.com/images/cmsuploads/compressed/Neergarh-Waterfall_20180322163913.jpg",
            review: "The trek to Neergarh Waterfall was beautiful, but the trail was a bit crowded and littered in some places. The waterfall itself was stunning and worth the effort. Go early in the morning for a quieter experience.",
            experience: "Neergarh Waterfall Trek",
            initial: "N",
        },
        {
            id: "10",
            name: "Amitabh Verma",
            location: "Gurgaon, India",
            rating: 5,
            image: "https://www.rishikeshtourism.in/images/rafting-in-rishikesh.jpg",
            review: "Tried the adventure package with my family. The organizers were punctual and everything was well-coordinated. My kids loved the zipline and the food at the camp was delicious. Will definitely come back next year!",
            experience: "Adventure Family Package",
            initial: "A",
        },
        {
            id: "11",
            name: "Tanvi Desai",
            location: "Ahmedabad, India",
            rating: 4,
            image: "https://www.rishikeshadventure.com/images/rock-climbing.jpg",
            review: "Rock climbing was tougher than I expected but the instructors were patient and encouraging. I felt a real sense of achievement reaching the top. Would love to try more activities next time.",
            experience: "Rock Climbing",
            initial: "T",
        },
        {
            id: "12",
            name: "Rahul Chatterjee",
            location: "Kolkata, India",
            rating: 5,
            image: "-",
            review: "The adventure team was very professional and safety was their top priority. I did bungee jumping and it was a once-in-a-lifetime experience. The view from the top was breathtaking!",
            experience: "Bungee Jumping",
            initial: "R",
        },
    ];

    // Duplicate testimonials for seamless infinite scroll
    const duplicatedTestimonials = [...testimonials, ...testimonials, ...testimonials];

    useEffect(() => {
        const leftContainer = leftScrollRef.current;
        const rightContainer = rightScrollRef.current;

        if (!leftContainer || !rightContainer) return;

        let leftPosition = 0;
        let rightPosition = 0;
        const speed = 0.5; // Scroll speed

        const animate = () => {
            if (!isPaused) {
                // Left scroll (moving left)
                leftPosition -= speed;
                if (Math.abs(leftPosition) >= leftContainer.scrollWidth / 3) {
                    leftPosition = 0;
                }
                leftContainer.style.transform = `translateX(${leftPosition}px)`;

                // Right scroll (moving right)
                rightPosition += speed;
                if (rightPosition >= rightContainer.scrollWidth / 3) {
                    rightPosition = 0;
                }
                rightContainer.style.transform = `translateX(${rightPosition}px)`;
            }

            leftAnimationRef.current = requestAnimationFrame(animate);
        };

        leftAnimationRef.current = requestAnimationFrame(animate);

        return () => {
            if (leftAnimationRef.current) {
                cancelAnimationFrame(leftAnimationRef.current);
            }
        };
    }, [isPaused]);

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`h-3.5 w-3.5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            />
        ));
    };


    return (
        <div id='TestimonialsContainer' className='SectionPaddingTop SectionPaddingBottom'>
            <div className='MaxWidthContainer'>
                <SectionHeader
                    icon="/Images/NewIcons/Icons/Reviews.png"
                    tag="Testimonials"
                    iconStyle="white-circle"
                    heading={
                        <>
                            What Our Clients Are Saying
                        </>
                    }
                    alignment="center"
                    maxWidth="800"
                    withMargin={true}
                />
                {/* <p className=' MarginTopMedium MaxWidth800NoMargin' style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                    We take pride in delivering exceptional solutions that deliver great results. But don't just take our word for it.
                </p> */}

                <div
                    className='TestimonialsScrollContainer MarginTopLarge'
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {/* Left fade shadow */}
                    <div className='TestimonialsFadeLeft'></div>

                    {/* Right fade shadow */}
                    <div className='TestimonialsFadeRight'></div>

                    {/* Top row - scrolling left */}
                    <div className='TestimonialsRow TestimonialsRowLeft'>
                        <div className='TestimonialsScrollContent' ref={leftScrollRef}>
                            {duplicatedTestimonials.map((testimonial, index) => (
                                <div key={`left-${testimonial.id}-${index}`} className='TestimonialCard'>
                                    <div className='TestimonialQuote'>
                                        "{testimonial.review}"
                                    </div>
                                    <div className='TestimonialInfo'>
                                        <div className='TestimonialInfoContent'>
                                            <div className='SmallHeading ColorBlack' style={{ fontSize: '1rem', lineHeight: '1.3' }}>{testimonial.name}</div>
                                            <div className='TestimonialRating'>
                                                {renderStars(testimonial.rating)}
                                            </div>
                                            <div className='SecondaryColorTextDark TestimonialLocation'>
                                                {testimonial.location}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom row - scrolling right */}
                    <div className='TestimonialsRow TestimonialsRowRight MarginTopSmall'>
                        <div className='TestimonialsScrollContent' ref={rightScrollRef}>
                            {duplicatedTestimonials.map((testimonial, index) => (
                                <div key={`right-${testimonial.id}-${index}`} className='TestimonialCard'>
                                    <div className='TestimonialQuote'>
                                        "{testimonial.review}"
                                    </div>
                                    <div className='TestimonialInfo'>
                                        <div className='TestimonialInfoContent'>
                                            <div className='SmallHeading ColorBlack' style={{ fontSize: '1rem', lineHeight: '1.3' }}>{testimonial.name}</div>
                                            <div className='TestimonialRating'>
                                                {renderStars(testimonial.rating)}
                                            </div>
                                            <div className='SecondaryColorTextDark TestimonialLocation'>
                                                {testimonial.location}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className='textAlignCenter MarginTopLarge'>
                    <button className='TestimonialsSeeAllButton'>
                        <span>See all Reviews</span>
                        <ArrowRight className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Testimonials;
