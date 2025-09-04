import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

// Helper function to parse JSON strings to arrays
function parseProductFields(product: any) {
  return {
    ...product,
    tags: typeof product.tags === 'string' ? JSON.parse(product.tags) : product.tags,
    images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images
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
    if (!user || user.role !== 'BUYER') {
      return NextResponse.json(
        { error: 'Buyer access required' },
        { status: 403 }
      )
    }

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                address: true,
                latitude: true,
                longitude: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Parse JSON fields for response
    const parsedWishlistItems = wishlistItems.map(item => ({
      ...item,
      product: parseProductFields(item.product)
    }))

    return NextResponse.json({ wishlistItems: parsedWishlistItems })
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await getUserFromToken(token)
    if (!user || user.role !== 'BUYER') {
      return NextResponse.json(
        { error: 'Buyer access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { productId } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if item already exists in wishlist
    const existingWishlistItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: productId
        }
      }
    })

    if (existingWishlistItem) {
      return NextResponse.json(
        { error: 'Product already in wishlist' },
        { status: 400 }
      )
    }

    // Create new wishlist item
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId: user.id,
        productId: productId
      },
      include: {
        product: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                address: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      ...wishlistItem,
      product: parseProductFields(wishlistItem.product)
    })
  } catch (error) {
    console.error('Error adding to wishlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await getUserFromToken(token)
    if (!user || user.role !== 'BUYER') {
      return NextResponse.json(
        { error: 'Buyer access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    await prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId: user.id,
          productId: productId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing from wishlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
