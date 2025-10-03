import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    // Store or update the OTP in the database
    const { error: dbError } = await supabase
      .from('password_reset_otps')
      .upsert({ email, otp_code: otp, expires_at: expiresAt, is_used: false });

    if (dbError) {
      console.error('Error upserting OTP:', dbError.message);
      return new Response(
        JSON.stringify({ error: dbError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Send OTP email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Password Reset OTP</h2>
        <p style="color: #666;">Your one-time password (OTP) to reset your bucketlistt password is:</p>
        <p style="font-size: 24px; font-weight: bold; color: #f97316;">${otp}</p>
        <p style="color: #999;">This OTP will expire in 15 minutes.</p>
      </div>
    `;

    await resend.emails.send({
      from: "bucketlistt <noreply@bucketlistt.com>",
      to: [email],
      subject: "Your Password Reset OTP",
      html: emailHtml,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('Error in send-password-reset function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);