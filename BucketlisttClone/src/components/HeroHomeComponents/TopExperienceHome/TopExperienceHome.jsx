import React from 'react'
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./TopExperienceHome.css"
import SectionHeader from '../../commonComponent/SectionHeader'

const TopExperienceHome = () => {

    const navigate = useNavigate();

    const { data: experiences, isLoading: experiencesLoading } = useQuery({
        queryKey: ["experiences"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("experiences")
                .select(
                    `
                    *,
                    experience_images!inner (
                        image_url,
                        is_primary
                    )
                    `
                )
                .order("created_at", { ascending: true })
                .eq("is_active", true)
                .limit(8);

            if (error) throw error;
            return data;
        },
    });

    const getExperienceImage = (experience) => {
        // Use main image_url if available, otherwise use primary image from experience_images
        if (experience.image_url) {
            return experience.image_url;
        }

        // Find primary image from experience_images
        const primaryImage = experience.experience_images?.find(
            (img) => img.is_primary
        );
        return primaryImage?.image_url || "/placeholder.svg";
    };


    const Icons=[
        "/Images/NewIcons/Icons/RiverRaftingImage.svg",
        "/Images/NewIcons/Icons/Tracking.svg",
        "/Images/NewIcons/Icons/MountainImage.svg",
    ]

    const Images = [
        "https://images.unsplash.com/photo-1591007232007-b26dfbbc9a9a?q=80&w=1418&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1706882809719-b228c6e35a7f?q=80&w=986&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1594026634827-fe99c0a22e83?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1531327431456-837da4b1d562?q=80&w=1064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1591007232007-b26dfbbc9a9a?q=80&w=1418&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1591007232007-b26dfbbc9a9a?q=80&w=1418&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"

    ]

    return (
        <>
            <div id='TopExperienceHomeContainer'>
                <div className='TopExperienceHomeContent MaxWidthContainer SectionPaddingTop SectionPaddingBottom'>
                    <SectionHeader
                        icon="/Images/NewIcons/Icons/parachute.png"
                        tag="Top Experiences"
                        iconStyle="white-circle"
                        heading={
                            <>
                                Explore India's Top Destinations for Holidays, Tours and <span>Weekend</span> Getaways
                            </>
                        }
                        alignment="start"
                        maxWidth="800"

                    />
                    <div className='TopExperienceHomeGrid MarginTopLarge'>
                        {experiencesLoading ? (
                            <div>Loading...</div>
                        ) : (
                            <div className='TopExperienceHomeGridContainer'>
                                {experiences.slice(0, 6)?.map((experience, index) => {
                                    const price = `${experience.currency === "USD"
                                        ? "₹"
                                        : experience.currency == "INR"
                                            ? "₹"
                                            : experience.currency
                                        } ${experience.price}`;
                                    const originalPrice = experience.original_price
                                        ? `${experience.currency === "USD"
                                            ? "₹"
                                            : experience.currency == "INR"
                                                ? "₹"
                                                : experience.currency
                                        } ${experience.original_price}`
                                        : null;

                                    const handleCardClick = () => {
                                        const experienceName = experience.url_name || experience.title
                                            .toLowerCase()
                                            .replace(/[^a-z0-9\s-]/g, "")
                                            .replace(/\s+/g, "-")
                                            .replace(/-+/g, "-")
                                            .trim();
                                        navigate(`/experience/${experienceName}`);
                                    };

                                    // Get image from Images array in sequence, cycle if needed
                                    const imageUrl = Images[index % Images.length];
                                    const icon = Icons[index % Icons.length];

                                    return (
                                        <div key={experience.id} className='TopExperienceHomeGridItem' onClick={handleCardClick}>
                                            <div className='TopExperienceHomeGridItemImage'>
                                                <img src={imageUrl} alt={experience.title} />
                                            </div>
                                            <div className='TopExperienceHomeGridItemContent'>
                                                <div className='CardContentFlexContainer'>
                                                    <div className='LocationIcon'>
                                                        <img src={icon} alt="location" />
                                                    </div>
                                                    <div>
                                                        <div className='SmallHeading textAlignStart'>{experience.title}</div>
                                                        <div>
                                                            {experience.description && (
                                                                <p className=" MarginTopMedium textAlignStart"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: experience.description.replace(/<[^>]*>/g, "").substring(0, 100) + "..."
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className='ButtonContainer'>

                                                    </div>
                                                </div>
                                                <div>
                                                    <button className='TopExperienceHomeGridItemButton '>
                                                        {/* <span>Book now</span> */}
                                                        <ArrowRight className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                            {/* 
                                                {experience.duration && (
                                                    <div className='TopExperienceHomeGridItemDuration MarginTopMedium'>
                                                        <span className='ColorBlack'>Duration :</span>
                                                        <div className='TopExperienceHomeGridItemDurationValue'>
                                                            <Clock className="h-4 w-4" />
                                                            <span className='ColorBlack'>{experience.duration}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className='TopExperienceHomeGridItemPrice MarginTopMedium '>
                                                    {originalPrice ? (
                                                        <>
                                                            <span >{originalPrice}</span>
                                                            <span >{price}</span>
                                                        </>
                                                    ) : (
                                                        <span >{price}</span>
                                                    )}
                                                </div>
                                                <button className='TopExperienceHomeGridItemButton MarginTopMedium'>
                                                    <span>Book now</span>
                                                    <ArrowRight className="h-5 w-5" />
                                                </button>
                                            </div> */}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default TopExperienceHome