import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  identifier: string; // email or phone number
  authMethod: "email" | "phone";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identifier, authMethod }: SendOTPRequest = await req.json();

    if (!identifier || !authMethod) {
      return new Response(
        JSON.stringify({ error: "Identifier and auth method are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate email format
    if (authMethod === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate and format phone number
    let formattedIdentifier = identifier.trim();
    if (authMethod === "phone") {
      // Remove spaces and validate
      formattedIdentifier = formattedIdentifier.replace(/\s/g, "");
      if (!/^\+?[1-9]\d{1,14}$/.test(formattedIdentifier)) {
        return new Response(
          JSON.stringify({ error: "Invalid phone number format" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      // Ensure it starts with country code (default to +91 for India)
      if (!formattedIdentifier.startsWith("+")) {
        formattedIdentifier = `+91${formattedIdentifier}`;
      }
    } else {
      // Normalize email to lowercase
      formattedIdentifier = formattedIdentifier.toLowerCase();
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Delete any existing unverified OTPs for this identifier
    await supabase
      .from("otp_verifications")
      .delete()
      .eq("identifier", formattedIdentifier)
      .eq("auth_method", authMethod)
      .eq("verified", false);

    // Insert new OTP
    const { error: insertError } = await supabase
      .from("otp_verifications")
      .insert({
        identifier: formattedIdentifier,
        otp,
        auth_method: authMethod,
        expires_at: expiresAt.toISOString(),
        verified: false,
        attempts: 0,
      });

    if (insertError) {
      console.error("Error inserting OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send OTP based on method
    if (authMethod === "email") {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Your OTP Code</h1>
          </div>
          
          <div style="padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Hi there,
            </p>
            
            <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
              Your OTP code for bucketlistt authentication is:
            </p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
              <h2 style="color: #f97316; margin: 0; font-size: 32px; letter-spacing: 8px; font-family: monospace;">
                ${otp}
              </h2>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
              This code will expire in 10 minutes. Please do not share this code with anyone.
            </p>
            
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 30px;">
              If you didn't request this code, please ignore this email.
            </p>
            
            <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong style="color: #f97316;">The bucketlistt Team</strong>
              </p>
            </div>
          </div>
        </div>
      `;

      const emailResponse = await resend.emails.send({
        from: "bucketlistt <onboarding@resend.dev>",
        to: [formattedIdentifier],
        subject: "Your OTP Code for bucketlistt",
        html: emailHtml,
      });

      if (emailResponse.error) {
        console.error("Error sending email:", emailResponse.error);
        return new Response(
          JSON.stringify({ error: "Failed to send OTP email" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    } else if (authMethod === "phone") {
      // Send WhatsApp OTP via MSG91
      const authKey =
        Deno.env.get("WHATSAPP_MSG91_AUTH_KEY") ||
        Deno.env.get("VITE_WHATSAPP_MSG91");

      if (!authKey) {
        return new Response(
          JSON.stringify({ error: "WhatsApp service not configured" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Use formatted identifier (already has country code)
      const whatsappBody = {
        integrated_number: "919274046332", // Your MSG91 integrated number
        content_type: "template",
        payload: {
          messaging_product: "whatsapp",
          type: "template",
          template: {
            name: "otp_verification", // IMPORTANT: Create this template in MSG91 with OTP variable
            language: {
              code: "en",
              policy: "deterministic",
            },
            namespace: "ca756b77_f751_41b3_adb9_96ed99519854", // Your namespace
            to_and_components: [
              {
                to: [formattedIdentifier],
                components: {
                  body_1: {
                    type: "text",
                    text: otp,
                  },
                },
              },
            ],
          },
        },
      };

      const headers = new Headers();
      headers.append("Content-Type", "application/json");
      headers.append("authkey", authKey);

      const whatsappResponse = await fetch(
        "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify(whatsappBody),
        }
      );

      if (!whatsappResponse.ok) {
        const errorText = await whatsappResponse.text();
        console.error("MSG91 API error:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to send OTP via WhatsApp" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `OTP sent to your ${authMethod}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
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

