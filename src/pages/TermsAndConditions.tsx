
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

const TermsAndConditions = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-2">Terms and Conditions</h1>
          <p className="text-muted-foreground">Last updated: June 15, 2025</p>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using bucketlistt's platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Platform Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                bucketlistt is an online platform that connects travelers with experience providers. We facilitate the discovery and booking of unique travel experiences, tours, and activities worldwide.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium">3.1 Registration</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To access certain features, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
                </p>
                
                <h3 className="text-xl font-medium">3.2 Account Security</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You are responsible for safeguarding the password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Booking and Payment</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium">4.1 Booking Process</h3>
                <p className="text-muted-foreground leading-relaxed">
                  When you make a booking through our platform, you enter into a contract directly with the experience provider. bucketlistt acts as an intermediary to facilitate the booking process.
                </p>
                
                <h3 className="text-xl font-medium">4.2 Payment</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Payment is processed securely through our platform. Prices are displayed in the currency specified by the experience provider. Additional fees may apply.
                </p>
                
                <h3 className="text-xl font-medium">4.3 Cancellation Policy</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Cancellation policies vary by experience provider. Please review the specific cancellation policy before making a booking. Some bookings may be non-refundable.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Experience Providers</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium">5.1 Vendor Responsibilities</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Experience providers are responsible for the accuracy of their listings, providing services as described, and maintaining appropriate licenses and insurance.
                </p>
                
                <h3 className="text-xl font-medium">5.2 Commission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  bucketlistt may charge commission fees to experience providers for bookings made through the platform.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. User Conduct</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Use the platform for any unlawful purpose</li>
                <li>Post false, inaccurate, misleading, or defamatory content</li>
                <li>Interfere with or disrupt the platform's operation</li>
                <li>Attempt to gain unauthorized access to other user accounts</li>
                <li>Use automated systems to access the platform without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Content and Intellectual Property</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium">7.1 User Content</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You retain ownership of content you submit but grant bucketlistt a license to use, display, and distribute such content in connection with the platform.
                </p>
                
                <h3 className="text-xl font-medium">7.2 Platform Content</h3>
                <p className="text-muted-foreground leading-relaxed">
                  All content on the platform, including text, graphics, logos, and software, is the property of bucketlistt or its licensors and is protected by intellectual property laws.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Disclaimers and Limitation of Liability</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium">9.1 Platform Availability</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We strive to maintain platform availability but do not guarantee uninterrupted access. The platform is provided "as is" without warranties.
                </p>
                
                <h3 className="text-xl font-medium">9.2 Experience Quality</h3>
                <p className="text-muted-foreground leading-relaxed">
                  bucketlistt is not responsible for the quality, safety, or legality of experiences provided by third-party vendors.
                </p>
                
                <h3 className="text-xl font-medium">9.3 Limitation of Liability</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To the maximum extent permitted by law, bucketlistt's liability is limited to the amount paid for the specific booking in question.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Dispute Resolution</h2>
              <p className="text-muted-foreground leading-relaxed">
                Any disputes arising from these terms will be resolved through binding arbitration in accordance with the laws of India.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Tourism Guidelines Compliance</h2>
              <p className="text-muted-foreground leading-relaxed">
                We follow the ATOAI tourism guidelines as outlined by their executive committee. For detailed information, please refer to the{" "}
                <a 
                  href="https://tourism.gov.in/sites/default/files/2020-01/1527867024_gallery_image.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:text-orange-600 underline"
                >
                  ATOAI tourism guidelines
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about these Terms and Conditions, please contact us through our Contact Us page or email us at contact@bucketlistt.com.
              </p>
            </section>

            <div className="border-t pt-8 mt-12">
              <p className="text-sm text-muted-foreground">
                These terms and conditions constitute the entire agreement between you and bucketlistt regarding the use of the platform.
              </p>
            </div>
        </div>
      </div>
    </div>
  )
}

export default TermsAndConditions
