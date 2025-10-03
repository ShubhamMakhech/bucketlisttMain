
import { ExperienceCard } from "@/components/ExperienceCard"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useFavorites } from "@/hooks/useFavorites"
import { Heart, LogIn } from "lucide-react"
import { useNavigate } from "react-router-dom"

const Favorites = () => {
  const { user } = useAuth()
  const { favorites, isLoading } = useFavorites()
  const navigate = useNavigate()

  const getExperienceImage = (experience: any) => {
    // Use main image_url if available, otherwise try to get primary image from experience_images
    if (experience.image_url) {
      return experience.image_url
    }
    
    // If experience has experience_images array, find primary image
    if (experience.experience_images && experience.experience_images.length > 0) {
      const primaryImage = experience.experience_images.find((img: any) => img.is_primary)
      if (primaryImage) {
        return primaryImage.image_url
      }
      // If no primary image, use first image
      return experience.experience_images[0].image_url
    }
    
    return '/placeholder.svg'
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Sign in to view favorites</h1>
            <p className="text-muted-foreground mb-6">
              Save your favorite experiences and access them anytime.
            </p>
            <Button onClick={() => navigate('/auth')} size="lg">
              <LogIn className="mr-2 h-4 w-4" />
              Sign in
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-6 w-6 text-red-500 fill-red-500" />
          <h1 className="text-3xl font-bold">Whish List</h1>
          <span className="text-muted-foreground">({favorites.length})</span>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-muted-foreground">Loading your favorites...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-6">
              Start exploring and save experiences you love!
            </p>
            <Button onClick={() => navigate('/experiences')} size="lg" style={{ background: "var(--brand-color)" }}>
              Browse Experiences
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((favorite) => (
              <ExperienceCard
                key={favorite.experience_id}
                id={favorite.experiences.id}
                image={getExperienceImage(favorite.experiences)}
                title={favorite.experiences.title}
                category={favorite.experiences.category}
                rating={Number(favorite.experiences.rating)}
                reviews={favorite.experiences.reviews_count?.toString() || '0'}
                price={`From ${favorite.experiences.currency === 'USD' ? '₹' : favorite.experiences.currency} ${favorite.experiences.price}`}
                originalPrice={favorite.experiences.original_price ? `${favorite.experiences.currency === 'USD' ? '₹' : favorite.experiences.currency} ${favorite.experiences.original_price}` : undefined}
                duration={favorite.experiences.duration || undefined}
                groupSize={favorite.experiences.group_size || undefined}
                isSpecialOffer={favorite.experiences.is_special_offer || false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Favorites
