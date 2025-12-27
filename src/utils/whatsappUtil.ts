import { supabase } from "@/integrations/supabase/client";

export const SendWhatsappMessage = async (body: any) => {
  // Log the request for debugging
  console.log("📤 Sending WhatsApp message request:", {
    integrated_number: body.integrated_number,
    template: body.payload?.template?.name,
    recipients: body.payload?.template?.to_and_components?.map((tc: any) => tc.to),
  });

  // Call Supabase Edge Function to avoid CORS issues
  const { data, error } = await supabase.functions.invoke(
    "send-whatsapp-message",
    {
      body: body,
    }
  );

  if (error) {
    console.error("❌ Error calling WhatsApp function:", error);
    console.error("Request body that failed:", JSON.stringify(body, null, 2));
    throw error;
  }

  // Log the successful response
  console.log("✅ WhatsApp API Response:", data);

  // Check if MSG91 returned an error in the response body
  if (data && typeof data === 'object') {
    if (data.type === 'error' || data.message?.includes('error') || data.message?.includes('failed')) {
      console.error("⚠️ MSG91 returned error in response:", data);
    }
  }

  return data;
};
