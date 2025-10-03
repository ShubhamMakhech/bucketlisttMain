import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Send, X, Minimize2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hi there! 👋 I'm your bucketlistt AI assistant. I can help you discover amazing experiences, answer questions about destinations, assist with bookings, and provide travel recommendations. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Get API key from Supabase Edge Function
  const getApiKey = async () => {
    const supabaseUrl =
      import.meta.env.VITE_SUPABASE_URL ||
      "https://uaptkggmrsxoqayjjnlz.supabase.co";
    const response = await fetch(`${supabaseUrl}/functions/v1/get-secrets`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });
    const secrets = await response.json();
    return secrets.groqAuthKey;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;

      if (!apiKey) {
        throw new Error("API key not available");
      }

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: `You are a helpful AI assistant for bucketlistt, a travel experiences booking platform. Here's what you need to know about bucketlistt:

ABOUT bucketlistt:
bucketlistt is a comprehensive travel experiences platform that helps people discover and book amazing activities, tours, and experiences around the world. We connect travelers with unique adventures and local experiences.

KEY FEATURES:
- Discover curated experiences across various destinations
- Book tours, activities, and unique local experiences
- Browse by categories like adventure, culture, food, nature, etc.
- Read reviews and ratings from other travelers
- Save favorites for future reference
- Secure booking and payment processing
- User profiles and booking management
- Vendor dashboard for experience providers

WHAT YOU CAN HELP WITH:
1. Experience Discovery: Help users find experiences based on their interests, location, budget, or travel dates
2. Destination Information: Provide insights about destinations, best times to visit, local culture, etc.
3. Booking Assistance: Guide users through the booking process and answer questions about experiences
4. Travel Recommendations: Suggest experiences based on user preferences and past bookings
5. General Support: Answer questions about the platform, policies, and features
6. Vendor Support: Help vendors understand how to create and manage their experiences

USER CONTEXT:
${user ? `The user is logged in as ${user.email}` : "The user is not logged in"}

TONE & STYLE:
- Be friendly, enthusiastic, and helpful
- Show excitement about travel and experiences
- Provide specific, actionable recommendations
- Ask clarifying questions to better assist users
- Keep responses concise but informative
- Use emojis appropriately to make conversations engaging
- If users ask about booking, guide them to the relevant pages
- If users need to sign up, direct them to the auth page

Always aim to inspire users to explore and book amazing experiences through bucketlistt!`,
              },
              {
                role: "user",
                content: input.trim(),
              },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();
      const aiResponse =
        data.choices[0]?.message?.content ||
        "Sorry, I could not generate a response.";

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error calling Groq API:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "Sorry, I encountered an error. Please try again later. In the meantime, feel free to explore our experiences or contact our support team! 😊",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "1",
        content:
          "Hi there! 👋 I'm your bucketlistt AI assistant. I can help you discover amazing experiences, answer questions about destinations, assist with bookings, and provide travel recommendations. How can I help you today?",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-3 md:bottom-8 md:right-10 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          className="rounded-full h-12 w-12  bg-white bg-[url('/bucketlistt_chatbot_logo.svg')] bg-center bg-cover shadow-lg hover:shadow-xl transition-all duration-300 group flex items-center justify-center
          /* Light mode: Dark circular background */
            border-none 
          /* Dark mode: Light background with transparency */
          dark:bg-white dark:bg-opacity-10 dark:backdrop-blur-md dark:border-white dark:border-opacity-20"
        >
          <span className="sr-only">Open AI Chat</span>
        </Button>

        {/* Floating notification */}
        <div className="absolute -top-12 -left-20 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-white px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          Need help? Ask me anything! 💬
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white dark:border-t-neutral-800"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card
        className={cn(
          "w-80 md:w-96 shadow-2xl transition-all duration-300 bg-white/10 backdrop-blur-md border border-white/20",
          isMinimized ? "h-14" : "h-[500px]"
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white/20 backdrop-blur-md text-neutral-800 dark:text-white rounded-t-lg border-b border-white/20">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <strong>bucketlistt</strong> AI Assistant
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 p-0 text-neutral-700 dark:text-white hover:bg-white/30"
              title={isMinimized ? "Expand chat" : "Minimize chat"}
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0 text-neutral-700 dark:text-white hover:bg-white/30"
              title="Close chat"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[450px]">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
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
                        "max-w-[85%] rounded-lg px-3 py-2 text-sm break-words",
                        message.isUser
                          ? "bg-gradient-to-r from-gradient-secondary-start to-gradient-secondary-end text-white"
                          : "bg-muted text-muted-foreground border"
                      )}
                    >
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                      <div
                        className={cn(
                          "text-xs mt-1 opacity-70",
                          message.isUser
                            ? "text-white/70"
                            : "text-muted-foreground"
                        )}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground border">
                      <div className="flex items-center space-x-1">
                        <div
                          className="w-2 h-2 bg-current rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
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
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-white/20 bg-white/10 backdrop-blur-md">
              <div className="flex space-x-2">
                <Input
                  placeholder="Ask me about travel experiences..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  size="sm"
                  className="bg-gradient-to-r from-gradient-secondary-start to-gradient-secondary-end hover:from-info-dark hover:to-gradient-secondary-end px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-2 text-center">
                Created by Darshit Joshi
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
