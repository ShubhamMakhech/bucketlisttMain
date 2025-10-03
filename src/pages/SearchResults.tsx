
import { useSearchParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { DestinationCard } from "@/components/DestinationCard"
import { ExperienceCard } from "@/components/ExperienceCard"
import { ArrowLeft, Search } from "lucide-react"

const SearchResults = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q') || ''

  const { data: destinations, isLoading: destinationsLoading } = useQuery({
    queryKey: ['search-destinations', query],
    queryFn: async () => {
      if (!query.trim()) return []
      
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .or(`title.ilike.%${query}%,subtitle.ilike.%${query}%,description.ilike.%${query}%`)
        .order('title')
      
      if (error) throw error
      return data
    },
    enabled: !!query
  })

  const { data: experiences, isLoading: experiencesLoading } = useQuery({
    queryKey: ['search-experiences', query],
    queryFn: async () => {
      if (!query.trim()) return []
      
      const { data, error } = await supabase
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
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%,location.ilike.%${query}%`)
        .order('rating', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!query
  })

  const isLoading = destinationsLoading || experiencesLoading
  const hasResults = (destinations && destinations.length > 0) || (experiences && experiences.length > 0)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 px-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6 hover:bg-accent"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Search className="h-6 w-6 text-orange-500" />
              <h1 className="text-3xl font-bold">Search Results</h1>
            </div>
            {query && (
              <p className="text-muted-foreground">
                Showing results for "{query}"
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-lg">Searching...</div>
            </div>
          ) : !query.trim() ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Enter a search term to find destinations and activities.</p>
            </div>
          ) : !hasResults ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No results found for "{query}". Try different keywords.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Destinations Results */}
              {destinations && destinations.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold mb-6">Destinations ({destinations.length})</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {destinations.map((destination) => (
                      <DestinationCard
                        key={destination.id}
                        id={destination.id}
                        image={destination.image_url || ''}
                        title={destination.title}
                        subtitle={destination.subtitle || ''}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Experiences Results */}
              {experiences && experiences.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold mb-6">Activities ({experiences.length})</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                        originalPrice={experience.original_price ? `${experience.currency === 'USD' ? '₹' : experience.currency == 'INR' ? '₹' : experience.currency} ${experience.original_price}` : undefined}
                        duration={experience.duration || undefined}
                        groupSize={experience.group_size || undefined}
                        isSpecialOffer={experience.is_special_offer || false}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
      </div>
    </div>
  )
}

export default SearchResults
