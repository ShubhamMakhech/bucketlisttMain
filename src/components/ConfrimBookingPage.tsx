import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const ConfirmBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleViewBookings = () => {
    navigate('/bookings');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background SVGs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top Right Mountain */}
        <svg
          className="absolute -top-10 -right-10 w-64 h-64 opacity-10"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M100 40L160 140H40L100 40Z" fill="#940FDB" />
          <path d="M130 70L170 140H90L130 70Z" fill="#940FDB" opacity="0.6" />
        </svg>

        {/* Bottom Left Compass */}
        <svg
          className="absolute -bottom-10 -left-10 w-48 h-48 opacity-10"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="45" stroke="#940FDB" strokeWidth="2" />
          <path d="M50 10L55 45L50 50L45 45L50 10Z" fill="#940FDB" />
          <path d="M90 50L55 55L50 50L55 45L90 50Z" fill="#940FDB" opacity="0.6" />
          <path d="M50 90L45 55L50 50L55 55L50 90Z" fill="#940FDB" opacity="0.4" />
          <path d="M10 50L45 45L50 50L45 55L10 50Z" fill="#940FDB" opacity="0.6" />
        </svg>

        {/* Top Left Paraglider */}
        <svg
          className="absolute top-20 left-10 w-32 h-32 opacity-10"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M20 30C20 30 35 20 50 20C65 20 80 30 80 30L70 40C70 40 60 35 50 35C40 35 30 40 30 40L20 30Z" fill="#940FDB" />
          <line x1="30" y1="40" x2="45" y2="80" stroke="#940FDB" strokeWidth="1" />
          <line x1="70" y1="40" x2="55" y2="80" stroke="#940FDB" strokeWidth="1" />
          <circle cx="50" cy="85" r="3" fill="#940FDB" />
        </svg>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Success SVG Icon with Adventure Theme */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-4 relative">
            {/* Main Success Circle */}
            <svg
              width="100"
              height="100"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="animate-pulse"
            >
              <circle cx="50" cy="50" r="48" fill="#F3EFFB" />
              <circle cx="50" cy="50" r="44" fill="white" stroke="#940FDB" strokeWidth="3" />
              <path
                d="M32 50L42 60L68 34"
                stroke="#940FDB"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Small stars decoration */}
              <circle cx="20" cy="30" r="2" fill="#940FDB" opacity="0.5" />
              <circle cx="80" cy="35" r="2.5" fill="#940FDB" opacity="0.5" />
              <circle cx="25" cy="70" r="1.5" fill="#940FDB" opacity="0.5" />
              <circle cx="75" cy="68" r="2" fill="#940FDB" opacity="0.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-gray-600">
            Your adventure awaits! 🎉
          </p>
        </div>

        {/* Main Card with Adventure Icon */}
        <Card className="mb-6 shadow-lg border border-purple-100 relative overflow-hidden">
          {/* Decorative corner pattern */}
          <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0L100 0L100 100L0 0Z" fill="#940FDB" />
            </svg>
          </div>

          <CardContent className="p-6 relative">
            {/* Success Message with Icon */}
            <div className="text-center pb-6 border-b border-purple-50">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-50 rounded-full mb-3">
                {/* Adventure Map Icon */}
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 20L3 17V4L9 7M9 20L15 17M9 20V7M15 17L21 20V7L15 4M15 17V4M9 7L15 4"
                    stroke="#940FDB"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="7" cy="10" r="1.5" fill="#940FDB" />
                  <circle cx="17" cy="14" r="1.5" fill="#940FDB" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium mb-1">
                Confirmation sent!
              </p>
              <p className="text-sm text-gray-500">
                Check your email for details
              </p>
            </div>

            {/* Next Steps with Icons */}
            <div className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center mt-0.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 8L10.89 13.26C11.55 13.67 12.45 13.67 13.11 13.26L21 8M5 19H19C20.1 19 21 18.1 21 17V7C21 5.9 20.1 5 19 5H5C3.9 5 3 5.9 3 7V17C3 18.1 3.9 19 5 19Z" stroke="#940FDB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700">Check your email confirmation</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center mt-0.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.5 8.5L22 9.5L17 14.5L18 21L12 17.5L6 21L7 14.5L2 9.5L8.5 8.5L12 2Z" stroke="#940FDB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700">Prepare for your experience</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center mt-0.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="#940FDB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M15.6947 13.7H15.7037M15.6947 16.7H15.7037M11.9955 13.7H12.0045M11.9955 16.7H12.0045M8.29431 13.7H8.30329M8.29431 16.7H8.30329" stroke="#940FDB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700">Arrive on time and enjoy!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleViewBookings}
            size="lg"
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2"
            >
              <path
                d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            View My Bookings
          </Button>

          <Button
            onClick={handleGoHome}
            variant="outline"
            size="lg"
            className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 hover:border-purple-300"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* User Info */}
        {user && (
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              Booked as <span className="font-medium text-gray-700">{user.email}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmBookingPage;
