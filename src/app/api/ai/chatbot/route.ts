import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini'
import { BhashiniService } from '@/lib/bhashini'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, language = 'en', context } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get user info if authenticated
    let user = null
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (token) {
      try {
        user = await getUserFromToken(token)
      } catch (error) {
        // Continue without user info if token is invalid
      }
    }

    // Translate message to English for processing if needed
    const messageForProcessing = language === 'en' ? message : await BhashiniService.translateText(message, language, 'en')

    // Analyze message intent
    const intent = analyzeIntent(messageForProcessing.toLowerCase())
    
    let response = ''
    let productRecommendations: any[] = []

    switch (intent.type) {      case 'product_search':
        const searchResults = await searchProducts(intent.query || '', intent.category)
        response = formatProductSearchResponse(searchResults)
        productRecommendations = searchResults.slice(0, 3)
        break

      case 'price_comparison':
        response = await handlePriceComparison(intent.query || messageForProcessing)
        break

      case 'order_help':
        response = await handleOrderHelp(user)
        break

      case 'general_info':
        response = await handleGeneralQuery(messageForProcessing, context)
        break

      case 'recommendation':
        const recommendations = await getRecommendations(user, intent.category)
        response = formatRecommendationResponse(recommendations)
        productRecommendations = recommendations
        break

      default:
        response = await handleGeneralQuery(messageForProcessing, context)
    }

    // Translate response back to user's language if needed
    const finalResponse = language === 'en' ? response : await BhashiniService.translateText(response, 'en', language)

    return NextResponse.json({ 
      response: finalResponse,
      productRecommendations,
      intent: intent.type
    })
  } catch (error) {
    console.error('Error in chatbot:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

function analyzeIntent(message: string) {
  const searchKeywords = ['find', 'search', 'show', 'looking for', 'need', 'want', 'any', 'some']
  const priceKeywords = ['price', 'cost', 'compare', 'cheaper', 'expensive']
  const orderKeywords = ['order', 'delivery', 'tracking', 'shipped', 'status']
  const recommendationKeywords = ['recommend', 'suggest', 'best', 'popular', 'trending']
  const choiceKeywords = ['which one', 'which should', 'go for', 'choose', 'pick', 'select', 'decide', 'better']

  // Expanded categories to include more product types
  const categories = [
    'electronics', 'clothing', 'books', 'home', 'kitchen', 'sports', 'beauty',
    'ceramic', 'mug', 'cup', 'coffee', 'headphones', 'wireless', 'audio',
    'organic', 'cotton', 'sustainable', 'smartphone', 'charger', 'led',
    'desk', 'lamp', 'handcrafted', 'kitchenware'
  ]
  
  // Check for choice-related queries (referring to previously shown products)
  if (choiceKeywords.some(keyword => message.includes(keyword))) {
    return { type: 'general_info', query: message, subtype: 'product_choice' }
  }
  
  if (searchKeywords.some(keyword => message.includes(keyword))) {
    const category = categories.find(cat => message.includes(cat))
    // Extract key product terms instead of removing search keywords
    const productTerms = extractProductTerms(message)
    return { type: 'product_search', query: productTerms, category }
  }

  if (priceKeywords.some(keyword => message.includes(keyword))) {
    return { type: 'price_comparison', query: message }
  }

  if (orderKeywords.some(keyword => message.includes(keyword))) {
    return { type: 'order_help', query: message }
  }

  if (recommendationKeywords.some(keyword => message.includes(keyword))) {
    const category = categories.find(cat => message.includes(cat))
    return { type: 'recommendation', category }
  }

  return { type: 'general_info', query: message }
}

function extractProductTerms(message: string) {
  // Common product-related words that should be preserved in search
  const productWords = [
    'mug', 'mugs', 'cup', 'cups', 'ceramic', 'coffee', 'tea',
    'headphones', 'wireless', 'audio', 'electronics',
    'shirt', 'clothing', 'cotton', 'organic',
    'charger', 'smartphone', 'phone', 'stand',
    'lamp', 'led', 'desk', 'light', 'lighting',
    'handcrafted', 'artisan', 'handmade',
    'beans', 'food', 'kitchen', 'home'
  ]
  
  const words = message.toLowerCase().split(/\s+/)
  const relevantWords = words.filter(word => 
    productWords.includes(word) || 
    word.length > 3 // Include longer words that might be product names
  )
  
  return relevantWords.join(' ') || message
}

async function searchProducts(query: string, category?: string) {
  try {
    console.log('Searching for:', { query, category })
    
    const where: any = {
      inStock: true
    }

    if (query && query.trim()) {
      // Split query into individual words for better matching
      const queryWords = query.toLowerCase().trim().split(/\s+/)
      const searchConditions = []
      
      // Search each word in title, description, and tags
      for (const word of queryWords) {
        if (word.length > 2) { // Only search words with more than 2 characters
          searchConditions.push(
            { title: { contains: word } },
            { description: { contains: word } },
            { tags: { contains: word } }
          )
        }
      }
      
      // Also search the full query string
      searchConditions.push(
        { title: { contains: query } },
        { description: { contains: query } },
        { tags: { contains: query } }
      )
      
      if (searchConditions.length > 0) {
        where.OR = searchConditions
      }
    }

    if (category) {
      // Add category as an additional filter (AND condition)
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { 
            OR: [
              { tags: { contains: category } },
              { title: { contains: category } },
              { description: { contains: category } }
            ]
          }
        ]
        delete where.OR
      } else {
        where.OR = [
          { tags: { contains: category } },
          { title: { contains: category } },
          { description: { contains: category } }
        ]
      }
    }

    console.log('Search conditions:', JSON.stringify(where, null, 2))

    const products = await prisma.product.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 10, // Increased from 5 to get more results
      orderBy: { createdAt: 'desc' }
    })

    console.log('Found products:', products.length)
    products.forEach((p: any) => console.log('Product:', p.title, 'Tags:', p.tags))

    return products
  } catch (error) {
    console.error('Error searching products:', error)
    return []
  }
}

