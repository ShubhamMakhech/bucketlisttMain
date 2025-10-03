
import { Header } from "@/components/Header"
import { UserBookings } from "@/components/UserBookings"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar } from "lucide-react"

const Bookings = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth')
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/profile')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-6 w-6 text-brand-primary" />
            <h1 className="text-3xl font-bold">My Bookings</h1>
          </div>
        </div>

        <UserBookings />
      </div>
    </div>
  )
}

export default Bookings
