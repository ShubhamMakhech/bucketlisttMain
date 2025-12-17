import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SiVisa, SiMastercard, SiAmericanexpress, SiGooglepay, SiPhonepe, SiPaytm } from "react-icons/si";
import { HiArrowRight } from "react-icons/hi";
import "./Footer.css";

const Footer = () => {
    const navigate = useNavigate();

    return (
        <footer className="new-footer-container">
            <div className="new-footer-wrapper">
                <div className="new-footer-grid">
                    <div className="new-footer-grid-item">
                        {/* Column 1: Logo and Payment Methods */}
                        <div className="new-footer-logo-section">
                            <div className="new-footer-logo">
                                <img
                                    src="https://prepseed.s3.ap-south-1.amazonaws.com/Bucketlistt.png"
                                    alt="bucketlistt Logo"
                                />
                            </div>
                            <div className="new-footer-payment-grid">
                                <div className="new-footer-payment-icon">
                                    <SiVisa className="w-full h-full" style={{ color: '#1A1F71' }} />
                                </div>
                                <div className="new-footer-payment-icon">
                                    <SiMastercard className="w-full h-full" style={{ color: '#EB001B' }} />
                                </div>
                                <div className="new-footer-payment-icon">
                                    <SiAmericanexpress className="w-full h-full" style={{ color: '#006FCF' }} />
                                </div>
                                <div className="new-footer-payment-icon">
                                    <SiGooglepay className="w-full h-full" style={{ color: '#4285F4' }} />
                                </div>
                                <div className="new-footer-payment-icon">
                                    <SiPhonepe className="w-full h-full" style={{ color: '#5F259F' }} />
                                </div>
                                <div className="new-footer-payment-icon">
                                    <SiPaytm className="w-full h-full" style={{ color: '#002E6E' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="new-footer-grid-item">
                        {/* Column 2 - Wider: Destinations */}
                        <div className="new-footer-destinations-section">
                            <h2 className="new-footer-destinations-heading">Explore Our Amazing Destinations and Travel Experiences</h2>
                            <div className="new-footer-destinations-list">
                                <Button
                                    variant="link"
                                    className="new-footer-destination-link"
                                    onClick={() =>
                                        navigate("/destination/rishikesh", {
                                            state: {
                                                destinationData: {
                                                    id: "5f19264e-4947-4cb6-a35b-e2e20881c355",
                                                    title: "Rishikesh",
                                                },
                                                fromPage: "footer",
                                            },
                                        })
                                    }
                                >
                                    <span>Rishikesh</span>
                                    <HiArrowRight className="new-footer-arrow-icon" />
                                </Button>
                                <Button
                                    variant="link"
                                    className="new-footer-destination-link"
                                    onClick={() =>
                                        navigate("/destination/goa", {
                                            state: {
                                                destinationData: {
                                                    id: "102c9601-2356-4d5b-a79c-d6bf0534eca4",
                                                    title: "Goa",
                                                },
                                                fromPage: "footer",
                                            },
                                        })
                                    }
                                >
                                    <span>Goa</span>
                                    <HiArrowRight className="new-footer-arrow-icon" />
                                </Button>
                                <Button
                                    variant="link"
                                    className="new-footer-destination-link"
                                    onClick={() =>
                                        navigate("/destination/matheran", {
                                            state: {
                                                destinationData: {
                                                    id: "a4958a9b-afeb-4694-96dd-505fe2c23c51",
                                                    title: "Matheran",
                                                },
                                                fromPage: "footer",
                                            },
                                        })
                                    }
                                >
                                    <span>Matheran</span>
                                    <HiArrowRight className="new-footer-arrow-icon" />
                                </Button>
                                <Button
                                    variant="link"
                                    className="new-footer-destination-link"
                                >
                                    <span>Coming soon...</span>
                                    <HiArrowRight className="new-footer-arrow-icon" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="new-footer-grid-item">
                        {/* Column 3: About us */}
                        <div className="new-footer-section">
                            <h2 className="new-footer-section-heading">About us</h2>
                            <div className="new-footer-links-list">
                                <Button
                                    variant="link"
                                    className="new-footer-link"
                                    onClick={() => navigate("/our-story")}
                                >
                                    Founder's story
                                </Button>
                                <Button
                                    variant="link"
                                    className="new-footer-link"
                                    onClick={() => navigate("/coming-soon")}
                                >
                                    Careers
                                </Button>
                                <Button
                                    variant="link"
                                    className="new-footer-link"
                                    onClick={() => navigate("/coming-soon")}
                                >
                                    Newsroom
                                </Button>
                                <Button
                                    variant="link"
                                    className="new-footer-link"
                                    onClick={() => navigate("/blogs")}
                                >
                                    Blogs
                                </Button>
                                <Button
                                    variant="link"
                                    className="new-footer-link"
                                    onClick={() => navigate("/blogs")}
                                >
                                    Travel blog
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="new-footer-grid-item">
                        {/* Column 4: Partner with Us */}
                        <div className="new-footer-section">
                            <h2 className="new-footer-section-heading">Partner with Us</h2>
                            <div className="new-footer-links-list">
                                <Button
                                    variant="link"
                                    className="new-footer-link"
                                    onClick={() => navigate("/partner")}
                                >
                                    Experience providers
                                </Button>
                                <Button
                                    variant="link"
                                    className="new-footer-link"
                                    onClick={() => navigate("/coming-soon")}
                                >
                                    Affiliates
                                </Button>
                                <Button
                                    variant="link"
                                    className="new-footer-link"
                                    onClick={() => navigate("/coming-soon")}
                                >
                                    Creators & influencers
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="new-footer-grid-item">
                        {/* Column 5: Contact */}
                        <div className="new-footer-section">
                            <h2 className="new-footer-section-heading">Contact</h2>
                            <div className="new-footer-links-list">
                                <Button
                                    variant="link"
                                    className="new-footer-link"
                                    onClick={() => navigate("/contact")}
                                >
                                    contact@bucketlistt.com
                                </Button>
                                <Button
                                    variant="link"
                                    className="new-footer-link"
                                    onClick={() => window.open("tel:+918200362890")}
                                >
                                    +91 820 036 2890
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
