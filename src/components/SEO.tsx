import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  structuredData?: object;
}

export const SEO: React.FC<SEOProps> = ({
  title = "bucketlistt - Discover Adventures & Plan Your Dream Trips",
  description = "Discover India's best adventure experiences with bucketlistt. Book bungee jumping, rafting, trekking & more. ATOAI certified tours with lowest prices guaranteed.",
  keywords = "adventure tours, travel experiences, India tourism, bungee jumping, rafting, trekking, ATOAI certified, bucket list adventures",
  image = "https://www.bucketlistt.com/bucketListt_logo.svg",
  url,
  type = "website",
  structuredData,
}) => {
  const location = useLocation();
  const currentUrl = url || `https://www.bucketlistt.com${location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const selector = property
        ? `meta[property="${name}"]`
        : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;

      if (!meta) {
        meta = document.createElement("meta");
        if (property) {
          meta.setAttribute("property", name);
        } else {
          meta.setAttribute("name", name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Update basic meta tags
    updateMetaTag("description", description);
    updateMetaTag("keywords", keywords);

    // Update Open Graph tags
    updateMetaTag("og:title", title, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:image", image, true);
    updateMetaTag("og:url", currentUrl, true);
    updateMetaTag("og:type", type, true);

    // Update Twitter Card tags
    updateMetaTag("twitter:title", title);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", image);

    // Update canonical URL
    let canonical = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", currentUrl);

    // Add structured data if provided
    if (structuredData) {
      const existingScript = document.querySelector(
        'script[data-seo="dynamic"]'
      );
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement("script");
      script.setAttribute("type", "application/ld+json");
      script.setAttribute("data-seo", "dynamic");
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    // Cleanup function
    return () => {
      const dynamicScript = document.querySelector(
        'script[data-seo="dynamic"]'
      );
      if (dynamicScript) {
        dynamicScript.remove();
      }
    };
  }, [title, description, keywords, image, currentUrl, type, structuredData]);

  return null;
};

// Helper function to generate structured data for different page types
export const generateStructuredData = {
  experience: (experience: any) => ({
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: experience.title,
    description: experience.description,
    image: experience.image_url,
    url: `https://www.bucketlistt.com/experience/${experience.id}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: experience.location,
      addressCountry: "IN",
    },
    aggregateRating: experience.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: experience.rating,
          reviewCount: experience.reviews_count || 0,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      price: experience.price,
      priceCurrency:
        experience.currency === "USD" ? "INR" : experience.currency,
      availability: "https://schema.org/InStock",
    },
  }),

  destination: (destination: any) => ({
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: destination.title,
    description: destination.subtitle || destination.description,
    image: destination.image_url,
    url: `https://www.bucketlistt.com/destination/${destination.id}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: destination.title,
      addressCountry: "IN",
    },
  }),

  breadcrumb: (items: Array<{ name: string; url: string }>) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }),
};
