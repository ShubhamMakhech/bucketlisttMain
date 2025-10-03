
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  customerEmail: string;
  customerName: string;
  experienceTitle: string;
  bookingDate: string;
  timeSlot: string;
  totalParticipants: number;
  totalAmount: number;
  currency: string;
  participants: Array<{
    name: string;
    email: string;
    phone_number: string;
  }>;
  bookingId: string;
  noteForGuide?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      customerEmail,
      customerName,
      experienceTitle,
      bookingDate,
      timeSlot,
      totalParticipants,
      totalAmount,
      currency,
      participants,
      bookingId,
      noteForGuide
    }: BookingConfirmationRequest = await req.json();

    const formattedDate = new Date(bookingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const participantsList = participants.map((p, index) => 
      `<li><strong>${p.name}</strong> - ${p.email} - ${p.phone_number}</li>`
    ).join('');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Booking Confirmed! 🎉</h1>
        </div>
        
        <div style="padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Hi ${customerName},
          </p>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
            Great news! Your booking has been confirmed. We're excited to have you join us for this amazing experience.
          </p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #f97316; margin: 0 0 15px 0; font-size: 18px;">Booking Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Experience:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${experienceTitle}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Date:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Time:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${timeSlot}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Participants:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${totalParticipants}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Total Amount:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: bold; font-size: 18px;">${currency === 'USD' ? '$' : currency}${totalAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Booking ID:</td>
                <td style="padding: 8px 0; color: #6b7280; font-family: monospace;">${bookingId}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px;">Participant Details</h3>
            <ul style="margin: 0; padding-left: 20px; color: #92400e;">
              ${participantsList}
            </ul>
          </div>
          
          ${noteForGuide ? `
          <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #0369a1; margin: 0 0 15px 0; font-size: 16px;">Special Note for Guide</h3>
            <p style="margin: 0; color: #0369a1;">${noteForGuide}</p>
          </div>
          ` : ''}
          
          <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 16px;">What's Next?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #166534;">
              <li>Save this email for your records</li>
              <li>Arrive 15 minutes before your scheduled time</li>
              <li>Bring a valid ID for verification</li>
              <li>Contact us if you have any questions</li>
            </ul>
          </div>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            If you need to make any changes to your booking or have questions, please don't hesitate to contact us.
          </p>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
            We look forward to providing you with an amazing experience!
          </p>
          
          <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Best regards,<br>
              <strong style="color: #f97316;">The Experience Team</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Experience Booking <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `Booking Confirmed: ${experienceTitle}`,
      html: emailHtml,
    });

    console.log("Booking confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-booking-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
