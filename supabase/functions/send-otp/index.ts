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
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface SendOTPRequest {
  email?: string;
  phoneNumber?: string;
  type: "email" | "sms";
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number format (basic validation)
function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, "");
  // Check if it's 10 digits (Indian format) or 10+ digits
  return digitsOnly.length >= 10;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    let requestBody: SendOTPRequest;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { email, phoneNumber, type } = requestBody;

    if (type === "email") {
      if (!email || !isValidEmail(email)) {
        return new Response(
          JSON.stringify({ error: "Valid email is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Generate OTP
      const otp = generateOTP();

      // Store OTP in database with expiration (5 minutes)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      const { error: storageError } = await supabase
        .from("otp_verifications")
        .insert({
          identifier: email,
          otp: otp,
          type: "email",
          expires_at: expiresAt.toISOString(),
        });

      if (storageError) {
        console.error("Error storing OTP:", storageError);
        // If table doesn't exist, we'll handle it gracefully
        // For now, continue with sending email
      }

      // Send OTP email using Resend
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Your OTP Code</h1>
          </div>
          
          <div style="padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Your OTP code for bucketlistt is:
            </p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
              <h2 style="color: #f97316; margin: 0; font-size: 32px; letter-spacing: 8px; font-family: monospace;">
                ${otp}
              </h2>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
              This code will expire in 5 minutes. Please do not share this code with anyone.
            </p>
            
            <p style="font-size: 14px; color: #6b7280; margin: 0;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        </div>
      `;

      const emailResponse = await resend.emails.send({
        from: "bucketlistt <noreply@bucketlistt.com>",
        to: [email],
        subject: "Your OTP Code - bucketlistt",
        html: emailHtml,
      });

      if (emailResponse.error) {
        console.error("Resend email error:", emailResponse.error);
        return new Response(
          JSON.stringify({
            success: false,
            error: emailResponse.error.message || "Failed to send OTP email",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "OTP sent to email",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } else if (type === "sms") {
      if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
        return new Response(
          JSON.stringify({ error: "Valid phone number is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Format phone number (ensure it starts with country code 91)
      let formattedPhone = phoneNumber.replace(/\D/g, "");
      // If number doesn't start with 91, add it
      if (!formattedPhone.startsWith("91")) {
        formattedPhone = "91" + formattedPhone;
      }

      // Generate OTP
      const otp = generateOTP();

      // Store OTP in database with expiration (5 minutes)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      // Store OTP with formatted phone number (with country code)
      const { error: storageError } = await supabase
        .from("otp_verifications")
        .insert({
          identifier: formattedPhone, // Store with country code
          otp: otp,
          type: "sms",
          expires_at: expiresAt.toISOString(),
        });

      if (storageError) {
        console.error("Error storing OTP:", storageError);
        // Continue with sending SMS
      }

      // Get MSG91 auth key and template ID from environment
      const msg91AuthKey = Deno.env.get("WHATSAPP_MSG91_AUTH_KEY");
      const msg91TemplateId = Deno.env.get("MSG91_OTP_TEMPLATE_ID");

      if (!msg91AuthKey) {
        return new Response(
          JSON.stringify({
            error: "MSG91 auth key not configured",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      if (!msg91TemplateId) {
        return new Response(
          JSON.stringify({
            error: "MSG91 OTP template ID not configured",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      // Send SMS via MSG91 API
      // According to MSG91 docs: https://docs.msg91.com/sms/send-sms
      // Using flow API for template-based SMS
      // Format: POST https://control.msg91.com/api/v5/flow/
      const msg91Url = "https://control.msg91.com/api/v5/flow/";

      // MSG91 Flow API format (from official documentation)
      // Variables are passed directly in the recipients array
      // Each recipient object contains 'mobiles' and variable names as keys
      // The variable name should match what's in your MSG91 template
      // Common variable names: otp, OTP, VAR1, var, etc.
      const msg91Body: any = {
        template_id: msg91TemplateId,
        short_url: "0", // Disable URL shortening
        recipients: [
          {
            mobiles: formattedPhone,
            // Pass OTP variable - the key name must match your template variable
            // If your template uses {#otp#}, use "otp"
            // If your template uses {#VAR1#}, use "VAR1"
            // Check your MSG91 template to see the exact variable name
            var: otp, // Default variable name - adjust if your template uses different name
          },
        ],
      };

      const msg91Headers = new Headers();
      msg91Headers.append("Content-Type", "application/json");
      msg91Headers.append("authkey", msg91AuthKey);

      // Log the request for debugging
      console.log("📤 MSG91 SMS Request:", {
        url: msg91Url,
        template_id: msg91TemplateId,
        mobiles: formattedPhone,
        otp: otp,
        body: JSON.stringify(msg91Body),
      });

      const smsResponse = await fetch(msg91Url, {
        method: "POST",
        headers: msg91Headers,
        body: JSON.stringify(msg91Body),
      });

      const smsResult = await smsResponse.text();
      console.log(
        `📥 MSG91 SMS Response (Status ${smsResponse.status}):`,
        smsResult
      );

      if (!smsResponse.ok) {
        console.error("MSG91 SMS error:", smsResult);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to send OTP SMS",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "OTP sent to phone number",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid type. Use 'email' or 'sms'" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
