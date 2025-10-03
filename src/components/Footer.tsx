import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import "../Styles/Footer.css";
export function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-background py-12 px-4 border-t border-border/50 FooterContainer">
      <div className="container">
        {/* Main Footer Content */}
        <div className="FooterGridContainer">
          {/* Company Info & QR Code */}
          <div className="">
            <div className="flex items-center space-x-2">
              <img
                src="https://prepseed.s3.ap-south-1.amazonaws.com/Bucketlistt.png"
                alt="bucketlistt Logo"
                className=" w-auto FooterLogoStyles"
              />
            </div>
            {/* QR Code Section */}
            {/* <div className="mb-4">
              <div className="w-20 h-20 mb-2">
                <img
                  src="/qr.png"
                  alt="Bucketlistt App QR Code"
                  className="w-full h-full rounded-lg"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Bucketlistt app
                <br />
                launching soon!!
              </p>
            </div> */}
          </div>
          {/* Get Help 24/7 */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-foreground">
              GET HELP 24/7
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-orange-500"
                  onClick={() => navigate("/contact")}
                >
                  Help center
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-orange-500"
                  onClick={() => navigate("/contact")}
                >
                  Chat with us
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-orange-500"
                  onClick={() => navigate("/contact")}
                >
                  Call us
                </Button>
              </li>
              <li className="text-muted-foreground">support@bucketlistt.com</li>
            </ul>
          </div>

          {/* Cities */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-foreground">
              CITIES
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-orange-500"
                  onClick={() =>
                    navigate(
                      "/destination/5f19264e-4947-4cb6-a35b-e2e20881c355"
                    )
                  }
                >
                  Rishikesh
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-orange-500"
                  onClick={() =>
                    navigate(
                      "/destination/102c9601-2356-4d5b-a79c-d6bf0534eca4"
                    )
                  }
                >
                  Goa
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-orange-500"
                  onClick={() =>
                    navigate(
                      "/destination/a4958a9b-afeb-4694-96dd-505fe2c23c51"
                    )
                  }
                >
                  Matheran
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-orange-500"
                >
                  more coming soon...
                </Button>
              </li>
            </ul>
          </div>

          {/* Bucketlistt */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-foreground">
              BUCKETLISTT
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground mb-2">
              <li>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-orange-500"
                  onClick={() => navigate("/our-story")}
                >
                  Our story
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-orange-500"
                  onClick={() => navigate("/coming-soon")}
                >
                  Careers
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-orange-500"
                  onClick={() => navigate("/coming-soon")}
                >
                  Newsroom
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-orange-500"
                  onClick={() => navigate("/coming-soon")}
                >
                  Company blog
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-orange-500"
                  onClick={() => navigate("/coming-soon")}
                >
                  Travel blog
                </Button>
              </li>
            </ul>
          </div>

          {/* Partners */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-foreground">
              PARTNERS
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-orange-500"
                  onClick={() => navigate("/coming-soon")}
                >
                  Experience providers
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-orange-500"
                  onClick={() => navigate("/coming-soon")}
                >
                  Affiliates
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-muted-foreground hover:text-orange-500"
                  onClick={() => navigate("/coming-soon")}
                >
                  Creators & influencers
                </Button>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Methods & Social Links */}
        <div className="border-t border-border/50 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
            {/* Payment Methods */}
            <div>
              <h4 className="font-semibold text-sm mb-3 text-foreground">
                WE ACCEPT
              </h4>
              <div className="flex flex-wrap gap-2">
                <div className="w-10 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                  VISA
                </div>
                <div className="w-10 h-6 bg-orange-500 rounded text-white text-xs flex items-center justify-center font-bold">
                  MC
                </div>
                <div className="w-10 h-6 bg-blue-700 rounded text-white text-xs flex items-center justify-center font-bold">
                  AMEX
                </div>
                <div className="w-10 h-6 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">
                  DC
                </div>
                <div className="w-10 h-6 bg-purple-600 rounded text-white text-xs flex items-center justify-center font-bold">
                  UPI
                </div>
                <div className="w-10 h-6 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">
                  GPay
                </div>
                <div className="w-10 h-6 bg-blue-800 rounded text-white text-xs flex items-center justify-center font-bold">
                  PayTM
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-orange-500"
                onClick={() =>
                  window.open(
                    "https://www.instagram.com/bucketlistt_experiences/",
                    "_blank"
                  )
                }
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-orange-500"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-orange-500"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-orange-500"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-orange-500"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-border/50 pt-6 mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm text-muted-foreground">
            <div className="flex flex-wrap gap-4">
              <span>© 2025 bucketlistt. All rights reserved.</span>
              <Button
                variant="link"
                className="p-0 h-auto text-sm text-muted-foreground hover:text-orange-500"
                onClick={() => navigate("/terms")}
              >
                Terms of usage
              </Button>
              <Button
                variant="link"
                className="p-0 h-auto text-sm text-muted-foreground hover:text-orange-500"
              >
                Privacy policy
              </Button>
              <Button
                variant="link"
                className="p-0 h-auto text-sm text-muted-foreground hover:text-orange-500"
              >
                Company details
              </Button>
            </div>
            {/* <div className="text-sm text-muted-foreground">
              Proudly built in India by{" "}
              <span
                className="font-bold cursor-pointer hover:text-orange-500 transition-colors duration-300"
                onClick={() =>
                  window.open("https://darshit-joshi.vercel.app/", "_blank")
                }
              >
                Darshit
              </span>
            </div> */}
          </div>
        </div>
      </div>
    </footer>
  );
}
