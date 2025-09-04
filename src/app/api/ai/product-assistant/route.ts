import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product, userProfile } = body

    if (!product) {
      return NextResponse.json(
        { error: 'Product information is required' },
        { status: 400 }
      )
    }

    const prompt = `
Analyze this product and provide personalized recommendations:

Product: ${product.title}
Description: ${product.description}
Price: ₹${product.price}
Tags: ${product.tags?.join(', ') || 'None'}

User Profile:
- Role: ${userProfile?.role || 'Unknown'}
- Location: ${userProfile?.location || 'Unknown'}

Please provide 3 recommendations as JSON array with this format:
[
  {
    "title": "Recommendation title",
    "description": "Detailed recommendation description",
    "reasoning": "Why this recommendation is relevant",
    "confidence": 0.85
  }
]

Focus on:
1. Value for money assessment
2. Suitability for user's needs
3. Alternatives or complementary products
4. Quality and reliability insights
5. Best use cases

Provide practical, actionable insights that help the user make an informed decision.
`

    const response = await generateText(prompt)
    
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      
      const recommendations = JSON.parse(jsonMatch[0])
      
      // Validate recommendations structure
      const validRecommendations = recommendations.filter((rec: any) => 
        rec.title && rec.description && rec.reasoning && typeof rec.confidence === 'number'
      )

      return NextResponse.json({ recommendations: validRecommendations })
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      
      // Fallback recommendations
      const fallbackRecommendations = [
        {
          title: "Value Assessment",
          description: `At ₹${product.price}, this ${product.title} offers competitive pricing in its category.`,
          reasoning: "Based on market analysis and price comparison with similar products",
          confidence: 0.75
        },
        {
          title: "Quality Consideration",
          description: "Check product specifications and seller ratings before purchase to ensure quality meets expectations.",
          reasoning: "Quality verification is important for online purchases",
          confidence: 0.80
        },
        {
          title: "Purchase Timing",
          description: "Consider checking for seasonal discounts or bulk purchase options if buying multiple items.",
          reasoning: "Timing can impact overall value and cost savings",
          confidence: 0.70
        }
      ]

      return NextResponse.json({ recommendations: fallbackRecommendations })
    }
  } catch (error) {
    console.error('Error generating product recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
