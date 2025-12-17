import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useRazorpay } from "@/hooks/useRazorpay"
import { supabase } from "@/integrations/supabase/client"

interface BulkBookingData {
  id: string
  user_id: string
  experience_id: string
  booking_date: string
  time_slot_id: string
  total_participants: number
  note_for_guide: string | null
  status: string
  created_at: string
}

interface BulkParticipantData {
  booking_id: string
  name: string
  email: string
  phone_number: string | null
}

interface BulkBookingPaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  experience: {
    id: string
    title: string
    price: number
    currency: string
  }
  bookingsData: BulkBookingData[]
  participantsData: BulkParticipantData[]
  onPaymentSuccess: () => void
}

export const BulkBookingPaymentDialog = ({ 
  isOpen, 
  onClose, 
  experience, 
  bookingsData, 
  participantsData, 
  onPaymentSuccess 
}: BulkBookingPaymentDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [bypassPayment, setBypassPayment] = useState(false)
  const { toast } = useToast()
  const { openRazorpay } = useRazorpay()

  const totalParticipants = bookingsData.length
  const totalAmount = experience.price * totalParticipants

  const createBookingsAfterPayment = async (paymentId?: string) => {
    try {
      setIsProcessing(true)

      // Insert bookings
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingsData)

      if (bookingError) {
        console.error('Error inserting bookings:', bookingError)
        throw new Error('Error creating bookings: ' + bookingError.message)
      }

      // Insert participants
      const { error: participantError } = await supabase
        .from('booking_participants')
        .insert(participantsData)

      if (participantError) {
        console.error('Error inserting participants:', participantError)
        throw new Error('Error creating participants: ' + participantError.message)
      }

      // Send confirmation emails for each booking
      for (const booking of bookingsData) {
        const participant = participantsData.find(p => p.booking_id === booking.id)
        if (participant) {
          try {
            // Get time slot details for email
            const { data: timeSlot } = await supabase
              .from('time_slots')
              .select('start_time, end_time')
              .eq('id', booking.time_slot_id)
              .single()

            await supabase.functions.invoke('send-booking-confirmation', {
              body: {
                customerEmail: participant.email,
                customerName: participant.name,
                experienceTitle: experience.title,
                bookingDate: booking.booking_date,
                timeSlot: timeSlot ? `${timeSlot.start_time} - ${timeSlot.end_time}` : 'Time slot details unavailable',
                totalParticipants: 1,
                totalAmount: experience.price,
                currency: experience.currency,
                participants: [participant],
                bookingId: booking.id,
                noteForGuide: booking.note_for_guide,
                paymentId: paymentId || 'BULK_BOOKING'
              }
            })
          } catch (emailError) {
            console.error('Email sending failed for booking:', booking.id, emailError)
            // Continue with other emails even if one fails
          }
        }
      }

      toast({
        title: "Bulk booking confirmed!",
        description: `Successfully created ${totalParticipants} bookings${paymentId ? ' with payment' : ' (payment bypassed)'}.`
      })

      onPaymentSuccess()
      onClose()
      setIsProcessing(false)
    } catch (error: any) {
      console.error('Bulk booking creation error:', error)
      setIsProcessing(false)
      toast({
        title: "Booking failed",
        description: error.message || "There was an error creating your bookings. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handlePayment = async () => {
    if (bypassPayment) {
      await createBookingsAfterPayment()
      return
    }

    setIsProcessing(true)

    try {
      console.log("Creating Razorpay order for bulk booking...")
      const orderPayload = {
        amount: totalAmount,
        currency: experience.currency,
        experienceTitle: `${experience.title} (Bulk Booking - ${totalParticipants} people)`,
        bookingData: {
          experience_id: experience.id,
          bulk_booking: true,
          total_participants: totalParticipants
        }
      }

      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: orderPayload
      })

      if (orderError) {
        console.error("Supabase function error:", orderError)
        throw new Error(`Order creation failed: ${orderError.message}`)
      }

      if (!orderData || !orderData.order) {
        console.error("Invalid response from order creation:", orderData)
        throw new Error("Invalid response from payment service")
      }

      const { order } = orderData
      console.log("Razorpay order created successfully:", order)

      // Get first participant for prefill data
      const firstParticipant = participantsData[0]

      // Open Razorpay payment
      await openRazorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_AyU0PWr4XJPUZ8',
        amount: order.amount,
        currency: order.currency,
        name: "bucketlistt Experiences",
        description: `Bulk Booking: ${experience.title} (${totalParticipants} people)`,
        order_id: order.id,
        handler: async (response: any) => {
          console.log('Bulk payment successful:', response)
          await createBookingsAfterPayment(response.razorpay_payment_id)
        },
        prefill: {
          name: firstParticipant?.name || '',
          email: firstParticipant?.email || '',
          contact: firstParticipant?.phone_number || ''
        },
        theme: {
          color: "hsl(var(--brand-primary))"
        },
        modal: {
          ondismiss: () => {
            console.log("Payment modal dismissed by user")
            setIsProcessing(false)
            toast({
              title: "Payment cancelled",
              description: "Your bulk booking was not completed.",
              variant: "destructive"
            })
          }
        }
      })
    } catch (error: any) {
      console.error('Payment initiation error:', error)
      setIsProcessing(false)
      toast({
        title: "Payment failed",
        description: error.message || "There was an error initiating payment. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirm Bulk Booking Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bypass Payment Toggle */}
          <Card className="border-brand-primary/20 bg-brand-primary/5 dark:bg-brand-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-brand-primary-dark dark:text-brand-primary-light">Bypass Payment (Beta)</h4>
                  <p className="text-sm text-brand-primary dark:text-brand-primary-light">Skip payment and create bookings directly for testing</p>
                </div>
                <Switch
                  checked={bypassPayment}
                  onCheckedChange={setBypassPayment}
                />
              </div>
            </CardContent>
          </Card>

          {/* Booking Summary */}
          <Card>
            <CardContent className="p-6">
              {/* <br /> */}
              <h3 className="text-lg textSmall mb-4">Booking Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Experience:</span>
                  <span className="font-medium">{experience.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Participants:</span>
                  <span className="font-medium">{totalParticipants} people</span>
                </div>
                <div className="flex justify-between">
                  <span>Price per person:</span>
                  <span className="font-medium">
                    {experience.currency === 'INR' ? '₹' : experience.currency}{experience.price}
                  </span>
                </div>
                <hr className="my-3" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-brand-primary">
                    {experience.currency === 'INR' ? '₹' : experience.currency}{totalAmount}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participants List */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Participants ({totalParticipants})</h3>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {participantsData.map((participant, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">{participant.name}</span>
                    <span className="text-sm text-muted-foreground">{participant.email}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1 bg-brand-primary hover:bg-brand-primary-dark"
            >
              {isProcessing 
                ? "Processing..." 
                : bypassPayment 
                ? "Create Bookings" 
                : `Pay ${experience.currency === 'USD' ? '₹' : experience.currency}${totalAmount}`
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}