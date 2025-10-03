import React, { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface Destination {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  image_url: string | null
  best_time_to_visit: string | null
  recommended_duration: string | null
  timezone: string | null
  currency: string | null
  language: string | null
  weather_info: any | null
}

interface DestinationDropdownProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
}

export function DestinationDropdown({ 
  value, 
  onValueChange, 
  placeholder = "Select a destination",
  required = false,
  className = ""
}: DestinationDropdownProps) {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchDestinations()
  }, [])

  const fetchDestinations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .order('title')

      if (error) {
        console.error('Error fetching destinations:', error)
        toast({
          title: "Error loading destinations",
          description: "Could not load destinations. Please try again.",
          variant: "destructive"
        })
        return
      }

      setDestinations(data || [])
    } catch (error) {
      console.error('Error fetching destinations:', error)
      toast({
        title: "Error loading destinations",
        description: "Could not load destinations. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleValueChange = (selectedValue: string) => {
    onValueChange(selectedValue)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="destination">
        Destination {required && '*'}
      </Label>
      <Select
        value={value}
        onValueChange={handleValueChange}
        required={required}
        disabled={loading}
      >
        <SelectTrigger>
          <SelectValue 
            placeholder={loading ? "Loading destinations..." : placeholder} 
          />
        </SelectTrigger>
        <SelectContent>
          {destinations.length === 0 && !loading ? (
            <SelectItem value="" disabled>
              No destinations available
            </SelectItem>
          ) : (
            destinations.map((destination) => (
              <SelectItem key={destination.id} value={destination.id}>
                <span className="font-medium">
                  {destination.title}
                  {destination.subtitle && (
                    <span className="text-sm text-muted-foreground ml-2">({destination.subtitle})</span>
                  )}
                </span>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  )
}