import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Bell, Gift } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";

const ComingSoon = () => {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-3">
        <div className="max-w-2xl mx-auto text-center">
          {/* Back Button */}
          <div className="mb-3">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>

          {/* Main Content */}
          <Card className="bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 dark:from-brand-primary/10 dark:to-brand-secondary/10 border-2 border-brand-primary/20 dark:border-brand-primary/30">
            <CardContent className="p-10">
              <div className="mb-8">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>

                <h1 className="text-4xl md:leading-tight md:text-5xl font-bold mb-4 bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                  Coming Soon!
                </h1>

                <p className="text-xl text-muted-foreground mb-8">
                  We're working hard to bring you an amazing rewards experience.
                  Stay tuned for exciting updates!
                </p>
              </div>

              {/* Features Preview */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                  <Gift className="h-8 w-8 text-[#940fdb]" />
                  <div className="text-left">
                    <h3 className="font-semibold">Exclusive Rewards</h3>
                    <p className="text-sm text-muted-foreground">
                      Earn points for every booking
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                  <Bell className="h-8 w-8 text-[#940fdb]" />
                  <div className="text-left">
                    <h3 className="font-semibold">Early Access</h3>
                    <p className="text-sm text-muted-foreground">
                      Get notified when available
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-4">
                <Button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary-dark hover:to-brand-primary-light text-white px-8 py-3 text-lg"
                >
                  Back to Profile
                </Button>

                <p className="text-sm text-muted-foreground">
                  Want to be the first to know? Check back soon for updates!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
       {/* Auth Modal */}
            <AuthModal
              open={isAuthModalOpen}
              onClose={() => setIsAuthModalOpen(false)}
            />
    </div>
  );
};

export default ComingSoon;
