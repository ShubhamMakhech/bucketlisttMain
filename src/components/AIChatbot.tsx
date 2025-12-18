import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, X, Minimize2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAIChat,
  type AIChatContext,
  type UIPayload,
  type ActionSuggestion,
} from "@/hooks/useAIChat";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { isSameDay } from "date-fns";

export function AIChatbot() {
  const { user } = useAuth(); 
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch destinations
  const { data: destinations = [] } = useQuery({
    queryKey: ["chatbot-destinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destinations")
        .select("id, title")
        .order("created_at", { ascending: true })
        .limit(10);

      if (error) throw error;
      return (
        data?.map((d) => ({
          id: d.id,
          name: d.title,
        })) || []
      );
    },
  });

  // Fetch activities (experiences with their activities)
  const { data: activities = [] } = useQuery({
    queryKey: ["chatbot-activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select(
          `
          id,
          title,
          description,
          price,
          currency,
          duration,
          location,
          vendor_id,
          category,
          destination_id,
          destinations (
            id,
            title
          ),
          activities!inner (
            id,
            name,
            price,
            discounted_price,
            currency,
            duration,
            is_active
          )
        `
        )
        .eq("is_active", true)
        .eq("activities.is_active", true)
        .limit(50); // Increased to get more activities

      if (error) throw error;

      return (
        data?.flatMap(
          (exp: any) =>
            (exp.activities as any[])
              ?.filter((activity) => activity.is_active === true) // Double-check filter
              .map((activity) => ({
                id: activity.id,
                experience_id: exp.id, // Store experience ID for navigation
                experience_data: exp, // Store full experience data (for navigation, not sent to AI)
                title: `${exp.title} - ${activity.name}`,
                activity_name: activity.name, // Explicit activity name for AI filtering
                experience_title: exp.title, // Experience title
                destination: exp.destinations?.title || null, // Destination name
                category: exp.category || null, // Category
                short_description: exp.description
                  ? exp.description
                      .replace(/<[^>]*>/g, "") // Remove HTML tags
                      .substring(0, 80) + "..."
                  : "",
                price_range: activity.discounted_price
                  ? `${exp.currency || "INR"} ${activity.discounted_price} - ${
                      activity.price
                    }`
                  : `${exp.currency || "INR"} ${activity.price}`,
                duration: activity.duration || exp.duration || "N/A",
                vendor_id: exp.vendor_id,
              })) || []
        ) || []
      );
    },
  });

  // Fetch user bookings
  const { data: userBookings = [] } = useQuery({
    queryKey: ["chatbot-user-bookings", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          id,
          booking_date,
          status,
          booking_amount,
          time_slots (
            start_time,
            end_time,
            activities (
              id,
              name
            )
          ),
          experiences (
            title
          )
        `
        )
        .eq("user_id", user.id)
        .order("booking_date", { ascending: false })
        .limit(10);

      if (error) throw error;

      return (
        (data as any[])?.map((booking: any) => ({
          id: booking.id,
          activity_id: booking.time_slots?.activities?.id,
          date: booking.booking_date,
          time: booking.time_slots?.start_time
            ? `${booking.time_slots.start_time} - ${booking.time_slots.end_time}`
            : undefined,
          status: booking.status,
          vendor: "N/A", // Could fetch vendor info if needed
          price: booking.booking_amount,
          activity_title:
            booking.time_slots?.activities?.name || booking.experiences?.title,
        })) || []
      );
    },
    enabled: !!user,
  });

  // Get today's bookings
  const todayBookings = useMemo(() => {
    if (!userBookings.length) return [];
    const today = new Date();
    return userBookings
      .filter(
        (booking) => booking.date && isSameDay(new Date(booking.date), today)
      )
      .map((booking) => ({
        id: booking.id,
        activity_title: booking.activity_title,
        time: booking.time,
        status: booking.status,
        vendor: booking.vendor,
      }));
  }, [userBookings]);

  // Build context
  const context: AIChatContext = useMemo(
    () => ({
      session: !!user,
      user: user
        ? {
            id: user.id,
            name:
              user.user_metadata?.full_name ||
              user.email?.split("@")[0] ||
              "User",
            email: user.email || "",
          }
        : null,
      available_destinations: destinations,
      available_activities: activities,
      user_bookings: userBookings,
      today_bookings: todayBookings,
      system_time: new Date().toISOString(),
    }),
    [user, destinations, activities, userBookings, todayBookings]
  );

  const { messages, isLoading, sendMessage, clearMessages } = useAIChat({
    context,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current && isOpen) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const message = await sendMessage(input);
    setInput("");

    // Handle action suggestions
    if (message.actionSuggestion) {
      handleActionSuggestion(message.actionSuggestion);
    }
  };

  const handleActionSuggestion = (action: ActionSuggestion) => {
    switch (action.type) {
      case "open_login":
        navigate("/auth");
        break;
      case "open_booking_modal":
        // This would need to be handled by parent component or context
        // For now, navigate to experiences page
        navigate("/experiences");
        break;
      case "navigate":
        if (action.payload?.path) {
          navigate(action.payload.path);
        }
        break;
      default:
        break;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleItemAction = async (item: any) => {
    // Handle navigation based on item properties
    if (item.path) {
      navigate(item.path);
      return;
    }

    // Check for special navigation IDs first (before treating as experience ID)
    const itemId = item.id?.toLowerCase() || "";
    const itemTitle = item.title?.toLowerCase() || "";

    // Check if ID or title indicates bookings navigation
    if (
      itemId.includes("booking") ||
      itemId.includes("check_bookings") ||
      itemId.includes("view_bookings") ||
      itemTitle.includes("booking")
    ) {
      navigate("/bookings");
      return;
    }

    // Check if ID or title indicates activities/experiences search
    if (
      itemId.includes("activit") ||
      itemId.includes("find") ||
      itemId.includes("search") ||
      itemId.includes("experience") ||
      itemTitle.includes("activit") ||
      itemTitle.includes("find")
    ) {
      navigate("/experiences");
      return;
    }

    // Handle experience/activity navigation with proper state
    if (item.id && item.id.length > 10 && !item.id.includes("_")) {
      try {
        // First, check if we already have this activity in our fetched activities
        const existingActivity = activities.find((a: any) => a.id === item.id);

        let experienceId = item.id;
        let experienceData = null;

        if (existingActivity?.experience_data) {
          // We have the experience data cached!
          experienceId = existingActivity.experience_id || item.id;
          experienceData = existingActivity.experience_data;
        } else if (existingActivity?.experience_id) {
          // We have the experience ID but not the data, fetch it (only if active)
          const { data: expData } = await supabase
            .from("experiences")
            .select("*")
            .eq("id", existingActivity.experience_id)
            .eq("is_active", true)
            .single();

          if (expData) {
            experienceId = existingActivity.experience_id;
            experienceData = expData;
          }
        } else {
          // Not in our cache, check if it's an activity ID first
          const { data: activityData } = await supabase
            .from("activities")
            .select("experience_id, experiences(*)")
            .eq("id", item.id)
            .eq("is_active", true)
            .single();

          if (activityData?.experience_id) {
            // It's an activity ID, get the experience (only if experience is also active)
            const exp = activityData.experiences as any;
            if (exp?.is_active === true) {
              experienceId = activityData.experience_id;
              experienceData = exp;
            }
          } else {
            // It's likely an experience ID, fetch the experience (only if active)
            const { data: expData } = await supabase
              .from("experiences")
              .select("*")
              .eq("id", item.id)
              .eq("is_active", true)
              .single();

            if (expData) {
              experienceData = expData;
            }
          }
        }

        if (experienceData) {
          // Use url_name if available, otherwise fall back to generating slug from title
          const experienceName = experienceData.url_name || (experienceData.title || item.title || "")
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();

          navigate(`/experience/${experienceName}`, {
            state: {
              experienceData: {
                id: experienceId,
                title: experienceData.title,
                image_url: experienceData.image_url,
                price: experienceData.price,
                original_price: experienceData.original_price,
                currency: experienceData.currency,
                duration: experienceData.duration,
                group_size: experienceData.group_size,
                description: experienceData.description,
                location: experienceData.location,
                rating: experienceData.rating,
                reviews_count: experienceData.reviews_count,
                url_name: experienceData.url_name,
              },
              fromPage: "ai-chatbot",
              timestamp: Date.now(),
            },
          });
          return;
        }
      } catch (error) {
        console.error("Error fetching experience data:", error);
        // Fallback: try to navigate with title as slug
        if (item.title) {
          // Extract experience title if it's in format "Experience - Activity"
          const titleParts = item.title.split(" - ");
          const experienceTitle = titleParts[0] || item.title;

          const experienceName = experienceTitle
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
          navigate(`/experience/${experienceName}`, {
            state: {
              experienceData: {
                id: item.id,
                title: experienceTitle,
              },
              fromPage: "ai-chatbot",
              timestamp: Date.now(),
            },
          });
        }
      }
    }
  };

  const renderUIPayload = (payload: UIPayload) => {
    if (!payload || !payload.items || payload.items.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {payload.items.map((item, index) => (
          <Card
            key={item.id || index}
            className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleItemAction(item)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{item.title}</h4>
                {item.short_description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {item.short_description}
                  </p>
                )}
                {item.price_text && (
                  <Badge variant="secondary" className="mt-2">
                    {item.price_text}
                  </Badge>
                )}
              </div>
              {item.action && (
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemAction(item);
                  }}
                >
                  {item.action === "book" ? "Book" : "View"}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full h-14 w-14 bg-[#940fdb] hover:bg-[#7a0bb8] shadow-lg"
        size="icon"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        "fixed bottom-4 right-4 z-50 shadow-2xl transition-all duration-300",
        isMinimized ? "w-80 h-16" : "w-96 h-[600px]"
      )}
    >
      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between space-y-0 pb-2 bg-[#940fdb] text-white rounded-t-lg",
          isMinimized && "pb-2"
        )}
      >
        <CardTitle className="text-sm flex items-center gap-2">
          <Bot className="h-4 w-4" />
          bucketlistt Assistant
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
          >
            <Minimize2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsOpen(false);
              setIsMinimized(false);
            }}
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[540px]">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Hey! I'm bucketlistt Assistant 🎒</p>
                  <p className="text-xs mt-1">
                    Ask me about adventures, bookings, or destinations!
                  </p>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.isUser ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                      message.isUser
                        ? "bg-[#940fdb] text-white"
                        : "bg-muted text-foreground"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.uiPayload && renderUIPayload(message.uiPayload)}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 border-t flex items-center gap-2">
            <Input
              ref={inputRef}
              placeholder="Ask about adventures..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="bg-[#940fdb] hover:bg-[#7a0bb8] text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
