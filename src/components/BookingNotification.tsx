
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { X, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export const BookingNotification = () => {
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(true)

  const { data: nextBooking } = useQuery({
    queryKey: ['next-booking', user?.id],
    queryFn: async () => {
      if (!user) return null
      
      const now = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          experiences (
            title
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .gte('booking_date', now)
        .order('booking_date', { ascending: true })
        .limit(1)
        .maybeSingle()
      
      if (error) throw error
      return data
    },
    enabled: !!user
  })

  if (!user || !nextBooking || !isVisible) {
    return null
  }

  const bookingDate = format(new Date(nextBooking.booking_date), 'MMM d, yyyy')

  return (
    <div className="relative z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-white" />
            <span className="text-sm md:text-base">
              Hey traveller, your booking is on <strong>{bookingDate}</strong> with us for{' '}
              <strong>{nextBooking.experiences?.title}</strong>. Don't dare forgetting!!
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-8 w-8 p-0 text-white hover:text-white hover:bg-white/20 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
