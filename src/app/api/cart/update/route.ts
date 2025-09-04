import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function PUT(request: NextRequest) {
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
    }    const body = await request.json()
    const { cartItemId, quantity } = body

    if (!cartItemId || !quantity) {
      return NextResponse.json(
        { error: 'Cart item ID and quantity are required' },
        { status: 400 }
      )
    }

    // Get cart item with product info to check stock
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        userId: user.id
      },
      include: {
        product: true
      }
    })

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    // Check stock availability
    const newQuantity = parseInt(quantity)
    if (cartItem.product.stockQuantity < newQuantity) {
      return NextResponse.json(
        { error: `Only ${cartItem.product.stockQuantity} items available in stock` },
        { status: 400 }
      )
    }

    const updatedCartItem = await prisma.cartItem.update({
      where: {
        id: cartItemId,
        userId: user.id // Ensure user can only update their own items
      },
      data: { quantity: parseInt(quantity) },
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
  } catch (error) {
    console.error('Error updating cart item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
