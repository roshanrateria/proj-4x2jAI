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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    }

    const { id: productId } = await params

    // Verify product belongs to the seller
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: user.id
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(parseProductFields(product))
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }    const user = await getUserFromToken(token)
    if (!user || user.role !== 'SELLER') {
      return NextResponse.json(
        { error: 'Seller access required' },
        { status: 403 }
      )
    }

    const { id: productId } = await params
    const body = await request.json()
      // Convert arrays to JSON strings for storage
    const updateData = { ...body }
    if (updateData.tags) {
      updateData.tags = JSON.stringify(updateData.tags)
    }
    if (updateData.images) {
      updateData.images = JSON.stringify(updateData.images)
    }
      // Handle date fields - convert empty strings to null
    if (updateData.discountStart !== undefined) {
      updateData.discountStart = updateData.discountStart && updateData.discountStart.trim() !== '' 
        ? new Date(updateData.discountStart) 
        : null
    }
    if (updateData.discountEnd !== undefined) {
      updateData.discountEnd = updateData.discountEnd && updateData.discountEnd.trim() !== '' 
        ? new Date(updateData.discountEnd) 
        : null
    }
    
    // Handle numeric fields - convert empty strings to null
    if (updateData.originalPrice !== undefined) {
      updateData.originalPrice = updateData.originalPrice && updateData.originalPrice !== '' 
        ? parseFloat(updateData.originalPrice) 
        : null
    }
    if (updateData.discountPercent !== undefined) {
      updateData.discountPercent = updateData.discountPercent && updateData.discountPercent !== '' 
        ? parseFloat(updateData.discountPercent) 
        : null
    }
    if (updateData.discountAmount !== undefined) {
      updateData.discountAmount = updateData.discountAmount && updateData.discountAmount !== '' 
        ? parseFloat(updateData.discountAmount) 
        : null
    }
    
    // Handle other numeric artisan fields
    if (updateData.length !== undefined) {
      updateData.length = updateData.length && updateData.length !== '' 
        ? parseFloat(updateData.length) 
        : null
    }
    if (updateData.width !== undefined) {
      updateData.width = updateData.width && updateData.width !== '' 
        ? parseFloat(updateData.width) 
        : null
    }
    if (updateData.height !== undefined) {
      updateData.height = updateData.height && updateData.height !== '' 
        ? parseFloat(updateData.height) 
        : null
    }
    if (updateData.weight !== undefined) {
      updateData.weight = updateData.weight && updateData.weight !== '' 
        ? parseFloat(updateData.weight) 
        : null
    }
    if (updateData.timeToCreate !== undefined) {
      updateData.timeToCreate = updateData.timeToCreate && updateData.timeToCreate !== '' 
        ? parseInt(updateData.timeToCreate) 
        : null
    }
    
    // Handle stock quantity and inStock status
    if (updateData.stockQuantity !== undefined) {
      const quantity = parseInt(updateData.stockQuantity) || 0
      updateData.stockQuantity = quantity
      // Auto-update inStock based on quantity
      if (quantity <= 0) {
        updateData.inStock = false
      } else if (updateData.inStock === undefined) {
        updateData.inStock = true
      }
    }

    // Verify product belongs to the seller
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: user.id
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData
    })

    return NextResponse.json(parseProductFields(updatedProduct))
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }    const user = await getUserFromToken(token)
    if (!user || user.role !== 'SELLER') {
      return NextResponse.json(
        { error: 'Seller access required' },
        { status: 403 }
      )
    }

    const { id: productId } = await params

    // Verify product belongs to the seller
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: user.id
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    await prisma.product.delete({
      where: { id: productId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
