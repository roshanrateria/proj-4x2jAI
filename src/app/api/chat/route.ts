import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// GET - Get all chats for a user (buyer or seller)
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { buyerId: decoded.userId },
          { sellerId: decoded.userId }
        ],
        isActive: true
      },
      include: {
        buyer: {
          select: { id: true, name: true, email: true }
        },
        seller: {
          select: { id: true, name: true, email: true }
        },
        product: {
          select: { id: true, title: true, images: true, price: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Transform to include last message and unread count
    const transformedChats = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await prisma.message.count({
          where: {
            chatId: chat.id,
            senderId: { not: decoded.userId },
            isRead: false
          }
        })

        return {
          ...chat,
          lastMessage: chat.messages[0] || null,
          unreadCount
        }
      })
    )

    return NextResponse.json({ chats: transformedChats })
  } catch (error) {
    console.error('Error fetching chats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new chat
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Get product details to find seller
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: true }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if user is the seller (sellers can't chat with themselves)
    if (product.sellerId === decoded.userId) {
      return NextResponse.json({ error: 'Sellers cannot chat about their own products' }, { status: 400 })
    }

    // Check if chat already exists
    const existingChat = await prisma.chat.findUnique({
      where: {
        buyerId_sellerId_productId: {
          buyerId: decoded.userId,
          sellerId: product.sellerId,
          productId: productId
        }
      }
    })

    if (existingChat) {
      return NextResponse.json({ chatId: existingChat.id })
    }

    // Create new chat
    const chat = await prisma.chat.create({
      data: {
        buyerId: decoded.userId,
        sellerId: product.sellerId,
        productId: productId
      },
      include: {
        buyer: {
          select: { id: true, name: true, email: true }
        },
        seller: {
          select: { id: true, name: true, email: true }
        },
        product: {
          select: { id: true, title: true, images: true, price: true }
        }
      }
    })

    // Create welcome message
    await prisma.message.create({
      data: {
        chatId: chat.id,
        senderId: decoded.userId,
        content: `Hi! I'm interested in "${product.title}". Could you please provide more details?`,
        messageType: 'SYSTEM'
      }
    })

    return NextResponse.json({ chatId: chat.id, chat })
  } catch (error) {
    console.error('Error creating chat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
