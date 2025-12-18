import { Badge } from "@/components/ui/badge";
import { MapPin, Activity } from "lucide-react";
import detailedItineraries from "@/data/detailed-itineraries.json";

interface DetailedItineraryProps {
  destinationName: string;
}

export const DetailedItinerary = ({
  destinationName,
}: DetailedItineraryProps) => {
  const itinerary =
    detailedItineraries[destinationName as keyof typeof detailedItineraries];

  if (!itinerary) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
          <MapPin className="h-8 w-8 text-orange-500" />
          {itinerary.title}
        </h2>
        <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
          {itinerary.description}
        </p>

        {/* Adventure Activities */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            Adventure Activities to do here
          </h3>
          <div className="flex flex-wrap gap-2">
            {itinerary.adventureActivities.map((activity, index) => {
              const colors = [
                "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30",
                "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30",
                "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30",
                "bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30",
                "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30",
                "bg-pink-500/20 text-pink-400 border-pink-500/30 hover:bg-pink-500/30",
                "bg-indigo-500/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/30",
                "bg-teal-500/20 text-teal-400 border-teal-500/30 hover:bg-teal-500/30",
                "bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30",
                "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30",
                "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30",
                "bg-violet-500/20 text-violet-400 border-violet-500/30 hover:bg-violet-500/30",
              ];

              return (
                <Badge
                  key={index}
                  variant="secondary"
                  className={colors[index % colors.length]}
                >
                  {activity}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day-by-Day Itinerary */}
      <div className="space-y-8">
        <h3 className="text-2xl font-semibold mb-8 text-orange-500">
          Curated Itinerary
        </h3>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>

          {itinerary.itinerary.map((day, index) => (
            <div key={day.day} className="relative mb-12 last:mb-0">
              {/* Timeline dot */}
              <div className="absolute left-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center z-10">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>

              {/* Content */}
              <div className="ml-16">
                <div className="mb-2">
                  <span className="text-sm text-muted-foreground font-medium">
                    DAY {day.day}
                  </span>
                </div>

                <h4 className="text-xl font-semibold text-foreground mb-3">
                  {day.title}
                </h4>

                <div className="space-y-1 mb-4">
                  {day.activities.map((activity, activityIndex) => (
                    <div
                      key={activityIndex}
                      className="text-muted-foreground leading-snug"
                    >
                      • {activity}
                    </div>
                  ))}
                </div>

                {/* Image below content (if available) */}
                {(day as any).image && (
                  <div className="mt-4 max-w-lg">
                    <img
                      src={(day as any).image}
                      alt={`Day ${day.day} - ${day.title}`}
                      className="w-full h-64 object-cover rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:rotate-1"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>

              {index < itinerary.itinerary.length - 1 && (
                <div className="mt-6 pt-6 border-b border-border/30"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
