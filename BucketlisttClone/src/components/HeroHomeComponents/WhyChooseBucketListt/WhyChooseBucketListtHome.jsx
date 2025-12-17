import React from 'react'
import "./WhyChooseBucketListtHome.css"
const WhyChooseBucketListtHome = () => {

    const WhyUsData = [
        {
            icon: "/Images/NewIcons/Icons/RiverRaftingImage.svg",
            title: "Premium Adventures",
            description: "Curated experiences with certified operators and safety-first approach.",
        },
        {
            icon: "/Images/NewIcons/Icons/RiverRaftingImage.svg",
            title: "Best Value Deals",
            description: "Competitive pricing with exclusive offers and flexible booking options.",
        },
        {
            icon: "/Images/NewIcons/Icons/RiverRaftingImage.svg",
            title: "Seamless Booking",
            description: "Instant confirmation with free cancellation and 24/7 support.",
        },
        {
            icon: "/Images/NewIcons/Icons/RiverRaftingImage.svg",
            title: "Trusted Platform",
            description: "Verified reviews and ATOAI-certified partners for safe adventures.",
        }
    ]

    return (
        <div className='BackgroundImageContainer SectionPaddingTop SectionPaddingBottom'>
            <div className='overlayImageContainer'>
                <img src="/Images/SkyDivingBackGroundImage.jpeg" alt="" />
            </div>
            <div className='MaxWidthContainer'>
                <div id='WhyChooseBucketListtHomeContainer'>
                    {/* <div className='WhyChooseBucketListtPointsContainer'>
                    <div>
                        <div className='MediumHeading textAlignStart'>
                            And we are ATOAI certified
                        </div>
                        <div className='ATOAIContainer'>
                            <img src="/Images/NewIcons/ATOAI_logo.jpg" alt="" />
                        </div>
                        <div>
                            <p className='textAlignStart'>bucketlistt strictly adheres to the safety, ethical, and operational standards set by the Adventure Tour Operators Association of India (ATOAI). All activities offered on our platform comply with the Basic Minimum Standards prescribed for adventure tourism, ensuring responsible practices, trained staff, certified equipment, and a strong commitment to environmental sustainability. Your safety and experience are our top priorities.</p>
                        </div>

                    </div>
                </div> */}
                    {/* <div className='WhyChooseBucketListtHomeImageContainer'>
                    <div>
                        <img src="https://images.unsplash.com/photo-1677464769678-1a152f183c05?q=80&w=1064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="" />
                    </div>
                </div> */}
                    <div className='WhyChooseBucketListtHomeContent'>
                        <div>
                            <h2 className='SectionHeading textAlignStart ColorWhite'>Why Choose bucketlistt?</h2>
                            <p className='textAlignStart MarginTopSmall ColorWhite'>Our values shape every journey, every interaction, and every detail we design.</p>
                        </div>
                        <div className='MarginTopLarge'>
                            {WhyUsData.map((item, index) => (
                                <div key={index}>
                                    {/* <div>
                                        <img src={item.icon} alt="" />
                                    </div> */}
                                    <div className='WidthShort'>
                                        <h3 className='SmallHeading textAlignStart ColorWhite'>{item.title}</h3>
                                        <p className='textAlignStart MarginTopSmall ColorWhite'>{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className='WhyChooseBucketListtHomeImageContainer'>
                            <img src="https://images.unsplash.com/photo-1659221876406-31a3746f41b9?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WhyChooseBucketListtHome