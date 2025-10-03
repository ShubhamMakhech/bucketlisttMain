import { Header } from "@/components/Header";
import { DestinationCard } from "@/components/DestinationCard";
import { LoadingGrid } from "@/components/LoadingSpinner";
import { SEO } from "@/components/SEO";
import { Breadcrumb } from "@/components/Breadcrumb";

import { BidirectionalAnimatedSection } from "@/components/BidirectionalAnimatedSection";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

const Destinations = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: destinations, isLoading: destinationsLoading } = useQuery({
    queryKey: ["all-destinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Generate structured data for destinations page
  const destinationsStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Travel Destinations in India - bucketlistt",
    "description": "Explore top travel destinations in India. Discover Rishikesh, Goa, Dharoi and more amazing places for your next adventure with bucketlistt.",
    "url": "https://www.bucketlistt.com/destinations",
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": destinations?.length || 0,
      "itemListElement": destinations?.slice(0, 10).map((destination, index) => ({
        "@type": "TouristDestination",
        "position": index + 1,
        "name": destination.title,
        "description": destination.subtitle || `Discover ${destination.title} with bucketlistt`,
        "image": destination.image_url,
        "url": `https://www.bucketlistt.com/destination/${destination.id}`,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": destination.title,
          "addressCountry": "IN"
        }
      })) || []
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Travel Destinations in India - bucketlistt | Explore Now"
        description="Explore top travel destinations in India. Discover Rishikesh, Goa, Dharoi and more amazing places for your next adventure with bucketlistt."
        keywords="travel destinations India, Rishikesh, Goa, Dharoi, adventure destinations, tourist places India, travel India"
        structuredData={destinationsStructuredData}
      />
      <Header />
      
      {/* Hero Section */}
      <BidirectionalAnimatedSection
        animation="fade-up"
        delay={100}
        duration={800}
      >
        <section className="section-wrapper section-bg-secondary bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
          <div className="container">
            <Breadcrumb 
              items={[
                { label: "Destinations", current: true }
              ]}
              className="mb-6 justify-center"
            />
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
                Explore All Destinations
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Discover amazing places and create unforgettable memories across India
              </p>
            </div>
          </div>
        </section>
      </BidirectionalAnimatedSection>

      {/* Destinations Grid */}
      <BidirectionalAnimatedSection
        animation="fade-up"
        delay={200}
        duration={700}
      >
        <section className="section-wrapper section-bg-primary">
          <div className="container">
            {destinationsLoading ? (
              <LoadingGrid
                count={12}
                className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
                {destinations?.map((destination, index) => (
                  <BidirectionalAnimatedSection
                    key={destination.id}
                    animation="fade-up"
                    delay={100 + (index % 6) * 50}
                    duration={600}
                    className="card-hover"
                  >
                    <DestinationCard
                      id={destination.id}
                      image={destination.image_url || ""}
                      title={destination.title}
                      subtitle={destination.subtitle || ""}
                    />
                  </BidirectionalAnimatedSection>
                ))}
              </div>
            )}

            {destinations && destinations.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">
                  No destinations found. Check back soon for new adventures!
                </p>
              </div>
            )}
          </div>
        </section>
      </BidirectionalAnimatedSection>
    </div>
  );
};

export default Destinations;