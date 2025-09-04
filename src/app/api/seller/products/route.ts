import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

// Helper function to parse JSON strings to arrays
function parseProductFields(product: any) {
  return {
    ...product,
    tags: JSON.parse(product.tags || '[]'),
    images: JSON.parse(product.images || '[]')
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await getUserFromToken(token)
    if (!user || user.role !== 'SELLER') {
      return NextResponse.json(
        { error: 'Seller access required' },
        { status: 403 }
      )
    }    const products = await prisma.product.findMany({
      where: { sellerId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    // Parse JSON fields for response
    const parsedProducts = products.map(parseProductFields)

    return NextResponse.json({ products: parsedProducts })
  } catch (error) {
    console.error('Error fetching seller products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
