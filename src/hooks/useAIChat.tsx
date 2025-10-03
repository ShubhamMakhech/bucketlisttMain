import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

interface UseAIChatOptions {
  apiKey?: string
  model?: string
  maxTokens?: number
  temperature?: number
}

export function useAIChat(options: UseAIChatOptions = {}) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const {
    apiKey = import.meta.env.VITE_GROQ_API_KEY || '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',
    model = 'llama3-8b-8192',
    maxTokens = 500,
    temperature = 0.7
  } = options

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: `You are a helpful AI assistant for bucketlistt, a travel experiences booking platform. 

ABOUT bucketlistt:
bucketlistt connects travelers with unique adventures and local experiences worldwide.

KEY FEATURES:
- Discover curated experiences across various destinations
- Book tours, activities, and unique local experiences
- Browse by categories (adventure, culture, food, nature, etc.)
- Read reviews and ratings from other travelers
- Save favorites and manage bookings
- Vendor dashboard for experience providers

USER CONTEXT:
${user ? `The user is logged in as ${user.email}` : 'The user is not logged in'}

GUIDELINES:
- Be friendly, enthusiastic, and helpful
- Provide specific, actionable recommendations
- Ask clarifying questions to better assist users
- Keep responses concise but informative
- Use emojis appropriately
- Guide users to relevant platform features
- Inspire users to explore and book experiences

Always aim to help users discover and book amazing experiences!`
            },
            {
              role: 'user',
              content: content.trim()
            }
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response from AI')
      }

      const data = await response.json()
      const aiResponse = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
      return aiMessage
    } catch (error) {
      console.error('Error calling AI API:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again later! 😊',
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      return errorMessage
    } finally {
      setIsLoading(false)
    }
  }, [apiKey, model, maxTokens, temperature, user, isLoading])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
    return newMessage
  }, [])

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    addMessage
  }
}