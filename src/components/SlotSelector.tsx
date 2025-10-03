import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card, Badge, Button, Popover, Tooltip } from 'antd'
import { Calendar } from '@/components/ui/calendar'
import { Clock, Users, Calendar as CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { format, addDays, isSameDay } from 'date-fns'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface SlotSelectorProps {
  experienceId: string;
  selectedDate: Date | undefined;
  selectedSlotId: string | undefined;
  selectedActivityId: string | undefined; // Add this
  participantCount: number;
  onDateChange: (date: Date | undefined) => void;
  onSlotChange: (slotId: string | undefined) => void;
  onActivityChange: (activityId: string | undefined) => void; // Add this
  showOnlyActivitySelection?: boolean; // New prop for mobile step 1
  showOnlyDateAndTime?: boolean; // New prop for mobile step 2
}

interface TimeSlot {
  id: string
  start_time: string
  end_time: string
  capacity: number
  booked_count: number
  available_spots: number
}

interface Activity {
  id: string;
  name: string;
  price: number;
  currency: string;
  distance?: string;
  discounted_price?: number | null;
}

// Add before the SlotSelector component
export const SlotSelector = ({
  experienceId,
  selectedDate,
  selectedSlotId,
  selectedActivityId, // Add this
  participantCount,
  onDateChange,
  onSlotChange,
  onActivityChange, // Add this
  showOnlyActivitySelection = false,
  showOnlyDateAndTime = false,
}: SlotSelectorProps) => {
  const [showCalendar, setShowCalendar] = useState(false)
  const [isDistanceExpanded, setIsDistanceExpanded] = useState(false)
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set())
  const [showAllActivities, setShowAllActivities] = useState(false)

  // Toggle expanded state for activity descriptions
  const toggleExpanded = (activityId: string) => {
    const newExpanded = new Set(expandedActivities)
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId)
    } else {
      newExpanded.add(activityId)
    }
    setExpandedActivities(newExpanded)
  }

  // Generate next 4 days for horizontal date picker
  const getNext4Days = () => {
    const days = []
    const today = new Date()
    for (let i = 0; i < 4; i++) {
      days.push(addDays(today, i))
    }
    return days
  }

  const next4Days = getNext4Days()

  // Query to get available dates (dates with available slots)
  const { data: availableDates } = useQuery({
    queryKey: ['available-dates', experienceId, participantCount],
    queryFn: async () => {
      // Get all time slots for the experience
      const { data: slots, error: slotsError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('experience_id', experienceId)

      if (slotsError) throw slotsError

      // Get all bookings for this experience
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('time_slot_id, total_participants, booking_date')
        .eq('experience_id', experienceId)
        .eq('status', 'confirmed')

      if (bookingsError) throw bookingsError

      // Group bookings by date
      const bookingsByDate = bookings.reduce((acc, booking) => {
        const dateStr = booking.booking_date.split('T')[0]
        if (!acc[dateStr]) acc[dateStr] = []
        acc[dateStr].push(booking)
        return acc
      }, {} as Record<string, any[]>)

      // Check each date from today onwards for the next 365 days
      const availableDates = new Set<string>()
      const today = new Date()

      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(today.getDate() + i)
        const dateStr = checkDate.toISOString().split('T')[0]

        // Check if any slot has availability for this date
        const hasAvailableSlot = slots.some(slot => {
          const slotBookings = bookingsByDate[dateStr]?.filter(booking => booking.time_slot_id === slot.id) || []
          const bookedCount = slotBookings.reduce((sum, booking) => sum + booking.total_participants, 0)
          const availableSpots = slot.capacity - bookedCount
          return availableSpots >= participantCount
        })

        if (hasAvailableSlot) {
          availableDates.add(dateStr)
        }
      }

      return availableDates
    },
    enabled: !!experienceId
  })

  // Add query for activities
  const { data: activities } = useQuery({
    queryKey: ['activities', experienceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('experience_id', experienceId)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data as Activity[];
    },
  });

  // Update time slots query to filter by activity
  const { data: timeSlots, isLoading } = useQuery({
    queryKey: ['time-slots', experienceId, selectedDate, selectedActivityId],
    queryFn: async () => {
      if (!selectedDate || !selectedActivityId) return [];

      const dateStr = selectedDate.toISOString().split('T')[0];

      // Get time slots for the experience
      const { data: slots, error: slotsError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('experience_id', experienceId)
        .eq('activity_id', selectedActivityId);

      if (slotsError) throw slotsError

      // Get bookings for this specific date
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('time_slot_id, total_participants')
        .eq('experience_id', experienceId)
        .gte('booking_date', `${dateStr}T00:00:00`)
        .lt('booking_date', `${dateStr}T23:59:59`)
        .eq('status', 'confirmed')

      if (bookingsError) throw bookingsError

      // Calculate availability for each slot
      const slotsWithAvailability = slots.map(slot => {
        const slotBookings = bookings.filter(booking => booking.time_slot_id === slot.id)
        const bookedCount = slotBookings.reduce((sum, booking) => sum + booking.total_participants, 0)
        const availableSpots = slot.capacity - bookedCount

        return {
          ...slot,
          booked_count: bookedCount,
          available_spots: Math.max(0, availableSpots)
        }
      })

      return slotsWithAvailability as TimeSlot[]
    },
    enabled: !!experienceId && !!selectedDate && !!selectedActivityId
  })

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour24 = parseInt(hours)
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
    const ampm = hour24 >= 12 ? 'PM' : 'AM'
    return `${hour12}:${minutes} ${ampm}`
  }

  const isSlotAvailable = (slot: TimeSlot) => {
    return slot.available_spots >= participantCount
  }

  const getSlotStatusBadge = (slot: TimeSlot) => {
    if (slot.available_spots === 0) {
      return <Badge color="red">Fully Booked</Badge>
    }
    if (slot.available_spots < participantCount) {
      return <Badge color="var(--brand-color)">Not Enough Spots</Badge>
    }
    if (slot.available_spots <= 3) {
      return <Badge color="orange">Few Spots Left</Badge>
    }
    return <Badge color="green">Available</Badge>
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Function to check if a date should be disabled
  const isDateDisabled = (date: Date) => {
    // Disable past dates
    if (date < today) return true

    // If availableDates is not loaded yet, don't disable any future dates
    if (!availableDates) return false

    // Disable dates that don't have available slots
    const dateStr = date.toISOString().split('T')[0]
    return !availableDates.has(dateStr)
  }

  return (
    <div className="space-y-6">
      {/* Activity Selection - Show only if not in date/time only mode */}
      {!showOnlyDateAndTime && (
        <>
          {/* Add Activity Selector */}
          <div>
            <label className="text-base font-semibold mb-3 block textSmall">Select Activity</label>

            {/* Desktop Activity Swiper Slider */}
            <div className="activity-swiper-container hidden md:block">
              <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={16}
                slidesPerView="auto"
                navigation={true}
                pagination={{
                  clickable: true,
                  dynamicBullets: true,
                }}
                className="activity-swiper"
              >
                {activities?.map((activity) => (
                  <SwiperSlide key={activity.id} className="activity-slide">
                    <Tooltip
                      title={activity.distance || 'Description not available'}
                      placement="top"
                      overlayStyle={{ maxWidth: '300px' }}
                    >
                      <Card
                        className={`activity-card cursor-pointer transition-all duration-200 ${selectedActivityId === activity.id
                          ? 'border-[var(--brand-color)] bg-orange-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                        onClick={() => {
                          onActivityChange(activity.id);
                          onSlotChange(undefined); // Reset slot when activity changes
                        }}
                        style={{ width: '280px', minHeight: '200px' }}
                      >
                        <div className="flex flex-col h-full p-4">
                          {/* Title */}
                          <div className="mb-3">
                            <h3 className={`text-lg font-bold ${selectedActivityId === activity.id ? 'text-gray-800' : 'text-gray-800'
                              }`}>
                              {activity.name}
                            </h3>
                          </div>

                          {/* Price */}
                          <div className="mb-4">
                            {activity.discounted_price && activity.discounted_price !== activity.price ? (
                              <div className="flex flex-col">
                                <div className="text-lg text-muted-foreground line-through">
                                  {activity.currency === "USD" ? "₹" : activity.currency === "INR" ? "₹" : activity.currency} {activity.price}
                                </div>
                                <div className={`text-2xl font-bold ${selectedActivityId === activity.id ? 'text-green-600' : 'text-green-600'
                                  }`}>
                                  {activity.currency === "USD" ? "₹" : activity.currency === "INR" ? "₹" : activity.currency} {activity.discounted_price}
                                </div>
                              </div>
                            ) : (
                              <div className={`text-2xl font-bold ${selectedActivityId === activity.id ? 'text-[var(--brand-color)]' : 'text-gray-800'
                                }`}>
                                {activity.currency === "USD" ? "₹" : activity.currency === "INR" ? "₹" : activity.currency} {activity.price}
                              </div>
                            )}
                          </div>

                          {/* Select Button */}
                          <div className="mb-4">
                            <Button
                              className={`w-full rounded-lg border-2 font-semibold ${selectedActivityId === activity.id
                                ? 'border-[var(--brand-color)] bg-[var(--brand-color)] text-white hover:opacity-90'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onActivityChange(activity.id);
                                onSlotChange(undefined);
                              }}
                            >
                              {selectedActivityId === activity.id ? 'Selected' : 'Select'}
                            </Button>
                          </div>

                          {/* Distance Content */}
                          <div className="mt-auto">
                            <div className="border-t border-dashed border-gray-300 pt-3">
                              <div className="text-xs text-gray-600">
                                <div className="font-medium mb-1">Description:</div>
                                <div className="text-gray-500">
                                  {activity.distance ?
                                    (activity.distance.length > 80 ?
                                      `${activity.distance.substring(0, 80)}...` :
                                      activity.distance
                                    ) :
                                    'Distance information not available'
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Tooltip>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Mobile Activity Cards */}
            <div className="md:hidden space-y-3 MobileActivityCardsContainer">
              {(showAllActivities ? activities : activities?.slice(0, 3))?.map((activity) => {
                const isExpanded = expandedActivities.has(activity.id)
                const isSelected = selectedActivityId === activity.id
                const descriptionWords = activity.distance ? activity.distance.split(' ') : []
                const shouldShowReadMore = descriptionWords.length > 20

                return (
                  <Card
                    key={activity.id}
                    className={`cursor-pointer transition-all duration-200 ${isSelected
                      ? 'border-[var(--brand-color)] bg-orange-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    onClick={() => {
                      onActivityChange(activity.id);
                      onSlotChange(undefined);
                    }}
                  >
                    <div className="p-0">
                      {/* Header Row */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h3 className={`text-sm font-semibold ${isSelected ? 'text-gray-800' : 'text-gray-800'}`}>
                            {activity.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                      <div className="text-right">
                        {activity.discounted_price && activity.discounted_price !== activity.price ? (
                          <div className="flex flex-col items-end">
                            <div className="text-xs text-muted-foreground line-through">
                              {activity.currency === "USD" ? "₹" : activity.currency === "INR" ? "₹" : activity.currency} {activity.price}
                            </div>
                            <div className={`text-base font-bold ${isSelected ? 'text-green-600' : 'text-green-600'}`}>
                              {activity.currency === "USD" ? "₹" : activity.currency === "INR" ? "₹" : activity.currency} {activity.discounted_price}
                            </div>
                          </div>
                        ) : (
                          <div className={`text-base font-bold ${isSelected ? 'text-[var(--brand-color)]' : 'text-gray-800'}`}>
                            {activity.currency === "USD" ? "₹" : activity.currency === "INR" ? "₹" : activity.currency} {activity.price}
                          </div>
                        )}
                      </div>
                          <Button
                            size="small"
                            className={`px-3 py-1 text-xs font-medium rounded ${isSelected
                              ? 'bg-[var(--brand-color)] text-white'
                              : 'bg-gray-100 text-gray-700'
                              }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onActivityChange(activity.id);
                              onSlotChange(undefined);
                            }}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </Button>
                        </div>
                      </div>

                      {/* Description Section */}
                      {activity.distance && (
                        <div className="border-t border-gray-200 pt-2">
                          {/* Show first 2 lines */}
                          <div className="text-xs text-gray-600 leading-relaxed mb-2">
                            {isExpanded ? (
                              activity.distance
                            ) : (
                              <>
                                {descriptionWords.slice(0, 20).join(' ')}
                                {shouldShowReadMore && '...'}
                              </>
                            )}
                          </div>

                          {/* Read more button */}
                          {shouldShowReadMore && (
                            <div
                              className="flex items-center justify-between cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(activity.id);
                              }}
                            >
                              <span className="text-xs text-gray-600">
                                {isExpanded ? 'Read less' : 'Read more'}
                              </span>
                              <div className="text-gray-400">
                                {isExpanded ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}

              {/* Show More Activities Button */}
              {activities && activities.length > 3 && !showAllActivities && (
                <div className="pt-2">
                  <Button
                    type="default"
                    className="w-full text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowAllActivities(true)}
                  >
                    Show more activities ({activities.length - 3} more)
                  </Button>
                </div>
              )}

              {/* Show Less Button */}
              {showAllActivities && activities && activities.length > 3 && (
                <div className="pt-2">
                  <Button
                    type="default"
                    className="w-full text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowAllActivities(false)}
                  >
                    Show less
                  </Button>
                </div>
              )}
            </div>

          </div>
        </>
      )}

      {/* Date and Time Selection - Show only if not in activity only mode */}
      {!showOnlyActivitySelection && (
        <>
          {/* Existing Calendar and Time Slots components */}
          {selectedActivityId && (
            <>
              <div className='CalenderLayoutContainer'>
                <label className="text-base font-medium mb-3 block textSmall">Select a date</label>

                {/* Horizontal Date Picker */}
                <div className="flex items-center gap-1  pb-2 overflowAdjustContainer">
                  {next4Days.map((date) => {
                    const isSelected = selectedDate && isSameDay(date, selectedDate)
                    const isDisabled = isDateDisabled(date)

                    return (
                      <div
                        key={date.toISOString()}
                        className={`flex-shrink-0 cursor-pointer transition-all duration-200 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                          }`}
                        onClick={() => !isDisabled && onDateChange(date)}
                      >
                        <div
                          className={`w-16 h-20 rounded-lg border-2 p-2 text-center flex flex-col justify-between ${isSelected
                            ? 'border-[var(--brand-color)] bg-orange-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                          <div className="text-xs text-gray-500 font-medium textSmall">
                            {format(date, 'EEE')}
                          </div>
                          <div className="text-sm font-semibold text-gray-800 textSmall">
                            {format(date, 'MMM d')}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* More Dates Button */}
                  <Popover
                    content={
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          onDateChange(date)
                          setShowCalendar(false)
                        }}
                        disabled={isDateDisabled}
                        className="rounded-md border"
                      />
                    }
                    title="Select Date"
                    trigger="click"
                    open={showCalendar}
                    onOpenChange={setShowCalendar}
                    placement="bottomLeft"
                  >
                    <Button
                      className="flex-shrink-0 w-16 h-20 flex flex-col items-center justify-center gap-1 border-gray-200 hover:border-gray-300 p-2"
                    >
                      <CalendarIcon className="h-4 w-4 text-gray-600" />
                      <span className="text-xs text-gray-600">More <br />dates</span>
                    </Button>
                  </Popover>
                </div>
              </div>

              {selectedDate && (
                <div>
                  <label className="text-base font-semibold mb-3 block textSmall">
                    Available Time Slots for {format(selectedDate, 'MMM d, yyyy')}
                  </label>

                  {isLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-muted animate-pulse rounded-lg"></div>
                      ))}
                    </div>
                  ) : timeSlots && timeSlots.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ">
                      {timeSlots.map((slot) => {
                        const available = isSlotAvailable(slot)
                        const isSelected = selectedSlotId === slot.id

                        return (
                          <Card
                            key={slot.id}
                            className={`cursor-pointer transition-colors ${isSelected
                              ? 'border-[var(--brand-color)] bg-orange-50'
                              : available
                                ? 'hover:border-gray-300'
                                : 'opacity-50 cursor-not-allowed'
                              }`}
                            id='time-slot-card'
                            onClick={() => available && onSlotChange(isSelected ? undefined : slot.id)}
                            style={{ marginBottom: '0', padding: "0px" }}
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between p-0 md:p-4 FlexGridContainer">
                              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-0">
                                <Clock className="h-4 w-4 md:h-5 md:w-5 text-gray-500 flex-shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-medium text-sm md:text-base">
                                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                  </div>
                                  <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-500">
                                    <Users className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                                    <span className="truncate">
                                      {slot.available_spots} of {slot.capacity} spots
                                      {slot.booked_count > 0 && ` (${slot.booked_count} booked)`}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 justify-end md:justify-start">
                                {getSlotStatusBadge(slot)}
                                {isSelected && (
                                  <Badge color="var(--brand-color)" size="small">
                                    Selected
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {!available && slot.available_spots > 0 && (
                              <div className="px-3 md:px-4 pb-3 md:pb-4 text-xs md:text-sm text-red-500">
                                Only {slot.available_spots} spots left, but you need {participantCount}
                              </div>
                            )}
                          </Card>
                        )
                      })}
                    </div>
                  ) : (
                    <Card>
                      <div className="p-8 text-center">
                        <div className="text-gray-500">
                          No time slots available for this date
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
