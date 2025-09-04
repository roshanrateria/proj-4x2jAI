import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

export const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

export async function generateContent(prompt: string) {
  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Error generating content:', error)
    throw error
  }
}

// Alias for backward compatibility
export const generateText = generateContent

export async function generateProductSuggestions(productData: {
  price: number
  description: string
  images?: string[]
}) {
  const prompt = `
You are an expert e-commerce product optimizer. Based on the following product information, generate:
1. A catchy tagline (max 60 characters)
2. 5 relevant tags for searchability
3. An enhanced product description (150-200 words)

Product Info:
- Price: ₹${productData.price}
- Current Description: ${productData.description}

Please respond in this exact JSON format:
{
  "tagline": "your catchy tagline here",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "description": "enhanced description here"
}
`

  try {
    const response = await generateContent(prompt)
    return JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, ''))
  } catch (error) {
    console.error('Error generating product suggestions:', error)
    return {
      tagline: 'Amazing Product at Great Price',
      tags: ['quality', 'affordable', 'trending', 'popular', 'new'],
      description: productData.description
    }
  }
}

export async function generateRecommendations(userProfile: {
  previousOrders: string[]
  preferences: string[]
  location: string
}) {
  const prompt = `
Based on the user profile below, suggest 5 product categories they might be interested in:

Previous Orders: ${userProfile.previousOrders.join(', ')}
Preferences: ${userProfile.preferences.join(', ')}
Location: ${userProfile.location}

Respond with only a JSON array of category names:
["category1", "category2", "category3", "category4", "category5"]
`

  try {
    const response = await generateContent(prompt)
    return JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, ''))
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return ['electronics', 'clothing', 'home-decor', 'books', 'sports']
  }
}
