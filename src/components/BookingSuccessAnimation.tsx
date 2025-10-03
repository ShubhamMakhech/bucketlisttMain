
import { useEffect, useState } from "react"
import { CheckCircle, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface BookingSuccessAnimationProps {
  isVisible: boolean
  onComplete: () => void
}

export const BookingSuccessAnimation = ({ isVisible, onComplete }: BookingSuccessAnimationProps) => {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    if (isVisible) {
      setStage(0)
      const timer1 = setTimeout(() => setStage(1), 100)
      const timer2 = setTimeout(() => setStage(2), 600)
      const timer3 = setTimeout(() => setStage(3), 1200)
      const timer4 = setTimeout(() => {
        setStage(0)
        onComplete()
      }, 3000)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
        clearTimeout(timer4)
      }
    }
  }, [isVisible, onComplete])

  if (!isVisible) return null

  return (
    <div className="!fixed !top-0 !left-0 !w-screen !h-screen z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative">
        {/* Background Circle */}
        <div className={cn(
          "w-32 h-32 rounded-full bg-success/20 flex items-center justify-center transition-all duration-700 ease-out",
          stage >= 1 && "scale-110 bg-success/30",
          stage >= 2 && "scale-125 bg-success/40"
        )}>
          {/* Check Icon */}
          <CheckCircle className={cn(
            "w-16 h-16 text-success transition-all duration-500 ease-out transform",
            stage >= 1 && "scale-110",
            stage >= 2 && "scale-125"
          )} />
        </div>

        {/* Success Text */}
        <div className={cn(
          "absolute top-40 left-1/2 transform -translate-x-1/2 text-center transition-all duration-700 ease-out",
          stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <h2 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h2>
          <p className="text-white/80">Your adventure awaits</p>
        </div>
      </div>
    </div>
  )
}
