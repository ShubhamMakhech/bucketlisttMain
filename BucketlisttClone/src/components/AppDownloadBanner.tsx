import { BidirectionalAnimatedSection } from "./BidirectionalAnimatedSection";

const AppDownloadBanner = () => {
  return (
    <BidirectionalAnimatedSection
      animation="fade-up"
      delay={200}
      duration={700}
    >
      <section className=" bg-background PaddingSectionTop">
        <div className="container max-w-6xl mx-auto">
          <div
            className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 min-h-[200px] md:min-h-[300px]"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--neutral-900) / 0.8), hsl(var(--neutral-900) / 0.8)), url('/coming-soon.png')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-transparent"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between h-full p-6 md:p-8 lg:p-12">
              {/* Left Content */}
              <div className="flex-1 text-center md:text-left mb-6 md:mb-0">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 md:mb-4">
                  Get bucketlistt app, save up to 80% (Coming soon)
                </h2>
                <p className="text-slate-200 text-sm md:text-base lg:text-lg max-w-md">
                  Enjoy exclusive deals, offline access to your tickets & live
                  booking updates.
                </p>

                {/* App Store Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center md:justify-start">
                  <a
                    href="#"
                    className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-300"
                  >
                    <div className="flex items-center space-x-3">
                      <svg
                        className="w-6 h-6"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                      </svg>
                      <div className="text-left">
                        <div className="text-xs">Download on the</div>
                        <div className="text-sm font-semibold">App Store</div>
                      </div>
                    </div>
                  </a>

                  <a
                    href="#"
                    className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-300"
                  >
                    <div className="flex items-center space-x-3">
                      <svg
                        className="w-6 h-6"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                      </svg>
                      <div className="text-left">
                        <div className="text-xs">Get it on</div>
                        <div className="text-sm font-semibold">Google Play</div>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </BidirectionalAnimatedSection>
  );
};

export default AppDownloadBanner;
