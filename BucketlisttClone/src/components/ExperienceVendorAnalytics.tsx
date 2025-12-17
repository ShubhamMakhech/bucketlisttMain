import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  DollarSign, 
  Users,
  TrendingUp,
  IndianRupee,
  Clock,
  MapPin,
  Mail,
  Phone
} from 'lucide-react'
import { format, subDays } from 'date-fns'

interface ExperienceVendorAnalyticsProps {
  experienceId: string
  experienceTitle: string
  experiencePrice: number
}

export const ExperienceVendorAnalytics = ({ 
  experienceId, 
  experienceTitle, 
  experiencePrice 
}: ExperienceVendorAnalyticsProps) => {
  const { user } = useAuth()

  // Fetch bookings for this specific experience
  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['experience-bookings', experienceId],
    queryFn: async () => {
      if (!user || !experienceId) return null
      
      const thirtyDaysAgo = subDays(new Date(), 30)
      
      console.log('Fetching bookings for experience:', experienceId)
      console.log('Current user:', user)
      
      // First, let's check all bookings for this experience (without status filter)
      const { data: allBookingsDebug, error: debugError } = await supabase
        .from('bookings')
        .select('id, status, experience_id, total_participants, booking_date, user_id')
        .eq('experience_id', experienceId)
      
      console.log('All bookings for this experience (debug):', allBookingsDebug)
      console.log('Debug error (if any):', debugError)
      
      // Let's also try to get the experience details to verify ownership
      const { data: experienceDetails, error: expError } = await supabase
        .from('experiences')
        .select('id, vendor_id, title')
        .eq('id', experienceId)
        .single()
      
      console.log('Experience details:', experienceDetails)
      console.log('Is user the vendor?', experienceDetails?.vendor_id === user?.id)
      
      // Fetch all confirmed bookings for this experience (from all users)
      const { data: allBookings, error: allBookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          booking_participants (
            name,
            email,
            phone_number
          ),
          experiences!inner (
            vendor_id,
            title,
            price
          )
        `)
        .eq('experience_id', experienceId)
        .eq('status', 'confirmed')
        .order('booking_date', { ascending: false })
      
      console.log('Confirmed bookings with participants:', allBookings)
      
      if (allBookingsError) {
        console.error('Error fetching bookings:', allBookingsError)
        throw allBookingsError
      }
      
      // Filter recent bookings (30 days)
      const recentBookings = allBookings?.filter(booking => 
        new Date(booking.booking_date) >= thirtyDaysAgo
      ) || []
      
      // Calculate metrics
      const totalRevenue = allBookings?.reduce((sum, booking) => {
        return sum + (experiencePrice * booking.total_participants)
      }, 0) || 0
      
      const recentRevenue = recentBookings.reduce((sum, booking) => {
        return sum + (experiencePrice * booking.total_participants)
      }, 0)
      
      const totalBookings = allBookings?.length || 0
      const recentBookingsCount = recentBookings.length
      const totalParticipants = allBookings?.reduce((sum, booking) => sum + booking.total_participants, 0) || 0
      const recentParticipants = recentBookings.reduce((sum, booking) => sum + booking.total_participants, 0)
      
      // Daily revenue data for the last 30 days
      const dailyData = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i)
        const dayBookings = recentBookings.filter(booking => 
          format(new Date(booking.booking_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        )
        
        const dayRevenue = dayBookings.reduce((sum, booking) => {
          return sum + (experiencePrice * booking.total_participants)
        }, 0)
        
        return {
          date: format(date, 'MMM dd'),
          revenue: dayRevenue,
          bookings: dayBookings.length,
          participants: dayBookings.reduce((sum, booking) => sum + booking.total_participants, 0)
        }
      })
      
      return {
        allBookings: allBookings || [],
        recentBookings,
        totalRevenue,
        recentRevenue,
        totalBookings,
        recentBookingsCount,
        totalParticipants,
        recentParticipants,
        dailyData,
        averageBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
        averageParticipantsPerBooking: totalBookings > 0 ? totalParticipants / totalBookings : 0
      }
    },
    enabled: !!user && !!experienceId,
    staleTime: 0,
    cacheTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 2
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!bookingsData) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-2">
          Experience Analytics
        </h2>
        <p className="text-blue-600 dark:text-blue-300">
          Booking insights for "{experienceTitle}"
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  ₹{bookingsData.totalRevenue.toFixed(2)}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  All time
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Total Bookings</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                  {bookingsData.totalBookings}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {bookingsData.recentBookingsCount} in last 30 days
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Total Participants</p>
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                  {bookingsData.totalParticipants}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {bookingsData.recentParticipants} in last 30 days
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-violet-500 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Avg Booking Value</p>
                <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                  ₹{bookingsData.averageBookingValue.toFixed(0)}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  {bookingsData.averageParticipantsPerBooking.toFixed(1)} avg participants
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  )
}