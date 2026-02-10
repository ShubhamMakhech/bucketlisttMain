import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppRequest {
  integrated_number: string;
  content_type: string;
  payload: {
    messaging_product: string;
    type: string;
    template: {
      name: string;
      language: {
        code: string;
        policy: string;
      };
      namespace: string;
      to_and_components: Array<{
        to: string[];
        components: Record<
          string,
          {
            type: string;
            value: string;
          }
        >;
      }>;
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: WhatsAppRequest = await req.json();

    const authKey =
      Deno.env.get("WHATSAPP_MSG91_AUTH_KEY") ||
      Deno.env.get("VITE_WHATSAPP_MSG91");

    if (!authKey) {
      console.error("❌ MSG91 auth key not configured");
      throw new Error(
        "WhatsApp MSG91 auth key not configured. Please set WHATSAPP_MSG91_AUTH_KEY environment variable."
      );
    }

    // Log which auth key source is being used (masked for security)
    const authSource = Deno.env.get("WHATSAPP_MSG91_AUTH_KEY")
      ? "WHATSAPP_MSG91_AUTH_KEY"
      : "VITE_WHATSAPP_MSG91";
    console.log(`🔑 Using auth key from: ${authSource} (${authKey.substring(0, 8)}...)`);

    // Log request details
    console.log("📤 MSG91 Request:", {
      template: body.payload?.template?.name,
      recipients: body.payload?.template?.to_and_components?.map((tc: any) => tc.to),
      integrated_number: body.integrated_number,
    });

    // Create headers as per MSG91 documentation
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("authkey", authKey);

    // Make request to MSG91 API
    const response = await fetch(
      "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
      {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
      }
    );

    const result = await response.text();
    console.log(`📥 MSG91 Response (Status ${response.status}):`, result);

    // Try to parse as JSON, fallback to text
    let jsonResult;
    try {
      jsonResult = JSON.parse(result);
    } catch {
      jsonResult = { text: result };
    }

    if (!response.ok) {
      console.error("❌ MSG91 API error:", jsonResult);
      throw new Error(
        `MSG91 API error (${response.status}): ${JSON.stringify(jsonResult)}`
      );
    }

    // Check for errors in successful responses
    if (jsonResult.type === 'error' || jsonResult.message?.toLowerCase().includes('error')) {
      console.error("⚠️ MSG91 returned error in 200 response:", jsonResult);
    } else {
      console.log("✅ MSG91 message sent successfully:", jsonResult);
    }

    return new Response(JSON.stringify(jsonResult), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error sending WhatsApp message:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: "Check function logs for more information",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
