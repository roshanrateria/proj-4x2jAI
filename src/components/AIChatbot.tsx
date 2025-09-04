'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, X, Bot, User, Sparkles, ExternalLink } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useTranslation } from '@/contexts/TranslationContext'
import { TranslatedText } from '@/components/TranslatedText'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

interface Product {
  id: string
  title: string
  price: number
  image?: string
  stockQuantity?: number
}

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  typing?: boolean
  productRecommendations?: Product[]
}

interface ChatbotProps {
  onProductRecommendation?: (productId: string) => void
}

export default function AIChatbot({ onProductRecommendation }: ChatbotProps) {
  const { user, token } = useAuth()
  const { translate, currentLanguage } = useTranslation()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [welcomeMessage, setWelcomeMessage] = useState("Hello! I'm Kala, your AI shopping assistant. I can help you find products, get recommendations, compare prices, and answer questions about our marketplace. How can I help you today?")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [inputPlaceholder, setInputPlaceholder] = useState('Ask me anything about products...')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize welcome message and translate it
  useEffect(() => {
    const initializeWelcomeMessage = async () => {
      const originalWelcome = "Hello! I'm Kala, your AI shopping assistant. I can help you find products, get recommendations, compare prices, and answer questions about our marketplace. How can I help you today?"
      const translatedWelcome = await translate(originalWelcome)
      setWelcomeMessage(translatedWelcome)
      
      const originalPlaceholder = "Ask me anything about products..."
      const translatedPlaceholder = await translate(originalPlaceholder)
      setInputPlaceholder(translatedPlaceholder)

      // Set initial welcome message
      if (messages.length === 0) {
        setMessages([{
          id: '1',
          text: translatedWelcome,
          sender: 'bot',
          timestamp: new Date()
        }])
      }
    }

    initializeWelcomeMessage()
  }, [currentLanguage, translate])

  // Update existing messages when language changes
  useEffect(() => {
    const translateExistingMessages = async () => {
      if (messages.length > 0 && currentLanguage !== 'en') {
        const translatedMessages = await Promise.all(
          messages.map(async (message) => {
            if (message.sender === 'bot') {
              const translatedText = await translate(message.text)
              return { ...message, text: translatedText }
            }
            return message
          })
        )
        setMessages(translatedMessages)
      }
    }

    if (messages.length > 0) {
      translateExistingMessages()
    }
  }, [currentLanguage])

  const sendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    try {      const response = await fetch('/api/ai/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: inputText,
          language: currentLanguage,
          context: {
            userId: user?.id,
            userRole: user?.role,
            conversationHistory: messages.slice(-5) // Last 5 messages for context
          }        })
      })

      const data = await response.json()

      if (response.ok) {
        // Translate the bot response if needed
        const translatedResponse = currentLanguage === 'en' ? data.response : await translate(data.response)
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: translatedResponse,
          sender: 'bot',
          timestamp: new Date()
        }

        setMessages(prev => [...prev, botMessage])

        // Handle product recommendations
        if (data.productRecommendations?.length > 0) {
          const recommendationText = "I found some products that might interest you:"
          const translatedRecommendationText = await translate(recommendationText)
          
          const recommendationMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: translatedRecommendationText,
            sender: 'bot',
            timestamp: new Date(),
            productRecommendations: data.productRecommendations
          }
          setMessages(prev => [...prev, recommendationMessage])
        }
      } else {
        throw new Error(data.error || 'Failed to get response')
      }    } catch (error) {
      console.error('Error sending message:', error)
      const errorText = 'Sorry, I encountered an error. Please try again later.'
      const translatedError = await translate(errorText)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: translatedError,
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const quickActions = [
    { text: 'Find electronics', action: 'search:electronics' },
    { text: 'Show popular products', action: 'popular' },
    { text: 'Compare prices', action: 'compare' },
    { text: 'Help with orders', action: 'orders' }
  ]

  const handleQuickAction = async (action: string) => {
    const actionTexts: Record<string, string> = {
      'search:electronics': 'Show me electronics products',
      'popular': 'What are the most popular products?',
      'compare': 'Help me compare product prices',
      'orders': 'I need help with my orders'
    }

    const actionText = actionTexts[action] || action
    const translatedAction = await translate(actionText)
    setInputText(translatedAction)
  }

  const openProductPage = (productId: string) => {
    router.push(`/products/${productId}`)
    if (onProductRecommendation) {
      onProductRecommendation(productId)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all flex items-center justify-center z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">
              <TranslatedText text="Kala AI Assistant" />
            </h3>
            <p className="text-xs opacity-90">
              <TranslatedText text="Your shopping companion" />
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 rounded-full p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[80%] ${
              message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.sender === 'user' 
                  ? 'bg-gradient-to-r from-orange-400 to-red-400 text-white' 
                  : 'bg-gradient-to-r from-purple-400 to-pink-400 text-white'
              }`}>
                {message.sender === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>              <div className={`rounded-2xl px-4 py-2 ${
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>                {message.sender === 'bot' ? (
                  <div className="text-sm leading-relaxed">
                    <ReactMarkdown
                      components={{
                        // Customize markdown components for better styling
                        p: ({ children }) => <p className="mb-2 last:mb-0 text-gray-800">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 ml-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 ml-2">{children}</ol>,
                        li: ({ children }) => <li className="text-gray-700 text-sm">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                        em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                        code: ({ children }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono text-gray-800">{children}</code>,
                        h1: ({ children }) => <h1 className="text-base font-bold mb-2 text-gray-900">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-sm font-semibold mb-2 text-gray-900">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-medium mb-1 text-gray-900">{children}</h3>,
                        // Remove default margins and ensure proper text color
                        blockquote: ({ children }) => <blockquote className="border-l-2 border-gray-300 pl-2 italic text-gray-600">{children}</blockquote>,
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{message.text}</p>
                )}
                
                {/* Product Recommendations */}
                {message.productRecommendations && message.productRecommendations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.productRecommendations.slice(0, 3).map((product) => (
                      <div 
                        key={product.id}
                        className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">{product.title}</h4>
                            <p className="text-green-600 font-semibold text-sm">₹{product.price.toLocaleString()}</p>
                            {product.stockQuantity !== undefined && (
                              <p className="text-xs text-gray-500">
                                {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => openProductPage(product.id)}
                            className="ml-2 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1 transition-colors"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {message.productRecommendations.length > 3 && (
                      <p className="text-xs text-gray-500 mt-2">
                        And {message.productRecommendations.length - 3} more products...
                      </p>
                    )}
                  </div>
                )}
                
                <p className={`text-xs mt-1 opacity-70 ${
                  message.sender === 'user' ? 'text-white' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.action)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors"
              >
                <TranslatedText text={action.text} />
              </button>
            ))}
          </div>
        </div>
      )}{/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={inputPlaceholder}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isTyping}
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || isTyping}
            className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
