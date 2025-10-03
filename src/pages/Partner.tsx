import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";

export default function Partner() {
  const navigate = useNavigate();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleJoinbucketlistt = () => {
    // Navigate back to auth page with vendor signup
    navigate("/auth?mode=vendor");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />
              {/* Hero Image Section */}
              <div className="mb-16">
          <div className="relative h-64 md:h-96 rounded-lg overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  'url("https://www.templepilots.com/wp-content/uploads/2019/11/Temple-Pilots-Paragliding-Kamshet.jpg")',
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            </div>
          </div>
        </div>
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-orange-500 mb-4">
            Ready to access the booming adventure spotrs market in India?
          </h1>
          <p className="text-xl text-orange-400 mb-8">Reach out and join us!</p>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
              How do you want to work with us?
            </h2>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Distributor Card - Hidden/Coming Soon */}
              <Card className="opacity-50 cursor-not-allowed">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-2xl">🏢</span>
                    </div>
                    <div className="flex items-center">
                      <input type="radio" disabled className="mr-3" />
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                        Become a distributor
                      </h3>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-left">
                    You want to distribute bucketlistt's adventure sports experiences to your
                    customers
                  </p>
                  <div className="mt-4 text-center">
                    <span className="bg-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm">
                      Coming Soon
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Supplier Card */}
              <Card className="border-2 border-orange-200 hover:border-orange-300 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-2xl">🌟</span>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        defaultChecked
                        className="mr-3 text-orange-500"
                      />
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                        Become a vendor
                      </h3>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-left">
                    You want to sell your adventure sports experiences with bucketlistt
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8">
              <Button
                onClick={handleJoinbucketlistt}
                className="bg-gray-400 hover:bg-gray-500 text-white px-8 py-3 rounded-lg text-lg"
              >
                Join bucketlistt
              </Button>
            </div>
          </div>
        </div>

        {/* Why Partner with Us Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-orange-500 mb-12">
            Why Partner with Us
          </h2>

          <div className="max-w-6xl mx-auto">
            <p className="text-lg text-gray-700 dark:text-gray-300 text-center mb-12 max-w-3xl mx-auto">
              With partners across Rishikesh, Dharoi and beyond, bucketlistt is a India's leading
              adventure sports activities and services booking platform serving the Free
              Independent Travel (FIT) market.
            </p>

            {/* Benefits with connecting lines */}
            <div className="relative">

              {/* Benefit Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 relative z-10">
                {/* Beloved by FIT Travelers */}
                <div className="flex items-start space-x-4">
                  <div className="w-4 h-4 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      Beloved by FIT Travelers
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Access the fast-growing FIT market in Rishikesh, Dharoi, Ahmedabad and beyond with bucketlistt.
                    </p>
                  </div>
                </div>

                {/* Dependable Technology Solution */}
                <div className="flex items-start space-x-4">
                  <div className="w-4 h-4 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      Dependable Technology Solution
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Enhance operation efficiency with our customized
                      free-for-use Software as a Service (SaaS) solution or get
                      connected with our Application Programming Interface
                      (API).
                    </p>
                  </div>
                </div>

                {/* Diversely Talented Local Team */}
                <div className="flex items-start space-x-4">
                  <div className="w-4 h-4 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      Diversely Talented Local Team
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Based across India, our local team comes from diverse
                      professional and cultural backgrounds, giving us unique
                      insights into local markets and traveler preferences.
                    </p>
                  </div>
                </div>

                {/* Integrated Marketing Channels */}
                <div className="flex items-start space-x-4">
                  <div className="w-4 h-4 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      Integrated Marketing Channels
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      From high-performance media buying to engaging social
                      media and influencer marketing, PR, content marketing,
                      advertising and exclusive partnerships, our comprehensive
                      marketing channels help partners reach a wide & diverse
                      audience.
                    </p>
                  </div>
                </div>

                {/* Unrivaled Partnership */}
                <div className="flex items-start space-x-4 md:col-span-2 lg:col-span-1">
                  <div className="w-4 h-4 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      Unrivaled Partnership
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      You can be India's leading adventure sports brand who Reserves trust us in growing
                      their business. Don't wait. Join us now.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
