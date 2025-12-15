import { supabase } from "@/integrations/supabase/client";

export const SendWhatsappMessage = async (body: any) => {
  // Call Supabase Edge Function to avoid CORS issues
  const { data, error } = await supabase.functions.invoke(
    "send-whatsapp-message",
    {
      body: body,
    }
  );

  if (error) {
    console.error("Error calling WhatsApp function:", error);
    throw error;
  }

  return data;
};
