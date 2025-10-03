
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFavorites } from "@/hooks/useFavorites"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"

interface FavoriteButtonProps {
  experienceId: string
  className?: string
  size?: "sm" | "default" | "lg"
}

export function FavoriteButton({ experienceId, className, size = "sm" }: FavoriteButtonProps) {
  const { user } = useAuth()
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites()
  const navigate = useNavigate()
  const isInFavorites = isFavorite(experienceId)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      navigate('/auth')
      return
    }

    if (isInFavorites) {
      removeFromFavorites(experienceId)
    } else {
      addToFavorites(experienceId)
    }
  }

  return (
    <Button
      variant="ghost"
      size={size === "sm" ? "icon" : size}
      className={cn(
        "hover:bg-red-50 hover:text-red-500 transition-colors",
        isInFavorites && "text-red-500",
        className
      )}
      onClick={handleClick}
    >
      <Heart 
        className={cn(
          "h-4 w-4",
          size === "lg" && "h-5 w-5",
          isInFavorites && "fill-red-500"
        )} 
      />
    </Button>
  )
}
