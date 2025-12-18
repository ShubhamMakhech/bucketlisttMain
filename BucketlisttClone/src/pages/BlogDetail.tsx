import { useParams, useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BidirectionalAnimatedSection } from "@/components/BidirectionalAnimatedSection";

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

const BlogDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch blog by slug
  const { data: blog, isLoading } = useQuery({
    queryKey: ["blog", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data as Blog;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-16 px-4 text-center">
          <p className="text-muted-foreground">Loading blog...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8 md:py-16 px-4">
          <h1 className="text-xl md:text-2xl font-bold mb-2">Blog Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The blog you are looking for doesn't exist.
          </p>
          <Button
            onClick={() => navigate("/blogs")}
            variant="default"
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blogs
          </Button>
        </div>
      </div>
    );
  }

  // Generate structured data for blog post
  const blogStructuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.meta_title || blog.title,
    description: blog.meta_description || blog.excerpt || blog.title,
    image:
      blog.featured_image_url ||
      "https://www.bucketlistt.com/bucketListt_logo.svg",
    datePublished: blog.published_at,
    dateModified: blog.updated_at,
    author: {
      "@type": "Organization",
      name: "bucketlistt",
    },
    publisher: {
      "@type": "Organization",
      name: "bucketlistt",
      logo: {
        "@type": "ImageObject",
        url: "https://www.bucketlistt.com/bucketListt_logo.svg",
      },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={blog.meta_title || blog.title}
        description={blog.meta_description || blog.excerpt || blog.title}
        keywords={
          blog.meta_keywords?.join(", ") || "travel blog, adventure, India"
        }
        image={blog.featured_image_url || undefined}
        url={`https://www.bucketlistt.com/blogs/${blog.slug}`}
        type="article"
        structuredData={blogStructuredData}
      />

      {/* Hero Section */}
      <BidirectionalAnimatedSection
        animation="fade-up"
        delay={100}
        duration={800}
      >
        <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] overflow-hidden">
          {blog.featured_image_url ? (
            <img
              src={blog.featured_image_url}
              alt={blog.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#940fdb]/20 to-[#6a0fb5]/20" />
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center px-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold max-w-4xl"
            >
              {blog.title}
            </motion.h1>
          </div>
        </div>
      </BidirectionalAnimatedSection>

      {/* Breadcrumb */}
      <div className="container px-4 md:px-6 pt-4 md:pt-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Blogs", href: "/blogs" },
            { label: blog.title, current: true },
          ]}
        />
      </div>

      {/* Blog Content */}
      <BidirectionalAnimatedSection
        animation="fade-up"
        delay={200}
        duration={700}
      >
        <div className="container py-6 md:py-8 px-4 md:px-6 max-w-4xl mx-auto">
          {/* Excerpt */}
          {blog.excerpt && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8 leading-relaxed"
            >
              {blog.excerpt}
            </motion.p>
          )}

          {/* Content */}
          <div id="BlogDetailContent">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="prose prose-sm md:prose-base lg:prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: blog.content }}
              style={{
                wordWrap: "break-word",
                overflowWrap: "break-word",
              }}
            />
          </div>

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-8 md:mt-12"
          >
            <Button
              onClick={() => navigate("/blogs")}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blogs
            </Button>
          </motion.div>
        </div>
      </BidirectionalAnimatedSection>

      <style>{`
        .prose img {
          width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1.5rem 0;
        }
        .prose h1, .prose h2, .prose h3 {
          margin-top: 1.5rem;
          margin-bottom: 1rem;
        }
        .prose p {
          margin-bottom: 1rem;
          line-height: 1.75;
        }
        .prose ul, .prose ol {
          margin: 1rem 0;
          padding-left: 1.5rem;
        }
        .prose li {
          margin: 0.5rem 0;
        }
        .prose a {
          color: hsl(var(--brand-primary));
          text-decoration: underline;
        }
        .prose a:hover {
          color: hsl(var(--brand-primary-dark));
        }
        @media (max-width: 768px) {
          .prose {
            font-size: 14px;
          }
          .prose h1 {
            font-size: 1.5rem;
          }
          .prose h2 {
            font-size: 1.25rem;
          }
          .prose h3 {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </div>
  );
};

export default BlogDetail;
