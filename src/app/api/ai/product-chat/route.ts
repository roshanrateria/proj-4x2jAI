import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini'
import { getUserFromToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, product, context } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product information is required' },
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

    // Create a comprehensive product information string
    const productInfo = createProductInfoString(product)
    
    // Create conversation history context
    const conversationContext = context?.conversationHistory 
      ? context.conversationHistory.map((msg: any) => 
          `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
        ).join('\n')
      : ''    // Generate AI response with carefully crafted prompt
    const prompt = `You are Kala, an AI assistant for an Indian handicraft marketplace called Kalakriti. You are helping a customer understand a specific product. 

CRITICAL RULES - FOLLOW STRICTLY:
1. ONLY answer questions about the specific product provided below
2. If ANY information is NOT mentioned in the product details, you MUST respond with: "This information is not mentioned in the product details. Please contact the seller for more information."
3. NEVER make assumptions or guesses about product features
4. NEVER provide general information about similar products
5. NEVER invent specifications, materials, or details not explicitly stated
6. If asked about shipping, returns, warranty, or store policies, say: "Please contact the seller directly for information about shipping, returns, and policies."
7. Be helpful and friendly, but ONLY use the exact information provided
8. If a user asks about something that could exist but isn't mentioned, clearly state it's not specified

RESPONSE FORMAT:
- Be conversational and helpful
- Use Indian Rupees (₹) for pricing
- If information exists, explain it clearly
- If information doesn't exist, clearly state "This information is not mentioned in the product details"

PRODUCT INFORMATION:
${productInfo}

CONVERSATION HISTORY:
${conversationContext}

USER QUESTION: ${message}

Remember: Be helpful with available information, but NEVER invent details. If it's not in the product information above, clearly state that it's not mentioned.`

    const response = await generateText(prompt)

    return NextResponse.json({ 
      response: response || "I apologize, but I couldn't process your question right now. Please try again.",
    })
  } catch (error) {
    console.error('Error in product AI chat:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

function createProductInfoString(product: any): string {
  const info = []
  
  // Basic Information
  info.push(`Product Title: ${product.title}`)
  if (product.tagline) info.push(`Tagline: ${product.tagline}`)
  info.push(`Description: ${product.description}`)
  info.push(`Price: ₹${product.price.toLocaleString()}`)
  info.push(`Stock Status: ${product.inStock ? 'In Stock' : 'Out of Stock'}`)
  if (product.stockQuantity) info.push(`Available Quantity: ${product.stockQuantity}`)
  
  // Tags
  if (product.tags && product.tags.length > 0) {
    info.push(`Tags: ${product.tags.join(', ')}`)
  }
  
  // Artisan/Craft Information
  if (product.material) info.push(`Material: ${product.material}`)
  if (product.technique) info.push(`Technique: ${product.technique}`)
  if (product.artForm) info.push(`Art Form: ${product.artForm}`)
  if (product.origin) info.push(`Origin: ${product.origin}`)
  
  // Dimensions
  const dimensions = []
  if (product.length) dimensions.push(`Length: ${product.length} cm`)
  if (product.width) dimensions.push(`Width: ${product.width} cm`)
  if (product.height) dimensions.push(`Height: ${product.height} cm`)
  if (product.weight) dimensions.push(`Weight: ${product.weight} g`)
  if (dimensions.length > 0) {
    info.push(`Dimensions: ${dimensions.join(', ')}`)
  }
  
  // Artisan Story & Cultural Information
  if (product.artisanStory) info.push(`Artisan Story: ${product.artisanStory}`)
  if (product.culturalSignificance) info.push(`Cultural Significance: ${product.culturalSignificance}`)
  if (product.timeToCreate) info.push(`Time to Create: ${product.timeToCreate} days`)
  
  // Customization & Authentication
  if (product.isCustomizable) info.push(`Customizable: Yes`)
  if (product.authenticityMark) info.push(`Authenticity Mark: ${product.authenticityMark}`)
  
  // Care Instructions
  if (product.careInstructions) info.push(`Care Instructions: ${product.careInstructions}`)
  
  // Seller Information
  if (product.seller) {
    info.push(`Seller: ${product.seller.name}`)
    if (product.seller.address) info.push(`Seller Location: ${product.seller.address}`)
  }
  
  // Discount Information (if applicable)
  if (product.originalPrice && product.originalPrice > product.price) {
    const savings = product.originalPrice - product.price
    const discountPercent = Math.round((savings / product.originalPrice) * 100)
    info.push(`Original Price: ₹${product.originalPrice.toLocaleString()}`)
    info.push(`Discount: ${discountPercent}% OFF (Save ₹${savings.toLocaleString()})`)
  }
  
  return info.join('\n')
}
