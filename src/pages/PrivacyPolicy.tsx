import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

const PrivacyPolicy = () => {
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
                        Privacy Policy
                    </h1>
                    <p className="text-xs text-muted-foreground font-medium text-left">
                        Last updated: March 9, 2026
                    </p>
                </div>

                <div className="space-y-5 md:space-y-6 pb-6 text-left">
                    <p className="text-sm text-muted-foreground leading-6 text-left">
                        Welcome to BucketListt. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use <a href="https://bucketlistt.com" className="text-orange-500 hover:underline" target="_blank" rel="noopener noreferrer">https://bucketlistt.com</a>.
                    </p>

                    <section className="border-b border-border/40 pb-4 text-left">
                        <h2 className="text-base md:text-lg font-bold text-foreground mb-2 tracking-tight text-left">
                            Information We Collect
                        </h2>
                        <p className="text-sm text-muted-foreground leading-6 text-left mb-2">
                            We may collect basic information such as:
                        </p>
                        <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-6 ml-4 text-left">
                            <li>Name and email address (when creating an account)</li>
                            <li>Profile information you choose to provide</li>
                            <li>Usage data such as device type, browser, and pages visited</li>
                        </ul>
                    </section>

                    <section className="border-b border-border/40 pb-4 text-left">
                        <h2 className="text-base md:text-lg font-bold text-foreground mb-2 tracking-tight text-left">
                            How We Use Your Information
                        </h2>
                        <p className="text-sm text-muted-foreground leading-6 text-left mb-2">
                            We use the collected information to:
                        </p>
                        <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-6 ml-4 text-left">
                            <li>Create and manage your account</li>
                            <li>Provide and improve our services</li>
                            <li>Personalize your experience</li>
                            <li>Communicate important updates</li>
                        </ul>
                    </section>

                    <section className="border-b border-border/40 pb-4 text-left">
                        <h2 className="text-base md:text-lg font-bold text-foreground mb-2 tracking-tight text-left">
                            Third-Party Services
                        </h2>
                        <p className="text-sm text-muted-foreground leading-6 text-left">
                            We may use trusted third-party services for authentication, analytics, and infrastructure. These services may process limited user data as required to operate the platform.
                        </p>
                    </section>

                    <section className="border-b border-border/40 pb-4 text-left">
                        <h2 className="text-base md:text-lg font-bold text-foreground mb-2 tracking-tight text-left">
                            Data Security
                        </h2>
                        <p className="text-sm text-muted-foreground leading-6 text-left">
                            We take reasonable measures to protect your information, but no method of transmission over the internet is completely secure.
                        </p>
                    </section>

                    <section className="border-b border-border/40 pb-4 text-left">
                        <h2 className="text-base md:text-lg font-bold text-foreground mb-2 tracking-tight text-left">
                            Data Sharing
                        </h2>
                        <p className="text-sm text-muted-foreground leading-6 text-left">
                            We do not sell your personal information. We only share data when required to operate our services or comply with legal obligations.
                        </p>
                    </section>

                    <section className="border-b border-border/40 pb-4 text-left">
                        <h2 className="text-base md:text-lg font-bold text-foreground mb-2 tracking-tight text-left">
                            Changes to This Policy
                        </h2>
                        <p className="text-sm text-muted-foreground leading-6 text-left">
                            We may update this Privacy Policy occasionally. Updates will be posted on this page.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}

export default PrivacyPolicy
