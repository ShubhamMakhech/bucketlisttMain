import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Calendar, Users, MapPin, FileText, Eye, Clock, CreditCard } from "lucide-react"
import { format } from "date-fns"

interface BookingWithDueAmount {
  due_amount?: number;
  [key: string]: any;
}

interface RecentBookingsTableProps {
  experienceId?: string
  limit?: number
  isVendorView?: boolean
}

export const RecentBookingsTable = ({ experienceId, limit = 10, isVendorView = false }: RecentBookingsTableProps) => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', user?.id, experienceId, isVendorView],
    queryFn: async () => {
      if (!user) return []
      
      let query = supabase
        .from('bookings')
        .select(`
          *,
          experiences (
            id,
            title,
            image_url,
            location,
            price,
            currency,
            vendor_id
          ),
          booking_participants (
            name,
            email,
            phone_number
          ),
          time_slots (
            start_time,
            end_time,
            activity_id,
            activities (
              id,
              name,
              price,
              currency
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      // For vendor view, show all bookings for their experiences
      if (isVendorView && experienceId) {
        // First verify the user owns this experience
        const { data: experience } = await supabase
          .from('experiences')
          .select('vendor_id')
          .eq('id', experienceId)
          .single()
        
        if (experience?.vendor_id === user.id) {
          query = query.eq('experience_id', experienceId)
        } else {
          return []
        }
      } else {
        // For regular user view, show only their own bookings
        query = query.eq('user_id', user.id)
        if (experienceId) {
          query = query.eq('experience_id', experienceId)
        }
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      // Debug logging to see what data we're getting
      console.log('RecentBookingsTable - Bookings data:', data)
      data?.forEach((booking, index) => {
        console.log(`Booking ${index}:`, {
          id: booking.id,
          total_participants: booking.total_participants,
          participants_count: booking.booking_participants?.length,
          participants: booking.booking_participants
        })
      })
      
      return data
    },
    enabled: !!user
  })

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-16 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-16 bg-muted animate-pulse rounded-lg"></div>
      </div>
    )
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
        <div className="w-16 h-16 mx-auto mb-4 bg-brand-primary-light dark:bg-orange-950/30 rounded-full flex items-center justify-center">
          <Calendar className="h-8 w-8 text-brand-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-muted-foreground">
          No recent bookings
        </h3>
        <p className="text-sm text-muted-foreground">
          Your recent bookings will appear here once you make a reservation.
        </p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="bg-muted/50 px-6 py-4 border-b">
          {isVendorView ? (
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
              <div className="col-span-2">Experience</div>
              <div className="col-span-2">Date & Time</div>
              <div className="col-span-2">Participants</div>
              <div className="col-span-2">Contact</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Booked On</div>
            </div>
          ) : (
            <div className="grid grid-cols-11 gap-4 text-sm font-medium text-muted-foreground">
              <div className="col-span-3">Experience</div>
              <div className="col-span-2">Date & Time</div>
              <div className="col-span-2">Participants</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Status</div>
            </div>
          )}
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {bookings.map((booking) => (
            <div key={booking.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
              {isVendorView ? (
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Experience Info - Vendor View */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {booking.experiences?.image_url ? (
                          <img
                            src={booking.experiences.image_url}
                            alt={booking.experiences.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-xs truncate">
                          {booking.experiences?.title}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(booking.booking_date), 'MMM d')}</span>
                    </div>
                    {booking.time_slots && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(`2000-01-01T${booking.time_slots.start_time}`), 'h:mm a')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Participants */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1 text-sm mb-0.5">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{booking.total_participants}</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {booking.booking_participants && booking.booking_participants.length > 0 ? (
                        <>
                          {booking.booking_participants[0]?.name && (
                            <div className="truncate">{booking.booking_participants[0].name}</div>
                          )}
                          {booking.booking_participants.length > 1 && (
                            <div className="text-xs text-muted-foreground">
                              +{booking.booking_participants.length - 1} more
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          No participants...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="col-span-2">
                    {booking.booking_participants && booking.booking_participants.length > 0 && booking.booking_participants[0] ? (
                      <div className="text-xs space-y-0.5">
                        {booking.booking_participants[0].email && (
                          <div className="truncate font-medium">
                            {booking.booking_participants[0].email}
                          </div>
                        )}
                        {booking.booking_participants[0].phone_number && (
                          <div className="truncate text-muted-foreground">
                            {booking.booking_participants[0].phone_number}
                          </div>
                        )}
                        {!booking.booking_participants[0].email && !booking.booking_participants[0].phone_number && (
                          <div className="text-xs text-muted-foreground">
                            No contact details
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        No contact found
                      </div>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="col-span-2">
                    {(() => {
                      const activity = booking.time_slots?.activities;
                      const activityPrice = activity?.price || booking.experiences?.price || 0;
                      const activityCurrency = activity?.currency || booking.experiences?.currency || "INR";
                      const totalAmount = activityPrice * booking.total_participants;
                      const dueAmount = (booking as BookingWithDueAmount).due_amount || 0;
                      const paidAmount = totalAmount - dueAmount;
                      
                      return (
                        <div className="space-y-0.5">
                          {dueAmount > 0 ? (
                            // Partial payment display - more compact
                            <div>
                              <div className="text-xs font-semibold text-green-600">
                                Paid: {activityCurrency} {paidAmount}
                              </div>
                              <div className="text-xs text-orange-600">
                                Due: {activityCurrency} {dueAmount}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Total: {activityCurrency} {totalAmount}
                              </div>
                            </div>
                          ) : (
                            // Full payment display
                            <div>
                              <div className="flex items-center gap-1 text-sm font-semibold text-orange-600">
                                <CreditCard className="h-4 w-4" />
                                <span>
                                  {activityCurrency} {totalAmount}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {booking.total_participants} × {activityCurrency} {activityPrice}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Status */}
                  <div className="col-span-1">
                    <div className="flex flex-col gap-1">
                      <Badge className={`${getStatusColor(booking.status)} border-0 text-xs`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                      {(booking as BookingWithDueAmount).due_amount && (booking as BookingWithDueAmount).due_amount! > 0 ? (
                        <Badge
                          variant="secondary"
                          className="bg-orange-100 text-orange-800 text-xs"
                        >
                          Partial Payment
                        </Badge>
                      ) : null}
                      {booking.note_for_guide && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <FileText className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="text-xs">
                              <div className="font-medium mb-1">Note for Guide:</div>
                              <div>{booking.note_for_guide}</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  {/* Booked On */}
                  <div className="col-span-1">
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(booking.created_at), 'MMM d')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-11 gap-4 items-center">
                  {/* Experience Info - Regular View */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {booking.experiences?.image_url ? (
                          <img
                            src={booking.experiences.image_url}
                            alt={booking.experiences.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                            <MapPin className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm truncate">
                          {booking.experiences?.title}
                        </h4>
                        {booking.experiences?.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{booking.experiences.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(booking.booking_date), 'MMM d, yyyy')}</span>
                    </div>
                    {booking.time_slots && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(`2000-01-01T${booking.time_slots.start_time}`), 'h:mm a')} - 
                          {format(new Date(`2000-01-01T${booking.time_slots.end_time}`), 'h:mm a')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Participants */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1 text-sm mb-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{booking.total_participants}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {booking.booking_participants?.map((participant, index) => 
                        <div key={index} className={`truncate ${index === 0 ? 'flex' : 'hidden'}`}>
                          {participant.name}
                        </div>
                      )}
                      {booking.booking_participants && booking.booking_participants.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{booking.booking_participants.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2">
                    {(() => {
                      const activity = booking.time_slots?.activities;
                      const activityPrice = activity?.price || booking.experiences?.price || 0;
                      const activityCurrency = activity?.currency || booking.experiences?.currency || "INR";
                      const totalAmount = activityPrice * booking.total_participants;
                      const dueAmount = (booking as BookingWithDueAmount).due_amount || 0;
                      const paidAmount = totalAmount - dueAmount;
                      
                      return (
                        <div className="space-y-0.5">
                          {dueAmount > 0 ? (
                            // Partial payment display - more compact
                            <div>
                              <div className="text-xs font-semibold text-green-600">
                                Paid: {activityCurrency} {paidAmount}
                              </div>
                              <div className="text-xs text-orange-600">
                                Due: {activityCurrency} {dueAmount}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Total: {activityCurrency} {totalAmount}
                              </div>
                            </div>
                          ) : (
                            // Full payment display
                            <div>
                              <div className="flex items-center gap-1 text-sm font-semibold text-orange-600">
                                <CreditCard className="h-4 w-4" />
                                <span>
                                  {activityCurrency} {totalAmount}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {booking.total_participants} × {activityCurrency} {activityPrice}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(booking.status)} border-0`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                        {(booking as BookingWithDueAmount).due_amount && (booking as BookingWithDueAmount).due_amount! > 0 && (
                          <Badge
                            variant="secondary"
                            className="bg-orange-100 text-orange-800"
                          >
                            Partial Payment
                          </Badge>
                        )}
                        {booking.note_for_guide && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <FileText className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="text-xs">
                                <div className="font-medium mb-1">Note for Guide:</div>
                                <div>{booking.note_for_guide}</div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}


            </div>
          ))}
        </div>
      </div>

        {/* Show more button if there might be more bookings */}
        {bookings.length === limit && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => navigate('/bookings')}
              className="text-sm"
            >
              View All Bookings
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}