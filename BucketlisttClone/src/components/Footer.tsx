import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SiVisa, SiMastercard, SiAmericanexpress, SiGooglepay, SiPhonepe, SiPaytm } from "react-icons/si";
import "../Styles/Footer.css";

export function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="FooterContainer">
      <div className="FooterBackgroundOverlay">
        <div className="FooterSkylineBackground"></div>
        <div className="FooterContentWrapper container">
          {/* Main Content Section: Links */}
          <div className="FooterMainSection">
            {/* Navigation Links */}
            <div className="FooterLinksSection">
              <div className="FooterLinksColumn FooterLogoColumn">
                <div className="FooterLogoContainer">
                  <img
                    src="https://prepseed.s3.ap-south-1.amazonaws.com/Bucketlistt.png"
                    alt="bucketlistt Logo"
                    className="FooterLogo"
                  />
                </div>
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
                <span className="FooterCopyright">© 2025 bucketlistt. All rights reserved.</span>
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
              <h3 className="FooterColumnHeader">About us</h3>
              <ul className="FooterLinksList">
                <li>
                  <Button
                    variant="link"
                    className="FooterLink"
                    onClick={() => navigate("/our-story")}
                  >
                    Founder's story
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
                    onClick={() => navigate("/blogs")}
                  >
                    Blogs
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
              <h3 className="FooterColumnHeader">Partner with Us</h3>
              <ul className="FooterLinksList">
                <li>
                  <Button
                    variant="link"
                    className="FooterLink"
                    onClick={() => navigate("/partner")}
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
            <div className="FooterLinksColumn">
              <h3 className="FooterColumnHeader">Legal & Contact</h3>
              <ul className="FooterLinksList">
                <li>
                  <Button
                    variant="link"
                    className="FooterLink"
                    onClick={() => navigate("/terms")}
                  >
                    Terms of usage
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="FooterLink"
                  >
                    Privacy policy
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="FooterLink"
                  >
                    Company details
                  </Button>
                </li>
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
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
