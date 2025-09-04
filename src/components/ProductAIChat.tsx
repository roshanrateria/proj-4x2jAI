'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, X, Bot, User, Sparkles, Package } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useTranslation } from '@/contexts/TranslationContext'
import { TranslatedText } from '@/components/TranslatedText'
import ReactMarkdown from 'react-markdown'

interface Product {
  id: string
  title: string
  description: string
  tagline?: string
  price: number
  images: string[]
  inStock: boolean
  stockQuantity: number
  tags: string[]
  // Discount & Pricing fields
  originalPrice?: number
  discountPercent?: number
  discountAmount?: number
  discountStart?: string
  discountEnd?: string
  isFeatured?: boolean
  // Artisan-specific fields
  material?: string
  technique?: string
  artForm?: string
  origin?: string
  length?: string
  width?: string
  height?: string
  weight?: string
  artisanStory?: string
  culturalSignificance?: string
  timeToCreate?: string
  isCustomizable?: boolean
  careInstructions?: string
  authenticityMark?: string
  createdAt: string
  seller: {
    id: string
    name: string
    address?: string
    latitude?: number
    longitude?: number
  }
}

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  typing?: boolean
}

interface ProductAIChatProps {
  product: Product
  isOpen: boolean
  onClose: () => void
}

export default function ProductAIChat({ product, isOpen, onClose }: ProductAIChatProps) {
  const { user, token } = useAuth()
  const { translate } = useTranslation()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! I'm Kala, your AI assistant. I can help you with questions about "${product.title}". \n\n**What I can help with:**\n- Product specifications and features\n- Materials and dimensions\n- Care instructions\n- Cultural significance\n- Artisan story\n\n**Note:** I can only answer based on the product information available. If something isn't mentioned in the product details, I'll let you know clearly. For shipping, returns, or policies, please contact the seller directly.`,
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

    try {
      const response = await fetch('/api/ai/product-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: inputText,
          product: {
            id: product.id,
            title: product.title,
            description: product.description,
            tagline: product.tagline,
            price: product.price,
            inStock: product.inStock,
            stockQuantity: product.stockQuantity,
            tags: product.tags,
            material: product.material,
            technique: product.technique,
            artForm: product.artForm,
            origin: product.origin,
            length: product.length,
            width: product.width,
            height: product.height,
            weight: product.weight,
            artisanStory: product.artisanStory,
            culturalSignificance: product.culturalSignificance,
            timeToCreate: product.timeToCreate,
            isCustomizable: product.isCustomizable,
            careInstructions: product.careInstructions,
            authenticityMark: product.authenticityMark,
            seller: product.seller
          },
          context: {
            userId: user?.id,
            userRole: user?.role,
            conversationHistory: messages.slice(-5) // Last 5 messages for context
          }
        })
      })

      const data = await response.json()

      if (response.ok) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          sender: 'bot',
          timestamp: new Date()
        }

        setMessages(prev => [...prev, botMessage])
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again later.',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }
  const quickQuestions = [
    'What material is this made of?',
    'What are the exact dimensions?',
    'How do I care for this product?',
    'Is this waterproof?',
    'Can this be customized?',
    'Tell me about the cultural significance'
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col">        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">
                <TranslatedText text="Product AI Assistant" />
              </h3>
              <p className="text-xs opacity-90">
                <TranslatedText text="Ask me about" /> "{product.title}"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 rounded-full p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Info Bar */}
        <div className="bg-gray-50 p-3 border-b border-gray-200 flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
            {product.images.length > 0 ? (
              <img 
                src={product.images[0]} 
                alt={product.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Package className="w-6 h-6 text-orange-400" />
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-800 text-sm truncate">{product.title}</h4>
            <p className="text-orange-600 font-semibold text-sm">₹{product.price.toLocaleString()}</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-xs text-blue-800">
          <p className="font-medium">💡 AI Assistant Guidelines:</p>
          <p>This AI can only answer questions about the specific product information available. For shipping, returns, or other policies, please contact the seller directly.</p>
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
                </div>

                <div className={`rounded-2xl px-4 py-2 ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {message.sender === 'bot' ? (
                    <div className="text-sm leading-relaxed">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 text-gray-800">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 ml-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 ml-2">{children}</ol>,
                          li: ({ children }) => <li className="text-gray-700 text-sm">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                          em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                          code: ({ children }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono text-gray-800">{children}</code>,
                        }}
                      >
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{message.text}</p>
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
        </div>        {/* Quick Questions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-600 mb-2">
              <TranslatedText text="Quick questions:" />
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputText(question)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors text-left"
                >
                  <TranslatedText text={question} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask me anything about this product..."
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
    </div>
  )
}
