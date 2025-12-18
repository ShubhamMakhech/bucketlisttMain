
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface CreateOrderRequest {
  amount: number
  currency: string
  experienceTitle: string
  bookingData: any
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("Received request for creating Razorpay order")
    const { amount, currency, experienceTitle, bookingData }: CreateOrderRequest = await req.json()
    console.log("Request data:", { amount, currency, experienceTitle })

    const keyId = Deno.env.get("RAZORPAY_KEY_ID")
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")

    console.log("Checking Razorpay credentials...")
    console.log("Key ID exists:", !!keyId)
    console.log("Key Secret exists:", !!keySecret)
    
    if (keyId) {
      console.log("Key ID prefix:", keyId.substring(0, 8) + "...")
    }

    if (!keyId || !keySecret) {
      console.error("Missing Razorpay credentials")
      throw new Error("Razorpay credentials not configured")
    }

    // Create Razorpay order
    const orderData = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency.toUpperCase(),
      receipt: `order_${Date.now()}`,
      notes: {
        experience_title: experienceTitle,
        booking_data: JSON.stringify(bookingData)
      }
    }

    console.log("Creating Razorpay order with data:", orderData)

    const authHeader = `Basic ${btoa(`${keyId}:${keySecret}`)}`
    console.log("Auth header created successfully")

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderData)
    })

    console.log("Razorpay API response status:", razorpayResponse.status)
    console.log("Razorpay API response headers:", Object.fromEntries(razorpayResponse.headers.entries()))

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text()
      console.error("Razorpay API error response:", errorText)
      console.error("Response status:", razorpayResponse.status)
      
      // Try to parse the error response
      let errorDetails = errorText
      try {
        const errorJson = JSON.parse(errorText)
        errorDetails = errorJson.error ? errorJson.error.description || errorJson.error.code : errorText
      } catch (e) {
        console.log("Could not parse error as JSON")
      }
      
      throw new Error(`Razorpay API error (${razorpayResponse.status}): ${errorDetails}`)
    }

    const order = await razorpayResponse.json()
    console.log("Razorpay order created successfully:", order.id)

    return new Response(JSON.stringify({ order }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error)
    console.error("Error stack:", error.stack)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Check function logs for more information"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  }
}

serve(handler)
