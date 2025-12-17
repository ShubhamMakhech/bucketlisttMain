import { DestinationCard } from "@/components/DestinationCard";
import { LoadingGrid } from "@/components/LoadingSpinner";
import { SEO } from "@/components/SEO";
import { Breadcrumb } from "@/components/Breadcrumb";

import { BidirectionalAnimatedSection } from "@/components/BidirectionalAnimatedSection";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
}

const Blogs = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch active blogs (no published_at condition required)
  const { data: blogs, isLoading: blogsLoading } = useQuery({
    queryKey: ["blogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching blogs:", error);
        throw error;
      }

      return data as Blog[];
    },
  });

  // Generate structured data for blogs page
  const blogsStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Travel Blogs in India - bucketlistt",
    description:
      "Explore top travel blogs in India. Discover Rishikesh, Goa, Dharoi and more amazing places for your next adventure with bucketlistt.",
    url: "https://www.bucketlistt.com/blogs",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: blogs?.length || 0,
      itemListElement:
        blogs?.slice(0, 10).map((blog, index) => ({
          "@type": "BlogPosting",
          position: index + 1,
          name: blog.title,
          description:
            blog.excerpt ||
            blog.meta_description ||
            `Read about ${blog.title} on bucketlistt`,
          image:
            blog.featured_image_url ||
            "https://www.bucketlistt.com/bucketListt_logo.svg",
          url: `https://www.bucketlistt.com/blogs/${blog.slug}`,
          datePublished: blog.published_at,
          dateModified: blog.created_at,
        })) || [],
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Travel Blogs in India - bucketlistt | Explore Now"
        description="Explore top travel blogs in India. Discover Rishikesh, Goa, Dharoi and more amazing places for your next adventure with bucketlistt."
        keywords="travel blogs India, Rishikesh, Goa, Dharoi, adventure destinations, tourist places India, travel India"
        structuredData={blogsStructuredData}
      />

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
              className="mb-4 md:mb-6 justify-center"
            />
            <div className="text-center max-w-3xl mx-auto px-4">
              <h1 className="CommonH1 text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-brand-primary">
                Explore All Blogs
              </h1>
              <p className="text-sm md:text-lg text-muted-foreground">
                Discover amazing places and create unforgettable memories across
                India
              </p>
            </div>
          </div>
        </section>
      </BidirectionalAnimatedSection>

      {/* Blogs Grid */}
      <BidirectionalAnimatedSection
        animation="fade-up"
        delay={200}
        duration={700}
      >
        <section className="section-wrapper section-bg-primary SectionPaddingTop SectionPaddingBottom">
          <div className="container">
            {blogsLoading ? (
              <LoadingGrid
                count={6}
                className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3"
              />
            ) : (
              <>
                {blogs && blogs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {blogs.map((blog, index) => (
                      <BidirectionalAnimatedSection
                        key={blog.id}
                        animation="fade-up"
                        delay={100 + (index % 6) * 50}
                        duration={600}
                        className="card-hover"
                      >
                        <DestinationCard
                          id={blog.slug}
                          image={blog.featured_image_url || "/placeholder.svg"}
                          title={blog.title}
                          subtitle={blog.excerpt || blog.meta_description || ""}
                          navigatePage={`/blogs/${blog.slug}`}
                        />
                      </BidirectionalAnimatedSection>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-base md:text-lg text-muted-foreground">
                      No blogs found. Check back soon for new adventures!
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </BidirectionalAnimatedSection>
    </div>
  );
};

export default Blogs;
