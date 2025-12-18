import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SectionHeader from '@/components/commonComponent/SectionHeader'
import "./DestinationsCardsHome.css"

const DestinationsCardsHome = () => {
    const navigate = useNavigate();
    const [currentSet, setCurrentSet] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isInitialMount, setIsInitialMount] = useState(true);

    const Destinations = [
        {
            id: 1,
            title: "Rishikesh",
            tag: "Available",
            image: "https://images.unsplash.com/photo-1643224357772-397a3e2e8387?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            subtitle: "Engage in cultural nights around the fire",
        },
        {
            id: 2,
            title: "Goa",
            tag: "Comming Soon",
            image: "https://images.unsplash.com/photo-1642313281504-77925e214635?q=80&w=1035&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            subtitle: "Engage in cultural nights around the fire",
        },
        {
            id: 3,
            title: "Jaipur",
            tag: "Comming Soon",
            image: "https://plus.unsplash.com/premium_photo-1661963839850-b4be117aff11?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            subtitle: "Engage in cultural nights around the fire",
        },
        {
            id: 4,
            title: "Kerala",
            tag: "Comming Soon",
            image: "https://images.unsplash.com/photo-1597735881932-d9664c9bbcea?q=80&w=983&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            subtitle: "Engage in cultural nights around the fire",
        },
        {
            id: 5,
            title: "Matheran",
            tag: "Comming Soon",
            image: "https://images.unsplash.com/photo-1632091197694-a1c0ee79e203?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            subtitle: "Engage in cultural nights around the fire",
        },
        {
            id: 6,
            title: "Saputara",
            tag: "Comming Soon",
            image: "https://images.unsplash.com/photo-1701154773708-066ef64c3f73?q=80&w=927&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            subtitle: "Engage in cultural nights around the fire",
        },
        {
            id: 7,
            title: "Mysore",
            tag: "Comming Soon",
            image: "https://images.unsplash.com/photo-1614844848029-058f34a0508b?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            subtitle: "Engage in cultural nights around the fire",
        },
        {
            id: 8,
            title: "Darjeeling",
            tag: "Comming Soon",
            image: "https://images.unsplash.com/photo-1617478993559-75ceef413f4a?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            subtitle: "Engage in cultural nights around the fire",
        },

    ]

    useEffect(() => {
        // Mark initial mount as complete after first render
        setIsInitialMount(false);
    }, []);

    useEffect(() => {
        if (isInitialMount) return; // Don't start animation on initial mount

        const interval = setInterval(() => {
            setIsAnimating(true);

            // After all wave animations complete (last card delay + animation duration)
            // 0.3s (last delay) + 0.6s (animation) = 0.9s total
            setTimeout(() => {
                // Change the set first - this will make currentCards = nextCards
                setCurrentSet((prev) => (prev === 0 ? 1 : 0));
                // Wait for React to update, then reset animation state
                // This ensures the new currentCards are rendered before we hide nextCards
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setIsAnimating(false);
                    });
                });
            }, 1000); // Wait for all wave animations to complete
        }, 3000);

        return () => clearInterval(interval);
    }, [isInitialMount]);

    // Get current set of 4 cards
    const getCurrentCards = () => {
        const startIndex = currentSet * 4;
        return Destinations.slice(startIndex, startIndex + 4);
    };

    // Get next set of 4 cards (for transition)
    const getNextCards = () => {
        const nextSet = currentSet === 0 ? 1 : 0;
        const startIndex = nextSet * 4;
        return Destinations.slice(startIndex, startIndex + 4);
    };

    const currentCards = getCurrentCards();
    const nextCards = getNextCards();

    const handleNext = () => {
        setIsAnimating(false); // Stop any ongoing animation
        setCurrentSet((prev) => (prev === 0 ? 1 : 0));
    };

    const handlePrev = () => {
        setIsAnimating(false); // Stop any ongoing animation
        setCurrentSet((prev) => (prev === 0 ? 1 : 0));
    };

    const handleCardClick = (destination) => {
        // Convert title to URL-friendly format
        const destinationName = destination.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();

        // Navigate to new Destinations component with destination name
        navigate(`/destinations/${destinationName}`, {
            state: {
                destinationData: {
                    id: destination.id,
                    title: destination.title,
                    subtitle: destination.subtitle,
                    image: destination.image,
                },
                fromPage: "destination-card-home",
                timestamp: Date.now(),
            },
        });
    };

    return (
        <>
            <div id='DestinationsCardsHomeContainer'>
                <div className='DestinationsCardsHomeContent MaxWidthContainer SectionPaddingTop'>
                    <SectionHeader
                        icon="/Images/NewIcons/travelIcon.png"
                        tag="Destinations"
                        iconStyle="white-circle"
                        heading={
                            <>
                                Explore India's Top Destinations for Holidays, Tours and <span>Weekend</span> Getaways
                            </>
                        }
                        alignment="center"
                        maxWidth="800"
                        withMargin={true}
                    />
                    <div className='DestinationsCardsHomeGrid MarginTopLarge '>
                        {currentCards.map((destination, index) => {
                            const nextCard = nextCards[index];
                            const delay = index * 0.1; // Staggered delay for wave effect

                            return (
                                <div key={`position-${index}`} className='DestinationsCardsHomeGridPosition'>
                                    {/* Current card - visible when not animating, fades out during animation */}
                                    <div
                                        className={`DestinationsCardsHomeGridItem ${isAnimating ? 'fade-out-down-wave' : 'card-visible'}`}
                                        key={`current-${destination.id}-${currentSet}`}
                                        style={isAnimating ? {
                                            animationDelay: `${delay}s`,
                                            cursor: 'pointer'
                                        } : { cursor: 'pointer' }}
                                        onClick={() => handleCardClick(destination)}
                                    >
                                        <div className='DestinationCardTagContainer'>
                                            <span className='ColorWhite'>{destination.tag}</span>
                                        </div>
                                        <div className='DestinationCardBackgroundImage'>
                                            <img src={destination.image} alt="Destination" />
                                        </div>
                                        <div className='CardTitleCommon DestinationCardTitle ColorWhite'>
                                            {destination.title}
                                        </div>
                                    </div>
                                    {/* Next card - fades in during animation, becomes visible after animation */}
                                    {isAnimating && nextCard && (
                                        <div
                                            className='DestinationsCardsHomeGridItem fade-in-up-wave'
                                            key={`next-${nextCard.id}`}
                                            style={{
                                                animationDelay: `${delay + 0.3}s`,
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleCardClick(nextCard)}
                                        >
                                            <div className='DestinationCardTagContainer'>
                                                <span className='ColorWhite'>{nextCard.tag}</span>
                                            </div>
                                            <div className='DestinationCardBackgroundImage'>
                                                <img src={nextCard.image} alt="Destination" />
                                            </div>
                                            <div className='CardTitleCommon DestinationCardTitle ColorWhite'>
                                                {nextCard.title}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {/* Navigation Buttons */}
                    {/* <div className='DestinationsCardsHomeNavigation'>
                        <button 
                            className='DestinationsCardsHomeNavButton DestinationsCardsHomeNavButtonPrev'
                            onClick={handlePrev}
                            aria-label="Previous destinations"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 18l-6-6 6-6"/>
                            </svg>
                            Prev
                        </button>
                        <button 
                            className='DestinationsCardsHomeNavButton DestinationsCardsHomeNavButtonNext'
                            onClick={handleNext}
                            aria-label="Next destinations"
                        >
                            Next
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 18l6-6-6-6"/>
                            </svg>
                        </button>
                    </div> */}
                </div>
            </div>
        </>
    )
}

export default DestinationsCardsHome