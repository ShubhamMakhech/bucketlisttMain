  import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const ConfirmBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect to home page after 5 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleViewBookings = () => {
    navigate('/bookings');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-4 animate-pulse">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Confirmed! 🎉
          </h1>
          <p className="text-gray-600 text-lg">
            Your experience has been successfully booked
          </p>
        </div>

        {/* Booking Details Card */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-gray-800 flex items-center justify-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              {/* Booking Details */}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <p className="text-gray-600 text-lg">
                Your booking has been confirmed successfully!
              </p>
              <p className="text-gray-500 text-sm mt-2">
                You will receive a confirmation email shortly.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-8 shadow-lg border-0 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              What's Next?
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">1</span>
                </div>
                <p>Check your email for booking confirmation</p>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-purple-600">2</span>
                </div>
                <p>Prepare for your amazing experience</p>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-green-600">3</span>
                </div>
                <p>Arrive on time and enjoy!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleViewBookings}
            variant="outline"
            size="lg"
            className="flex items-center gap-2 bg-white hover:bg-gray-50 border-2 border-gray-200"
          >
            <Clock className="w-5 h-5" />
            View My Bookings
          </Button>
          
          <Button
            onClick={handleGoHome}
            size="lg"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
          >
            Continue Exploring
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Auto-redirect notice */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
            <Clock className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-blue-600">
              Redirecting to home page in 5 seconds...
            </p>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Booked by: <span className="font-medium text-gray-700">{user.email}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmBookingPage;
