import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      description, 
      tagline, 
      price, 
      currentTags, 
      images, 
      hasImages, 
      imageCount 
    } = body

    if (!title && !description) {
      return NextResponse.json(
        { error: 'Please provide at least a title or description for AI suggestions' },
        { status: 400 }
      )
    }

    // Create a comprehensive prompt that considers all aspects
    const prompt = `
You are an expert e-commerce consultant helping a seller optimize their product listing. Analyze the following product information and provide intelligent suggestions to improve sales and discoverability.

CURRENT PRODUCT INFORMATION:
- Title: ${title || 'Not provided'}
- Description: ${description || 'Not provided'}
- Current Tagline: ${tagline || 'Not provided'}
- Price: ${price ? `₹${price}` : 'Not set'}
- Current Tags: ${currentTags?.length ? currentTags.join(', ') : 'None'}
- Images: ${hasImages ? `${imageCount} image(s) uploaded` : 'No images uploaded'}

ANALYSIS REQUIREMENTS:
1. Evaluate the current title - is it compelling and searchable?
2. Assess the description - is it detailed and persuasive?
3. Create a catchy tagline if missing or improve existing one
4. Suggest relevant search tags that buyers would use
5. Analyze the price positioning for the Indian market
6. Consider the image situation in recommendations

Please provide suggestions in this exact JSON format:
{
  "suggestions": {
    "title": {
      "current": "current title or null",
      "suggested": "improved title suggestion or null if current is good",
      "reason": "explanation of why this title is better"
    },
    "description": {
      "current": "current description or null",
      "suggested": "enhanced description with better details",
      "reason": "explanation of improvements made"
    },
    "tagline": {
      "current": "current tagline or null",
      "suggested": "catchy tagline (max 60 characters)",
      "reason": "why this tagline works"
    },
    "tags": {
      "current": ["existing", "tags"],
      "suggested": ["tag1", "tag2", "tag3", "tag4", "tag5"],
      "reason": "why these tags improve searchability"
    },
    "pricing": {
      "analysis": "pricing analysis for Indian market",
      "suggestedRange": {"min": 1000, "max": 2000},
      "reason": "market positioning rationale"
    },
    "images": {
      "status": "analysis of current image situation",
      "recommendations": "specific advice about images needed"
    },
    "overall": {
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"],
      "marketingTips": ["tip1", "tip2"]
    }
  }
}

GUIDELINES:
- Only suggest title changes if current one needs significant improvement
- Make descriptions detailed but scannable (150-250 words)
- Taglines should be memorable and under 60 characters
- Tags should include both broad and specific terms
- Consider Indian market preferences and pricing
- Provide actionable advice for images
- Focus on improving conversion and discoverability
`

    const response = await generateContent(prompt)
    
    try {
      // Extract and parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response')
      }
      
      const aiResponse = JSON.parse(jsonMatch[0])
      
      // Extract actionable suggestions for the frontend
      const suggestions = aiResponse.suggestions
      const actionableSuggestions: any = {}
      
      // Only include suggestions that are different from current values
      if (suggestions.title?.suggested && suggestions.title.suggested !== title) {
        actionableSuggestions.title = {
          value: suggestions.title.suggested,
          reason: suggestions.title.reason
        }
      }
      
      if (suggestions.description?.suggested && suggestions.description.suggested !== description) {
        actionableSuggestions.description = {
          value: suggestions.description.suggested,
          reason: suggestions.description.reason
        }
      }
      
      if (suggestions.tagline?.suggested) {
        actionableSuggestions.tagline = {
          value: suggestions.tagline.suggested,
          reason: suggestions.tagline.reason
        }
      }
      
      if (suggestions.tags?.suggested?.length) {
        // Filter out existing tags
        const newTags = suggestions.tags.suggested.filter((tag: string) => 
          !currentTags?.includes(tag)
        ).slice(0, 5)
        
        if (newTags.length > 0) {
          actionableSuggestions.tags = {
            value: newTags,
            reason: suggestions.tags.reason
          }
        }
      }
      
      if (suggestions.pricing?.suggestedRange) {
        actionableSuggestions.priceRange = {
          value: suggestions.pricing.suggestedRange,
          analysis: suggestions.pricing.analysis,
          reason: suggestions.pricing.reason
        }
      }
      
      // Include analysis and tips
      actionableSuggestions.analysis = {
        images: suggestions.images,
        overall: suggestions.overall
      }

      return NextResponse.json(actionableSuggestions)
      
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, response)
      
      // Fallback suggestions based on available data
      const fallbackSuggestions: any = {}
      
      if (!title || title.length < 10) {
        fallbackSuggestions.title = {
          value: description ? `${description.split(' ').slice(0, 6).join(' ')} - Quality Product` : 'Premium Quality Product',
          reason: 'Generated from description to improve searchability'
        }
      }
      
      if (!tagline) {
        fallbackSuggestions.tagline = {
          value: 'Amazing Quality at Great Price',
          reason: 'Generic tagline to attract customers'
        }
      }
      
      if (!description || description.length < 50) {
        fallbackSuggestions.description = {
          value: title ? `${title} - High-quality product with excellent features. Perfect for daily use with great durability and value for money. Ideal choice for customers looking for reliable and affordable products.` : 'High-quality product with excellent features and great value for money.',
          reason: 'Enhanced description to provide more details'
        }
      }
      
      // Basic tag suggestions
      const basicTags = ['quality', 'affordable', 'trending', 'popular', 'new']
      const newBasicTags = basicTags.filter(tag => !currentTags?.includes(tag))
      
      if (newBasicTags.length > 0) {
        fallbackSuggestions.tags = {
          value: newBasicTags.slice(0, 3),
          reason: 'Basic tags to improve discoverability'
        }
      }
      
      if (price) {
        fallbackSuggestions.priceRange = {
          value: {
            min: Math.max(price * 0.8, 50),
            max: price * 1.2
          },
          analysis: 'Competitive pricing range for the Indian market',
          reason: 'Based on current price with market adjustments'
        }
      }
      
      fallbackSuggestions.analysis = {
        images: {
          status: hasImages ? `${imageCount} images uploaded` : 'No images uploaded',
          recommendations: hasImages ? 'Good! Images help increase sales. Consider adding lifestyle photos.' : 'Add high-quality product images - they significantly increase sales conversion.'
        },
        overall: {
          strengths: title ? ['Has product title'] : [],
          improvements: [
            ...(!hasImages ? ['Add product images'] : []),
            ...(!title ? ['Add compelling title'] : []),
            ...(!description || description.length < 50 ? ['Enhance product description'] : [])
          ],
          marketingTips: [
            'Use keywords that customers search for',
            'Highlight unique selling points',
            'Include size/dimension details'
          ]
        }
      }

      return NextResponse.json(fallbackSuggestions)
    }
  } catch (error) {
    console.error('Error generating product suggestions:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate suggestions',
        message: 'Please try again or check your input data'
      },
      { status: 500 }
    )
  }
}
