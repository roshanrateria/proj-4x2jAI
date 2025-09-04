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

// Helper function to parse order data
function parseOrderData(order: any) {
  return {
    ...order,
    orderItems: order.orderItems.map((item: any) => ({
      ...item,
      product: parseProductFields(item.product)
    }))
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
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const orders = await prisma.order.findMany({
      where: user.role === 'BUYER' ? { buyerId: user.id } : { sellerId: user.id },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                images: true
              }
            }
          }
        }
      },      orderBy: { createdAt: 'desc' }
    })

    // Parse JSON fields in product data
    const parsedOrders = orders.map(parseOrderData)

    return NextResponse.json({ orders: parsedOrders })
  } catch (error) {
    console.error('Error fetching orders:', error)
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
    const { cartItems, deliveryAddress, deliveryCharges } = body

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      )
    }

    if (!deliveryAddress) {
      return NextResponse.json(
        { error: 'Delivery address is required' },
        { status: 400 }
      )
    }

    // Group cart items by seller
    const sellerGroups = cartItems.reduce((groups: any, item: any) => {
      const sellerId = item.product.seller.id
      if (!groups[sellerId]) {
        groups[sellerId] = {
          seller: item.product.seller,
          items: [],
          subtotal: 0
        }
      }
      groups[sellerId].items.push(item)
      groups[sellerId].subtotal += item.product.price * item.quantity
      return groups
    }, {})

    // Create orders for each seller
    const createdOrders = []
    
    for (const [sellerId, group] of Object.entries(sellerGroups) as [string, any][]) {
      const deliveryCharge = deliveryCharges[sellerId]?.charge || 0
      const totalAmount = group.subtotal + deliveryCharge
      
      const order = await prisma.order.create({
        data: {
          buyerId: user.id,
          sellerId: sellerId,
          totalAmount,
          deliveryCharge,
          deliveryAddress,
          deliveryLatitude: user.latitude || 0,
          deliveryLongitude: user.longitude || 0,
          orderItems: {
            create: group.items.map((item: any) => ({
              productId: item.product.id,
              quantity: item.quantity,
              price: item.product.price
            }))
          }
        },
        include: {
          orderItems: {
            include: {
              product: true
            }
          }
        }
      })
        createdOrders.push(order)
    }

    // Reduce stock quantities for ordered items
    for (const [sellerId, group] of Object.entries(sellerGroups) as [string, any][]) {
      for (const item of group.items) {
        await prisma.product.update({
          where: { id: item.product.id },
          data: {
            stockQuantity: {
              decrement: item.quantity
            }
          }
        })
        
        // Check if product is now out of stock and update inStock status
        const updatedProduct = await prisma.product.findUnique({
          where: { id: item.product.id },
          select: { stockQuantity: true }
        })
        
        if (updatedProduct && updatedProduct.stockQuantity <= 0) {
          await prisma.product.update({
            where: { id: item.product.id },
            data: { inStock: false }
          })
        }
      }
    }

    // Clear cart after successful order creation
    await prisma.cartItem.deleteMany({
      where: {
        userId: user.id,
        id: {
          in: cartItems.map((item: any) => item.id)
        }
      }
    })

    return NextResponse.json({ orders: createdOrders })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
