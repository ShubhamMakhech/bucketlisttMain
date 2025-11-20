import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SiVisa, SiMastercard, SiAmericanexpress, SiGooglepay, SiPhonepe, SiPaytm } from "react-icons/si";
import { ArrowRight } from "lucide-react";
import "../Styles/Footer.css";

export function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="FooterContainer container">
      <div className="FooterWrapper">
        {/* Top Section: Logo and Call Us Button */}
        <div className="FooterTopSection">
          <div className="FooterTopLeft">
            <img
              src="https://prepseed.s3.ap-south-1.amazonaws.com/Bucketlistt.png"
              alt="bucketlistt Logo"
              className="FooterLogo"
            />
          </div>
          <div className="FooterTopRight">
            <Button
              variant="ghost"
              className="FooterInstagramButton"
              onClick={() =>
                window.open(
                  "https://www.instagram.com/bucketlistt_experiences/",
                  "_blank"
                )
              }
            >
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span style={{ fontSize: '16px' }}>Follow us on Instagram</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content Section: Links and Image */}
        <div className="FooterMainSection">
          {/* Left Side: Navigation Links */}
          <div className="FooterLinksSection">
            <div className="FooterLinksColumn">
              <h3 className="FooterColumnHeader">Contact</h3>
              <ul className="FooterLinksList">
                <li>
                  <Button
                    variant="link"
                    className="FooterLink"
                    onClick={() => navigate("/contact")}
                  >
                    contact@bucketlistt.com
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="FooterLink"
                    onClick={() => window.open("tel:+918200362890")}
                  >
                    +91 820 036 2890
                  </Button>
                </li>
              </ul>
            </div>

            <div className="FooterLinksColumn">
              <h3 className="FooterColumnHeader">CITIES</h3>
              <ul className="FooterLinksList">
                <li>
                  <Button
                    variant="link"
                    className="FooterLink"
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
                    Rishikesh
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="FooterLink"
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
                    Goa
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="FooterLink"
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
                    Matheran
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="FooterLink"
                  >
                    Coming soon...
                  </Button>
                </li>
              </ul>
            </div>

            <div className="FooterLinksColumn">
              <h3 className="FooterColumnHeader">BUCKETLISTT</h3>
              <ul className="FooterLinksList">
                <li>
                  <Button
                    variant="link"
                    className="FooterLink"
                    onClick={() => navigate("/our-story")}
                  >
                    Our story
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="FooterLink"
                    onClick={() => navigate("/coming-soon")}
                  >
                    Careers
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="FooterLink"
                    onClick={() => navigate("/coming-soon")}
                  >
                    Newsroom
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="FooterLink"
                    onClick={() => navigate("/coming-soon")}
                  >
                    Company blog
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="FooterLink"
                    onClick={() => navigate("/blogs")}
                  >
                    Travel blog
                  </Button>
                </li>
              </ul>
            </div>

            <div className="FooterLinksColumn">
              <h3 className="FooterColumnHeader">PARTNERS</h3>
              <ul className="FooterLinksList">
                <li>
                  <Button
                    variant="link"
                    className="FooterLink"
                    onClick={() => navigate("/coming-soon")}
                  >
                    Experience providers
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="FooterLink"
                    onClick={() => navigate("/coming-soon")}
                  >
                    Affiliates
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="FooterLink"
                    onClick={() => navigate("/coming-soon")}
                  >
                    Creators & influencers
                  </Button>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Side: Image Container */}
          <div className="FooterImageSection">
            <div className="FooterImageContainer">
              <img
                src="https://images.unsplash.com/photo-1683874249404-96b4b590591f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Bucketlistt"
                className="FooterImage"
              />
            </div>
          </div>
        </div>

        {/* Bottom Section: Copyright and Payment Methods */}
        <div className="FooterBottomSection">
          <div className="FooterBottomLeft">
            <span className="FooterCopyright">© 2025 bucketlistt. All rights reserved.</span>
            <Button
              variant="link"
              className="FooterBottomLink"
              onClick={() => navigate("/terms")}
            >
              Terms of usage
            </Button>
            <Button
              variant="link"
              className="FooterBottomLink"
            >
              Privacy policy
            </Button>
            <Button
              variant="link"
              className="FooterBottomLink"
            >
              Company details
            </Button>
          </div>
          <div className="FooterBottomRight">
            {/* <h4 className="FooterPaymentHeader">WE ACCEPT</h4> */}
            <div className="FooterPaymentMethods">
              <div className="FooterPaymentIcon">
                <SiVisa className="w-full h-full" style={{ color: '#1A1F71' }} />
              </div>
              <div className="FooterPaymentIcon">
                <SiMastercard className="w-full h-full" style={{ color: '#EB001B' }} />
              </div>
              <div className="FooterPaymentIcon">
                <SiAmericanexpress className="w-full h-full" style={{ color: '#006FCF' }} />
              </div>
              <div className="FooterPaymentIcon">
                <SiGooglepay className="w-full h-full" style={{ color: '#4285F4' }} />
              </div>
              <div className="FooterPaymentIcon">
                <SiPhonepe className="w-full h-full" style={{ color: '#5F259F' }} />
              </div>
              <div className="FooterPaymentIcon">
                <SiPaytm className="w-full h-full" style={{ color: '#002E6E' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
