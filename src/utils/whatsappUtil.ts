export const SendWhatsappMessage = async (body: any) => {
  // Get the WhatsApp auth key from Supabase Edge Function
const authKey = import.meta.env.VITE_WHATSAPP_MSG91;

  const response = await fetch(
    "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `authkey ${authKey}`,
      },
      body: JSON.stringify(body),
    }
  );

  return response.json();
};
