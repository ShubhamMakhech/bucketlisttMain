export const SendWhatsappMessage = async (body: any) => {
  // Get the WhatsApp auth key from Supabase Edge Function
const authKey = import.meta.env.VITE_WHATSAPP_AUTH;

  const response = await fetch(
    "https://console.authkey.io/restapi/requestjson_v2.0.php",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authKey}`,
      },
      body: JSON.stringify(body),
    }
  );

  return response.json();
};