function formatProductSearchResponse(products: any[]) {
  if (products.length === 0) {
    return "I didn't find any products matching your search. But I can help you explore different types of products available on Kalakriti, or would you like to browse by specific materials or artists?"
  }

  // Parse tags for each product to show them properly
  const productList = products.map((p: any) => {
    let tags = []
    try {
      tags = typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags
    } catch (e) {
      tags = []
    }
    
    const stockInfo = p.stockQuantity > 0 ? `(${p.stockQuantity} in stock)` : '(Out of stock)'
    const tagList = tags.length > 0 ? ` | Tags: ${tags.slice(0, 3).join(', ')}` : ''
    
    return `• **${p.title}** - ₹${p.price.toLocaleString()} ${stockInfo}\n  ${p.tagline || p.description.substring(0, 80)}...${tagList}`
  }).join('\n\n')

  const message = products.length === 1 
    ? "I found this product for you:" 
    : `I found ${products.length} products for you:`

  return `${message}\n\n${productList}\n\nWould you like more details about any of these products, or shall I help you find something else?`
}

async function handlePriceComparison(query: string) {
  const prompt = `
User is asking about price comparison: "${query}"

Provide helpful advice about:
1. How to compare prices effectively
2. What factors to consider beyond price
3. Tips for finding the best value
4. When to wait for discounts vs buy now

Keep response conversational and helpful, under 150 words.
`

  try {
    const response = await generateText(prompt)
    return response
  } catch (error) {
    return "I can help you compare prices! When comparing products, consider the total value including quality, seller reputation, delivery costs, and return policies. Look for similar products from different sellers and check if there are seasonal discounts available."
  }
}

async function handleOrderHelp(user: any) {
  if (!user) {
    return "To help you with orders, please log in to your account. Once logged in, I can assist you with tracking orders, delivery updates, and resolving any issues."
  }

  try {
    const recentOrders = await prisma.order.findMany({
      where: { buyerId: user.id },
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          include: {
            product: {
              select: { title: true }
            }
          }
        }
      }
    })

    if (recentOrders.length === 0) {
      return "You don't have any recent orders. Browse our products and place your first order to get started!"
    }

    const orderSummary = recentOrders.map((order: any) => 
      `Order #${order.id.slice(-8)} - ${order.status} - ₹${order.totalAmount.toLocaleString()}`
    ).join('\n')

    return `Here are your recent orders:\n\n${orderSummary}\n\nNeed help with a specific order? Just let me know the order number!`
  } catch (error) {
    return "I'm having trouble accessing your order information right now. Please try again later or contact customer support."
  }
}

async function getRecommendations(user: any, category?: string) {
  try {
    const where: any = { inStock: true }
    
    if (category) {
      where.tags = { contains: category }
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 3,
      orderBy: { createdAt: 'desc' }
    })

    return products
  } catch (error) {
    console.error('Error getting recommendations:', error)
    return []
  }
}

function formatRecommendationResponse(products: any[]) {
  if (products.length === 0) {
    return "I don't have specific recommendations at the moment, but feel free to browse our product categories to discover great items!"
  }

  const productList = products.map((p: any) => 
    `• ${p.title} - ₹${p.price.toLocaleString()}`
  ).join('\n')

  return `Here are my top recommendations for you:\n\n${productList}\n\nThese products are popular and in stock. Would you like more details about any of them?`
}

async function handleGeneralQuery(message: string, context: any) {
  // Build conversation history for context
  let conversationContext = ""
  if (context?.conversationHistory && context.conversationHistory.length > 0) {
    conversationContext = "\n\nRecent conversation:\n" + 
      context.conversationHistory.map((msg: any) => {
        // Include product recommendations in context if they exist
        let msgText = `${msg.sender}: ${msg.text}`
        if (msg.productRecommendations && msg.productRecommendations.length > 0) {
          msgText += `\n[Products shown: ${msg.productRecommendations.map((p: any) => `${p.title} (₹${p.price})`).join(', ')}]`
        }
        return msgText
      }).join('\n')
  }

  const prompt = `
You are Kala, an AI assistant for Kalakriti marketplace. A user asked: "${message}"

Context about Kalakriti:
- Indian local marketplace connecting buyers and sellers
- Features: product search, shopping cart, delivery tracking, UPI payments
- Supports multiple languages via Bhashini API
- AI-powered recommendations
- Location-based delivery charges

${conversationContext}

Based on the conversation history above, provide a helpful, friendly response in under 150 words. Be conversational and refer to previously shown products if relevant. If the user is asking about products you just showed them, provide specific advice about those products.
`

  try {
    const response = await generateText(prompt)
    return response
  } catch (error) {
    return "I'm here to help you with Kalakriti! You can search for products, get recommendations, track orders, and much more. What would you like to explore today?"
  }
}
