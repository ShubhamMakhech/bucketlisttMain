import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Header } from "@/components/Header"
import { ExperienceCard } from "@/components/ExperienceCard"
import { SEO } from "@/components/SEO"
import { Breadcrumb } from "@/components/Breadcrumb"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Search, SlidersHorizontal } from "lucide-react"
import "@/styles/Experiences.css"

interface FilterState {
  priceRange: [number, number]
  sortBy: string
}

const Experiences = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 10000],
    sortBy: 'title'
  })

  // Debounce search query for API calls could be better, but for now direct state is fine as it's a small app
  // or I can rely on React Query's behavior if I pass searchQuery to queryKey.

  const { data: experiences, isLoading } = useQuery({
    queryKey: ['all-experiences', filters, searchQuery],
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

      // Apply search filter
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`)
      }

      let data
      const { data: queryData, error } = await query

      if (error) throw error
      data = queryData

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
        "url": `https://www.bucketlistt.com/experience/${experience.url_name || experience.id}`,
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
      <section className="section-wrapper section-bg-secondary pt-0">
        <div className="container">

          {/* Top Filter Bar */}
          <div className="experiences-filter-bar">
            {/* Search */}
            <div className="experiences-search-container">
              <Search className="experiences-search-icon" />
              <Input
                placeholder="Search experiences..."
                className="experiences-search-input border-0 bg-transparent ring-0 focus-visible:ring-0 pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="experiences-filters-group">
              {/* Price Range */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="filter-button">
                    <SlidersHorizontal className="w-4 h-4" />
                    Price Range
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4">
                  <div className="space-y-4">
                    <h4 className="font-medium leading-none">Price Range</h4>
                    <Slider
                      defaultValue={[0, 10000]}
                      value={filters.priceRange}
                      max={10000}
                      step={100}
                      onValueChange={(val) => setFilters({ ...filters, priceRange: [val[0], val[1]] })}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>₹{filters.priceRange[0]}</span>
                      <span>₹{filters.priceRange[1]}</span>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Sort By */}
              <Select
                value={filters.sortBy}
                onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
              >
                <SelectTrigger className="sort-select-trigger bg-white">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Name (A-Z)</SelectItem>
                  <SelectItem value="price-low">Price (Low to High)</SelectItem>
                  <SelectItem value="price-high">Price (High to Low)</SelectItem>
                  <SelectItem value="rating">Rating (High to Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Experiences Grid */}
          <div className="">
            {isLoading ? (
              <div className="experiences-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-80 bg-muted animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : experiences && experiences.length > 0 ? (
              <>
                <div className="mb-6 flex justify-between items-center">
                  <p className="text-muted-foreground">
                    Found {experiences.length} experience{experiences.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="experiences-grid">
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
                      urlName={experience.url_name}
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
      </section>
    </div>
  )
}

export default Experiences
