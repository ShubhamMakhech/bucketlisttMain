
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Header } from "@/components/Header"
import { ExperienceCard } from "@/components/ExperienceCard"
import { ExperienceFilters } from "@/components/ExperienceFilters"
import { SEO } from "@/components/SEO"
import { Breadcrumb } from "@/components/Breadcrumb"


interface FilterState {
  priceRange: [number, number]
  locations: string[]
  categories: string[]
  sortBy: string
}

const Experiences = () => {
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 10000],
    locations: [],
    categories: [],
    sortBy: 'title'
  })

  const { data: experiences, isLoading } = useQuery({
    queryKey: ['all-experiences', filters],
    queryFn: async () => {
      let query = supabase
        .from('experiences')
        .select(`
          *,
          experience_categories (
            categories (
              id,
              name,
              icon,
              color
            )
          )
        `)

      // Apply price filter
      query = query
        .gte('price', filters.priceRange[0])
        .lte('price', filters.priceRange[1])

      // Apply location filter
      if (filters.locations.length > 0) {
        query = query.in('location', filters.locations)
      }

      let data
      const { data: queryData, error } = await query

      if (error) throw error
      data = queryData

      // Apply category filter using the junction table
      if (filters.categories.length > 0) {
        const filteredData = data.filter(experience => 
          experience.experience_categories?.some(ec => 
            filters.categories.includes(ec.categories?.name || '')
          )
        )
        data = filteredData
      }

      // Apply sorting
      if (filters.sortBy === 'price-low') {
        data = data.sort((a, b) => (a.price || 0) - (b.price || 0))
      } else if (filters.sortBy === 'price-high') {
        data = data.sort((a, b) => (b.price || 0) - (a.price || 0))
      } else if (filters.sortBy === 'rating') {
        data = data.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      } else {
        data = data.sort((a, b) => a.title.localeCompare(b.title))
      }

      return data
    }
  })

  const { data: filterOptions } = useQuery({
    queryKey: ['filter-options'],
    queryFn: async () => {
      // Get experiences with their categories to ensure we only show options that have experiences
      const { data: experiencesWithCategories, error: experiencesError } = await supabase
        .from('experiences')
        .select(`
          location,
          experience_categories (
            categories (
              name
            )
          )
        `)
      
      if (experiencesError) throw experiencesError

      // Extract unique locations that have experiences
      const locations = [...new Set(
        experiencesWithCategories
          .map(exp => exp.location)
          .filter(Boolean)
      )]

      // Extract unique categories that have experiences
      const categoriesSet = new Set<string>()
      experiencesWithCategories.forEach(exp => {
        exp.experience_categories?.forEach(ec => {
          if (ec.categories?.name) {
            categoriesSet.add(ec.categories.name)
          }
        })
      })
      const categories = Array.from(categoriesSet)
      
      return { locations, categories }
    }
  })

  // Generate structured data for experiences page
  const experiencesStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Adventure Experiences in India - bucketlistt",
    "description": "Browse all adventure experiences and activities in India. From bungee jumping to river rafting, find your next thrill with bucketlistt.",
    "url": "https://www.bucketlistt.com/experiences",
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": experiences?.length || 0,
      "itemListElement": experiences?.slice(0, 10).map((experience, index) => ({
        "@type": "TouristAttraction",
        "position": index + 1,
        "name": experience.title,
        "description": experience.description || `Experience ${experience.title} with bucketlistt`,
        "image": experience.image_url,
        "url": `https://www.bucketlistt.com/experience/${experience.id}`,
        "offers": {
          "@type": "Offer",
          "price": experience.price,
          "priceCurrency": experience.currency === "USD" ? "INR" : experience.currency
        }
      })) || []
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Adventure Experiences in India - bucketlistt | Book Now"
        description="Browse all adventure experiences and activities in India. From bungee jumping to river rafting, find your next thrill with bucketlistt. ATOAI certified tours."
        keywords="adventure experiences India, bungee jumping, river rafting, trekking, adventure activities, ATOAI certified, adventure tours India"
        structuredData={experiencesStructuredData}
      />
      <Header />
      
      {/* Header Section */}
      <section className="section-wrapper-sm section-bg-primary">
        <div className="container">
          <Breadcrumb 
            items={[
              { label: "Experiences", current: true }
            ]}
            className="mb-6"
          />
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">All Experiences</h1>
            <p className="text-muted-foreground">
              Discover amazing experiences around the world
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="section-wrapper section-bg-secondary">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <ExperienceFilters
              filters={filters}
              onFiltersChange={setFilters}
              filterOptions={filterOptions}
            />
          </div>

          {/* Experiences Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 bg-muted animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : experiences && experiences.length > 0 ? (
              <>
                <div className="mb-6">
                  <p className="text-muted-foreground">
                    Found {experiences.length} experience{experiences.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {experiences.map((experience) => (
                    <ExperienceCard
                      key={experience.id}
                      id={experience.id}
                      image={experience.image_url || ''}
                      title={experience.title}
                      categories={experience.experience_categories?.map(ec => ec.categories) || []}
                      rating={Number(experience.rating)}
                      reviews={experience.reviews_count?.toString() || '0'}
                      price={`${experience.currency === 'USD' ? '₹' : experience.currency == 'INR' ? '₹' : experience.currency} ${experience.price}`}
                      originalPrice={experience.original_price ? `${experience.currency === 'USD' ? '₹' : experience.currency} ${experience.original_price}` : undefined}
                      duration={experience.duration || undefined}
                      groupSize={experience.group_size || undefined}
                      isSpecialOffer={experience.is_special_offer || false}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No experiences found matching your criteria.
                </p>
              </div>
            )}
          </div>
        </div>
        </div>
      </section>
    </div>
  )
}

export default Experiences
