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
    if (!user || user.role !== 'BUYER') {
      return NextResponse.json(
        { error: 'Buyer access required' },
        { status: 403 }
      )
    }    const cartItems = await prisma.cartItem.findMany({
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
      }
    })

    // Parse product fields (convert JSON strings to arrays)
    const parsedCartItems = cartItems.map(item => ({
      ...item,
      product: parseProductFields(item.product)
    }))

    return NextResponse.json({ cartItems: parsedCartItems })
  } catch (error) {
    console.error('Error fetching cart:', error)
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
    const { productId, quantity } = body

    if (!productId || !quantity) {
      return NextResponse.json(
        { error: 'Product ID and quantity are required' },
        { status: 400 }
      )
    }

    // Check if product exists and is in stock
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }    if (!product.inStock) {
      return NextResponse.json(
        { error: 'Product is out of stock' },
        { status: 400 }
      )
    }

    // Check stock quantity availability
    if (product.stockQuantity < quantity) {
      return NextResponse.json(
        { error: `Only ${product.stockQuantity} items available in stock` },
        { status: 400 }
      )
    }

    // Check if item already exists in cart
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: productId
        }      }
    })

    if (existingCartItem) {
      // Check if new total quantity exceeds stock
      const newQuantity = existingCartItem.quantity + quantity
      if (product.stockQuantity < newQuantity) {
        return NextResponse.json(
          { error: `Only ${product.stockQuantity} items available in stock. You already have ${existingCartItem.quantity} in cart.` },
          { status: 400 }
        )
      }
      
      // Update quantity
      const updatedCartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + quantity },
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
      return NextResponse.json(updatedCartItem)
    } else {
      // Create new cart item
      const cartItem = await prisma.cartItem.create({
        data: {
          userId: user.id,
          productId: productId,
          quantity: quantity
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
      return NextResponse.json(cartItem)
    }
  } catch (error) {
    console.error('Error adding to cart:', error)
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
    const cartItemId = searchParams.get('id')

    if (!cartItemId) {
      return NextResponse.json(
        { error: 'Cart item ID is required' },
        { status: 400 }
      )
    }

    await prisma.cartItem.delete({
      where: {
        id: cartItemId,
        userId: user.id // Ensure user can only delete their own items
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing from cart:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
