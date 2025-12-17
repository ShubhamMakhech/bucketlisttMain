
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export function useFavorites() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return []
      
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          experiences (*)
        `)
        .eq('user_id', user.id)
      
      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const addToFavorites = useMutation({
    mutationFn: async (experienceId: string) => {
      if (!user) throw new Error('Must be logged in')
      
      const { data, error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, experience_id: experienceId })
        .select()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      toast({
        title: "Added to favorites",
        description: "Experience saved to your favorites!",
      })
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast({
          title: "Already in favorites",
          description: "This experience is already in your favorites.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to add to favorites. Please try again.",
          variant: "destructive"
        })
      }
    }
  })

  const removeFromFavorites = useMutation({
    mutationFn: async (experienceId: string) => {
      if (!user) throw new Error('Must be logged in')
      
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('experience_id', experienceId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      toast({
        title: "Removed from favorites",
        description: "Experience removed from your favorites.",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove from favorites. Please try again.",
        variant: "destructive"
      })
    }
  })

  const isFavorite = (experienceId: string) => {
    return favorites.some(fav => fav.experience_id === experienceId)
  }

  return {
    favorites,
    isLoading,
    addToFavorites: addToFavorites.mutate,
    removeFromFavorites: removeFromFavorites.mutate,
    isFavorite,
    favoritesCount: favorites.length
  }
}
