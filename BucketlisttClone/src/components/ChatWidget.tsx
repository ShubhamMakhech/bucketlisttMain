import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, Send, MessageCircle, X } from "lucide-react"
import { useAIChat } from "@/hooks/useAIChat"
import { cn } from "@/lib/utils"

interface ChatWidgetProps {
  className?: string
  initialMessage?: string
}

export function ChatWidget({ className, initialMessage }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const { messages, isLoading, sendMessage, addMessage } = useAIChat()

  React.useEffect(() => {
    if (initialMessage && messages.length === 0) {
      addMessage({
        content: initialMessage,
        isUser: false
      })
    }
  }, [initialMessage, messages.length, addMessage])

  const handleSend = async () => {
    if (!input.trim()) return
    
    await sendMessage(input)
    setInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-4 right-4 z-50 rounded-full h-12 w-12 bg-blue-500 hover:bg-blue-600 shadow-lg",
          className
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <Card className={cn("fixed bottom-4 right-4 z-50 w-80 h-96 shadow-xl", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-blue-500 text-white rounded-t-lg">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bot className="h-4 w-4" />
          AI Assistant
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="h-6 w-6 p-0 text-white hover:bg-white/20"
        >
          <X className="h-3 w-3" />
        </Button>
      </CardHeader>
      
      <CardContent className="p-0 flex flex-col h-80">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
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
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                    message.isUser
                      ? "bg-blue-500 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-3 border-t">
          <div className="flex space-x-2">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}