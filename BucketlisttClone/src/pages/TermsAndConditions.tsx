
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

const TermsAndConditions = () => {
  const navigate = useNavigate()

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate("/")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto px-4 py-4 md:py-5 max-w-4xl">
        {/* Header Section */}
        <div className="mb-4 md:mb-5 text-left">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mb-3 hover:bg-accent transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1.5 tracking-tight text-left">
            Terms and Conditions
          </h1>
          <p className="text-xs text-muted-foreground font-medium text-left">
            Last updated: June 15, 2025
          </p>
        </div>

        {/* Content Section */}
        <div className="space-y-5 md:space-y-6 pb-6 text-left">
          <section className="border-b border-border/40 pb-4 text-left">
            <h2 className="text-base md:text-lg font-bold text-foreground mb-2 tracking-tight text-left">
              1. Acceptance of Terms
            </h2>
            <p className="text-sm text-muted-foreground leading-6 text-left">
              By accessing and using bucketlistt's platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="border-b border-border/40 pb-4 text-left">
            <h2 className="text-base md:text-lg font-bold text-foreground mb-2 tracking-tight text-left">
              2. Platform Description
            </h2>
            <p className="text-sm text-muted-foreground leading-6 text-left">
              bucketlistt is an online platform that connects travelers with experience providers. We facilitate the discovery and booking of unique travel experiences, tours, and activities worldwide.
            </p>
          </section>

          <section className="border-b border-border/40 pb-4 text-left">
            <h2 className="text-base md:text-lg font-bold text-foreground mb-3 tracking-tight text-left">
              3. User Accounts
            </h2>
            <div className="space-y-3">
              <div className="text-left">
                <h3 className="text-sm md:text-base font-semibold text-foreground mb-1.5 text-left">
                  3.1 Registration
                </h3>
                <p className="text-sm text-muted-foreground leading-6 text-left">
                  To access certain features, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
                </p>
              </div>
              
              <div className="text-left">
                <h3 className="text-sm md:text-base font-semibold text-foreground mb-1.5 text-left">
                  3.2 Account Security
                </h3>
                <p className="text-sm text-muted-foreground leading-6 text-left">
                  You are responsible for safeguarding the password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                </p>
              </div>
            </div>
          </section>

          <section className="border-b border-border/40 pb-4 text-left">
            <h2 className="text-base md:text-lg font-bold text-foreground mb-3 tracking-tight text-left">
              4. Booking and Payment
            </h2>
            <div className="space-y-3">
              <div className="text-left">
                <h3 className="text-sm md:text-base font-semibold text-foreground mb-1.5 text-left">
                  4.1 Booking Process
                </h3>
                <p className="text-sm text-muted-foreground leading-6 text-left">
                  When you make a booking through our platform, you enter into a contract directly with the experience provider. bucketlistt acts as an intermediary to facilitate the booking process.
                </p>
              </div>
              
              <div className="text-left">
                <h3 className="text-sm md:text-base font-semibold text-foreground mb-1.5 text-left">
                  4.2 Payment
                </h3>
                <p className="text-sm text-muted-foreground leading-6 text-left">
                  Payment is processed securely through our platform. Prices are displayed in the currency specified by the experience provider. Additional fees may apply.
                </p>
              </div>
              
              <div className="text-left">
                <h3 className="text-sm md:text-base font-semibold text-foreground mb-1.5 text-left">
                  4.3 Cancellation Policy
                </h3>
                <p className="text-sm text-muted-foreground leading-6 text-left">
                  Cancellation policies vary by experience provider. Please review the specific cancellation policy before making a booking. Some bookings may be non-refundable.
                </p>
              </div>
            </div>
          </section>

          <section className="border-b border-border/40 pb-4 text-left">
            <h2 className="text-base md:text-lg font-bold text-foreground mb-3 tracking-tight text-left">
              5. Experience Providers
            </h2>
            <div className="space-y-3">
              <div className="text-left">
                <h3 className="text-sm md:text-base font-semibold text-foreground mb-1.5 text-left">
                  5.1 Vendor Responsibilities
                </h3>
                <p className="text-sm text-muted-foreground leading-6 text-left">
                  Experience providers are responsible for the accuracy of their listings, providing services as described, and maintaining appropriate licenses and insurance.
                </p>
              </div>
              
              <div className="text-left">
                <h3 className="text-sm md:text-base font-semibold text-foreground mb-1.5 text-left">
                  5.2 Commission
                </h3>
                <p className="text-sm text-muted-foreground leading-6 text-left">
                  bucketlistt may charge commission fees to experience providers for bookings made through the platform.
                </p>
              </div>
            </div>
          </section>

          <section className="border-b border-border/40 pb-4 text-left">
            <h2 className="text-base md:text-lg font-bold text-foreground mb-2 tracking-tight text-left">
              6. User Conduct
            </h2>
            <p className="text-sm text-muted-foreground leading-6 mb-2 text-left">
              You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-6 ml-4 text-left">
              <li>Use the platform for any unlawful purpose</li>
              <li>Post false, inaccurate, misleading, or defamatory content</li>
              <li>Interfere with or disrupt the platform's operation</li>
              <li>Attempt to gain unauthorized access to other user accounts</li>
              <li>Use automated systems to access the platform without permission</li>
            </ul>
          </section>

          <section className="border-b border-border/40 pb-4 text-left">
            <h2 className="text-base md:text-lg font-bold text-foreground mb-3 tracking-tight text-left">
              7. Content and Intellectual Property
            </h2>
            <div className="space-y-3">
              <div className="text-left">
                <h3 className="text-sm md:text-base font-semibold text-foreground mb-1.5 text-left">
                  7.1 User Content
                </h3>
                <p className="text-sm text-muted-foreground leading-6 text-left">
                  You retain ownership of content you submit but grant bucketlistt a license to use, display, and distribute such content in connection with the platform.
                </p>
              </div>
              
              <div className="text-left">
                <h3 className="text-sm md:text-base font-semibold text-foreground mb-1.5 text-left">
                  7.2 Platform Content
                </h3>
                <p className="text-sm text-muted-foreground leading-6 text-left">
                  All content on the platform, including text, graphics, logos, and software, is the property of bucketlistt or its licensors and is protected by intellectual property laws.
                </p>
              </div>
            </div>
          </section>

          <section className="border-b border-border/40 pb-4 text-left">
            <h2 className="text-base md:text-lg font-bold text-foreground mb-2 tracking-tight text-left">
              8. Privacy
            </h2>
            <p className="text-sm text-muted-foreground leading-6 text-left">
              Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use our platform.
            </p>
          </section>

          <section className="border-b border-border/40 pb-4 text-left">
            <h2 className="text-base md:text-lg font-bold text-foreground mb-3 tracking-tight text-left">
              9. Disclaimers and Limitation of Liability
            </h2>
            <div className="space-y-3">
              <div className="text-left">
                <h3 className="text-sm md:text-base font-semibold text-foreground mb-1.5 text-left">
                  9.1 Platform Availability
                </h3>
                <p className="text-sm text-muted-foreground leading-6 text-left">
                  We strive to maintain platform availability but do not guarantee uninterrupted access. The platform is provided "as is" without warranties.
                </p>
              </div>
              
              <div className="text-left">
                <h3 className="text-sm md:text-base font-semibold text-foreground mb-1.5 text-left">
                  9.2 Experience Quality
                </h3>
                <p className="text-sm text-muted-foreground leading-6 text-left">
                  bucketlistt is not responsible for the quality, safety, or legality of experiences provided by third-party vendors.
                </p>
              </div>
              
              <div className="text-left">
                <h3 className="text-sm md:text-base font-semibold text-foreground mb-1.5 text-left">
                  9.3 Limitation of Liability
                </h3>
                <p className="text-sm text-muted-foreground leading-6 text-left">
                  To the maximum extent permitted by law, bucketlistt's liability is limited to the amount paid for the specific booking in question.
                </p>
              </div>
            </div>
          </section>

          <section className="border-b border-border/40 pb-4 text-left">
            <h2 className="text-base md:text-lg font-bold text-foreground mb-2 tracking-tight text-left">
              10. Dispute Resolution
            </h2>
            <p className="text-sm text-muted-foreground leading-6 text-left">
              Any disputes arising from these terms will be resolved through binding arbitration in accordance with the laws of India.
            </p>
          </section>

          <section className="border-b border-border/40 pb-4 text-left">
            <h2 className="text-base md:text-lg font-bold text-foreground mb-2 tracking-tight text-left">
              11. Changes to Terms
            </h2>
            <p className="text-sm text-muted-foreground leading-6 text-left">
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className="border-b border-border/40 pb-4 text-left">
            <h2 className="text-base md:text-lg font-bold text-foreground mb-2 tracking-tight text-left">
              12. Tourism Guidelines Compliance
            </h2>
            <p className="text-sm text-muted-foreground leading-6 text-left">
              We follow the ATOAI tourism guidelines as outlined by their executive committee. For detailed information, please refer to the{" "}
              <a 
                href="https://tourism.gov.in/sites/default/files/2020-01/1527867024_gallery_image.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-orange-500 hover:text-orange-600 underline font-medium transition-colors duration-200"
              >
                ATOAI tourism guidelines
              </a>.
            </p>
          </section>

          <section className="border-b border-border/40 pb-4 text-left">
            <h2 className="text-base md:text-lg font-bold text-foreground mb-2 tracking-tight text-left">
              13. Contact Information
            </h2>
            <p className="text-sm text-muted-foreground leading-6 text-left">
              If you have questions about these Terms and Conditions, please contact us through our Contact Us page or email us at{" "}
              <a 
                href="mailto:contact@bucketlistt.com"
                className="text-orange-500 hover:text-orange-600 underline font-medium transition-colors duration-200"
              >
                founder@bucketlistt.com
              </a>.
            </p>
          </section>

          {/* Footer Note */}
          <div className="border-t border-border pt-4 mt-4 text-left">
            <p className="text-xs text-muted-foreground leading-5 italic text-left">
              These terms and conditions constitute the entire agreement between you and bucketlistt regarding the use of the platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsAndConditions
