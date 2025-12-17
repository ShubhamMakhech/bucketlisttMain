import React from "react";
import HeroHome from "./HeroHome/HeroHome";
import DestinationsCardsHome from "./DestinationsCardsHome/DestinationsCardsHome";
import TopExperienceHome from "./TopExperienceHome/TopExperienceHome";
import WhyChooseBucketListtHome from "./WhyChooseBucketListt/WhyChooseBucketListtHome";
import CurveGallery from "../commonComponent/CurveGallery/CurveGallery";
import Testimonials from "./Testimonials/Testimonials";
const HeroRoutes = () => {
    return (
        <>
            <HeroHome />
            <DestinationsCardsHome />
            <TopExperienceHome />
            <WhyChooseBucketListtHome />
            <Testimonials />
          
           
            {/* <CurveGallery /> */}
        </>
    )
}

export default HeroRoutes;