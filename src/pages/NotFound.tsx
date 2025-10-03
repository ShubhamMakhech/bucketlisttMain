import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft, Wifi, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const [animate, setAnimate] = useState(false);
  const navigate = useNavigate();
  const currentPath = "/some-missing-page"; // You can replace this with actual path logic

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      currentPath
    );
    // Trigger animation after component mounts
    setAnimate(true);
  }, [currentPath]);

  const floatingElements = Array.from({ length: 6 }, (_, i) => (
    <div
      key={i}
      className={`absolute w-2 h-2 bg-blue-200 rounded-full opacity-60 animate-bounce`}
      style={{
        left: `${20 + i * 15}%`,
        top: `${30 + (i % 2) * 20}%`,
        animationDelay: `${i * 0.3}s`,
        animationDuration: "2s",
      }}
    />
  ));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      {floatingElements}

      {/* Large background circle */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-gradient-to-r from-indigo-100 to-pink-100 rounded-full opacity-20 blur-2xl"></div>

      <div
        className={`max-w-2xl mx-auto text-center z-10 transform transition-all duration-1000 ${
          animate ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        {/* 404 Graphic */}
        <div className="relative mb-8">
          {/* Main 404 text with gradient */}
          <h1 className="text-8xl md:text-9xl font-black bg-gradient-to-br from-brand-primary to-brand-secondary bg-clip-text text-transparent mb-4 relative">
            4
            <span className="relative">
              0{/* Broken wifi icon in the middle of 0 */}
              <Wifi className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 text-gray-400 rotate-45" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 md:h-12 bg-red-500 rotate-45"></div>
            </span>
            4
          </h1>

          {/* Decorative elements around 404 */}
          <AlertTriangle className="absolute top-4 left-1/4 w-6 h-6 text-yellow-400 animate-pulse" />
          <div className="absolute top-8 right-1/4 w-4 h-4 bg-red-400 rounded-full animate-ping"></div>
        </div>

        {/* Error message */}
        <div className="mb-8 space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Whoops! This trail doesn’t exist 🌄
          </h2>
          <p className="text-base text-neutral-600 mb-6">
            Looks like this path hasn’t been mapped yet. Explore other
            adventures or start planning your next journey!
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            onClick={() => navigate("/")}
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-brand-primary to-brand-secondary text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105"
          >
            <Home className="w-5 h-5 transition-transform group-hover:scale-110" />
            Back to Home
          </a>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg shadow-md hover:shadow-lg border border-gray-200 transition-all duration-300 hover:scale-105 hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-brand-primary-light rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default NotFound;
