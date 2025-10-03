
import { Header } from "@/components/Header"
import { AnimatedTestimonials } from "@/components/AnimatedTestimonials"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin, Clock } from "lucide-react"

const ContactUs = () => {
  const testimonials = [
    {
      quote: "With bucketlistt, we’re not just helping people book activities — we’re helping them live the stories they’ll tell for the rest of their lives.",
      name: "Shubham Makhecha",
      designation: "CA (AIR 36), Paragliding pilot, Riverrafter, Skiier, Surfer.",
      src: "/shubham_makhecha.png",
    },
    {
      quote: "We’re building the backend that powers once-in-a-lifetime moments — seamless APIs, real-time bookings, and zero friction between a dream and doing it.",
      name: "Darshit Joshi",
      designation: "Developer, AI enthusiasat, Tech guy",
      src: "/Darshit Joshi.png",
    },
    {
      quote: "we're guiding people through once-in-a-lifetime adventures with butcket listt. From bungee jumps to whitewater thrills, this platform is where every adrenaline dream gets booked and lived!",
      name: "Nitant Desai",
      designation: "CA, Trek Leader",
      src: "/nitant_desai.jpg",
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#940fdb]/10 to-[#6a0fb5]/10 dark:from-[#940fdb]/30 dark:to-[#6a0fb5]/30">
        <div className="container text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#940fdb] to-[#6a0fb5] bg-clip-text text-transparent">
            Get in Touch
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions about your next adventure? We're here to help you
            create unforgettable experiences.
          </p>
        </div>
      </section>

      {/* Contact Information */}
      <section className="pt-16 px-4">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 mx-auto mb-4 bg-white border-2 border-purple-500 rounded-lg flex items-center justify-center">
                  <Mail className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle>Email Us</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href="mailto:contact@bucketlistt.com"
                  className="text-muted-foreground hover:underline"
                >
                  contact@bucketlistt.com
                </a>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 mx-auto mb-4 bg-white border-2 border-purple-500 rounded-lg flex items-center justify-center">
                  <Phone className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle>Call Us</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href="tel:+918200362890"
                  className="text-muted-foreground hover:underline"
                >
                  +91 820 036 2890
                </a>
                <p className="text-muted-foreground">Mon-Fri, 9AM-6PM IST</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 mx-auto mb-4 bg-white border-2 border-purple-500 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle>Visit Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Ahmedabad, Gujarat</p>
                <p className="text-muted-foreground">India</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 mx-auto mb-4 bg-white border-2 border-purple-500 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle>Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Within 24 hours</p>
                <p className="text-muted-foreground">Usually same day</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-8 px-4">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Team</h2>
            <p className="text-muted-foreground">
              Here is the team behind the bucketlistt.
            </p>
          </div>
          <AnimatedTestimonials testimonials={testimonials} autoplay={true} />
        </div>
      </section>

      {/* Contact Form Section */}
      {/* <section className="py-16 px-4 bg-muted/30">
          <div className="container">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Send us a Message</h2>
                <p className="text-muted-foreground">
                  Ready to start planning your next adventure? Drop us a line and we'll get back to you soon.
                </p>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Contact Form</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll respond within 24 hours.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">First Name</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 border border-input rounded-md bg-background"
                          placeholder="Enter your first name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Last Name</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 border border-input rounded-md bg-background"
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input 
                        type="email" 
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                        placeholder="Enter your email"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Subject</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                        placeholder="What is this about?"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Message</label>
                      <textarea 
                        rows={6}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background resize-none"
                        placeholder="Tell us how we can help you..."
                      ></textarea>
                    </div>
                    
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section> */}
    </div>
  );
}

export default ContactUs
