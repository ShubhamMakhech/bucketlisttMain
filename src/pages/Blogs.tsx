import { Header } from "@/components/Header";
import { DestinationCard } from "@/components/DestinationCard";
import { LoadingGrid } from "@/components/LoadingSpinner";
import { SEO } from "@/components/SEO";
import { Breadcrumb } from "@/components/Breadcrumb";

import { BidirectionalAnimatedSection } from "@/components/BidirectionalAnimatedSection";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const destinationsData = [
  {
    id: "1",
    title: "Ultimate Things to Do in Rishikesh – Bucketlistt.com Launch",
    subtitle:
      "Discover Rishikesh’s top attractions, thrilling adventures, and spiritual experiences with Bucketlistt.com launching soon in this scenic adventure capital.",
    image_url:
      "https://lp-cms-production.imgix.net/2025-01/shutterstock2542346155-cropped.jpg",
    sections: [
      {
        title: "Day 1 – Arrival & Spiritual Immersion",
        items: [
          {
            name: "Morning:",
            points: [
              "Arrive in Rishikesh and check into your hotel/camp.",
              "Start your day with a visit to Triveni Ghat – one of the most sacred bathing ghats in Rishikesh. Take a peaceful walk along the Ganges.",
            ],
          },
          {
            name: "Afternoon:",
            points: [
              "Explore Ram Jhula & Laxman Jhula, the iconic suspension bridges.",
              "Enjoy a riverside meal at popular cafés like The Beatles Café or Ganga View Café – perfect for travelers.",
            ],
          },
          {
            name: "Evening:",
            points: [
              "Witness the Ganga Aarti at Triveni Ghat – a mesmerizing spiritual experience with chants, lamps, and prayers by the river.",
              "Take a calm evening stroll along the riverbank before heading back to your stay.",
            ],
          },
        ],
      },
      {
        title: "Day 2 – Adventure & Thrills",
        items: [
          {
            name: "Morning:",
            points: [
              "Go for River Rafting on the Ganges – choose from 9km, 16km, or 26km rafting stretches depending on your adventure level.",
              "Experience Cliff Jumping during rafting (if available).",
            ],
          },
          {
            name: "Afternoon:",
            points: [
              "Post-adventure lunch at a local café.",
              "Try Bungee Jumping, Giant Swing, or Flying Fox at India’s highest bungee jumping spot (book in advance).",
            ],
          },
          {
            name: "Evening:",
            points: [
              "Relax with a yoga or meditation session at a local ashram.",
              "Enjoy a cozy bonfire evening if you’re camping by the river.",
            ],
          },
        ],
      },
      {
        title: "Day 3 – Local Exploration & Farewell",
        items: [
          {
            name: "Morning:",
            points: [
              "Start early with a sunrise trek to Kunjapuri Temple for breathtaking Himalayan views.",
              "Visit Beatles Ashram (Chaurasi Kutia) – explore the art-filled meditation huts and history of The Beatles’ visit.",
            ],
          },
          {
            name: "Afternoon:",
            points: [
              "Go for a local market walk at Rishikesh Main Market. Shop for souvenirs, spiritual items, and handmade jewelry.",
              "Treat yourself to authentic Garhwali or North Indian cuisine before you leave.",
            ],
          },
          {
            name: "Evening:",
            points: [
              "Take one last riverside walk, capture memories, and depart with peace and adventure in your heart.",
            ],
          },
        ],
      },
    ],
    cta: "Book your adventure in Rishikesh with Bucketlistt.com and turn your travel dreams into reality!",
    seo_keywords: [
      "Rishikesh things to do",
      "Bucketlistt Rishikesh launch",
      "river rafting Rishikesh",
      "adventure activities India",
    ],
  },
];

const Blogs = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  //   const { data: destinations, isLoading: destinationsLoading } = useQuery({
  //     queryKey: ["all-destinations"],
  //     queryFn: async () => {
  //       const { data, error } = await supabase
  //         .from("destinations")
  //         .select("*")
  //         .order("created_at", { ascending: true });

  //       if (error) throw error;
  //       return data;
  //     },
  //   });

  // Generate structured data for destinations page
  const destinationsStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Travel Blogs in India - bucketlistt",
    description:
      "Explore top travel blogs in India. Discover Rishikesh, Goa, Dharoi and more amazing places for your next adventure with bucketlistt.",
    url: "https://www.bucketlistt.com/destinations",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: destinationsData?.length || 0,
      itemListElement:
        destinationsData?.slice(0, 10).map((destination, index) => ({
          "@type": "TouristDestination",
          position: index + 1,
          name: destination.title,
          description:
            destination.subtitle ||
            `Discover ${destination.title} with bucketlistt`,
          image: destination.image_url,
          url: `https://www.bucketlistt.com/blogs/${destination.id}`,
          address: {
            "@type": "PostalAddress",
            addressLocality: destination.title,
            addressCountry: "IN",
          },
        })) || [],
    },
  };

  const destinationsLoading = false;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Travel Blogs in India - bucketlistt | Explore Now"
        description="Explore top travel blogs in India. Discover Rishikesh, Goa, Dharoi and more amazing places for your next adventure with bucketlistt."
        keywords="travel blogs India, Rishikesh, Goa, Dharoi, adventure destinations, tourist places India, travel India"
        structuredData={destinationsStructuredData}
      />
      <Header />

      {/* Hero Section */}
      <BidirectionalAnimatedSection
        animation="fade-up"
        delay={100}
        duration={800}
      >
        <section className="section-wrapper section-bg-secondary bg-gradient-to-br from-[#940fdb]/10 to-[#6a0fb5]/10 dark:from-[#940fdb]/30 dark:to-[#6a0fb5]/30">
          <div className="container">
            <Breadcrumb
              items={[{ label: "Blogs", current: true }]}
              className="mb-6 justify-center"
            />
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-brand-primary">
                Explore All Blogs
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Discover amazing places and create unforgettable memories across
                India
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
                className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6">
                {destinationsData?.map((destination, index) => (
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
                      navigatePage={`/blogs/${destination.id}`}
                    />
                  </BidirectionalAnimatedSection>
                ))}
              </div>
            )}

            {destinationsData && destinationsData.length === 0 && (
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

export default Blogs;
