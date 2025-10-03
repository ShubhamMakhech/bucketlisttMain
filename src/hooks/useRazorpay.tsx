
import { useToast } from "@/hooks/use-toast"

declare global {
  interface Window {
    Razorpay: any
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: any) => void
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  theme?: {
    color?: string
  }
  modal?: {
    ondismiss?: () => void
  }
}

export const useRazorpay = () => {
  const { toast } = useToast()

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        console.log("Razorpay script already loaded")
        resolve(true)
        return
      }

      console.log("Loading Razorpay script...")
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => {
        console.log("Razorpay script loaded successfully")
        resolve(true)
      }
      script.onerror = () => {
        console.error("Failed to load Razorpay script")
        resolve(false)
      }
      document.body.appendChild(script)
    })
  }

  const openRazorpay = async (options: RazorpayOptions) => {
    console.log("Opening Razorpay with options:", options)
    
    const isLoaded = await loadRazorpayScript()
    
    if (!isLoaded) {
      console.error("Razorpay script failed to load")
      toast({
        title: "Payment Error",
        description: "Unable to load payment gateway. Please try again.",
        variant: "destructive"
      })
      return
    }

    try {
      console.log("Creating Razorpay instance...")
      
      // Add body class to handle z-index conflicts
      document.body.classList.add('razorpay-open')
      
      // Add custom CSS to ensure Razorpay modal has the highest z-index
      const style = document.createElement('style')
      style.textContent = `
        .razorpay-container {
          z-index: 99999 !important;
          position: fixed !important;
        }
        .razorpay-backdrop {
          z-index: 99998 !important;
          position: fixed !important;
        }
        .razorpay-checkout-frame {
          z-index: 99999 !important;
          position: fixed !important;
        }
        iframe[src*="razorpay"], iframe[name*="razorpay"] {
          z-index: 99999 !important;
          position: fixed !important;
        }
      `
      document.head.appendChild(style)
      
      const cleanupFunction = () => {
        document.body.classList.remove('razorpay-open')
        if (document.head.contains(style)) {
          document.head.removeChild(style)
        }
      }
      
      const razorpay = new window.Razorpay({
        ...options,
        handler: (response: any) => {
          console.log('Payment successful:', response)
          cleanupFunction()
          if (options.handler) options.handler(response)
        },
        modal: {
          ...options.modal,
          ondismiss: () => {
            console.log("Payment modal dismissed by user")
            cleanupFunction()
            if (options.modal?.ondismiss) options.modal.ondismiss()
          }
        }
      })
      
      console.log("Opening Razorpay modal...")
      razorpay.open()
      
      // Additional cleanup for failed payments
      razorpay.on('payment.failed', (response: any) => {
        console.log('Payment failed:', response)
        cleanupFunction()
      })
      
    } catch (error) {
      console.error("Error opening Razorpay:", error)
      toast({
        title: "Payment Error",
        description: "Failed to open payment gateway. Please try again.",
        variant: "destructive"
      })
    }
  }

  return { openRazorpay }
}
