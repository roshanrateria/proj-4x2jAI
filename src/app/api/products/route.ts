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
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const inStock = searchParams.get('inStock')
    
    // Artisan-specific filters
    const material = searchParams.get('material') || ''
    const technique = searchParams.get('technique') || ''
    const artForm = searchParams.get('artForm') || ''
    const origin = searchParams.get('origin') || ''
    
    // Sorting
    const sortBy = searchParams.get('sortBy') || 'newest'

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tagline: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search } },
        { material: { contains: search, mode: 'insensitive' } },
        { technique: { contains: search, mode: 'insensitive' } },
        { artForm: { contains: search, mode: 'insensitive' } },
        { origin: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (category) {
      // Parse tags JSON and check if it includes the category
      where.tags = { contains: category }
    }

    // Artisan-specific filters
    if (material) {
      where.material = { contains: material, mode: 'insensitive' }
    }
    
    if (technique) {
      where.technique = { contains: technique, mode: 'insensitive' }
    }
    
    if (artForm) {
      where.artForm = { contains: artForm, mode: 'insensitive' }
    }
    
    if (origin) {
      where.origin = { contains: origin, mode: 'insensitive' }
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    if (inStock !== null) {
      where.inStock = inStock === 'true'
    }

    // Determine order by based on sortBy parameter
    let orderBy: any = { createdAt: 'desc' } // default
    
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      case 'price-low':
        orderBy = { price: 'asc' }
        break
      case 'price-high':
        orderBy = { price: 'desc' }
        break
      case 'featured':
        orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }]
        break
      case 'discount':
        orderBy = [{ discountPercent: 'desc' }, { createdAt: 'desc' }]
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    const products = await prisma.product.findMany({
      where,
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
      },
      skip,
      take: limit,
      orderBy
    })

    const total = await prisma.product.count({ where })

    // Parse JSON fields for response
    const parsedProducts = products.map(parseProductFields)

    return NextResponse.json({
      products: parsedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
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
    if (!user || user.role !== 'SELLER') {
      return NextResponse.json(
        { error: 'Seller access required' },
        { status: 403 }
      )
    }    const body = await request.json()
    const { 
      title, description, tagline, tags, price, images, inStock, stockQuantity,
      // Artisan-specific fields
      material, technique, artForm, origin,
      length, width, height, weight,
      artisanStory, culturalSignificance, timeToCreate, isCustomizable,
      careInstructions, authenticityMark,
      // Discount fields
      originalPrice, discountPercent, discountAmount,
      discountStart, discountEnd, isFeatured
    } = body

    if (!title || !description || !price) {
      return NextResponse.json(
        { error: 'Title, description, and price are required' },
        { status: 400 }
      )
    }    const quantity = parseInt(stockQuantity) || 0
    const isInStock = inStock !== false && quantity > 0

    const product = await prisma.product.create({
      data: {
        title,
        description,
        tagline,
        tags: JSON.stringify(tags || []),
        price: parseFloat(price),
        images: JSON.stringify(images || []),
        inStock: isInStock,
        stockQuantity: quantity,
        sellerId: user.id,
        // Artisan-specific fields
        material: material || null,
        technique: technique || null,
        artForm: artForm || null,
        origin: origin || null,
        length: length && length !== '' ? parseFloat(length) : null,
        width: width && width !== '' ? parseFloat(width) : null,
        height: height && height !== '' ? parseFloat(height) : null,
        weight: weight && weight !== '' ? parseFloat(weight) : null,
        artisanStory: artisanStory || null,
        culturalSignificance: culturalSignificance || null,
        timeToCreate: timeToCreate && timeToCreate !== '' ? parseInt(timeToCreate) : null,
        isCustomizable: isCustomizable || false,
        careInstructions: careInstructions || null,
        authenticityMark: authenticityMark || null,
        // Discount fields - handle empty strings properly
        originalPrice: originalPrice && originalPrice !== '' ? parseFloat(originalPrice) : null,
        discountPercent: discountPercent && discountPercent !== '' ? parseFloat(discountPercent) : null,
        discountAmount: discountAmount && discountAmount !== '' ? parseFloat(discountAmount) : null,
        discountStart: discountStart && discountStart.trim() !== '' ? new Date(discountStart) : null,
        discountEnd: discountEnd && discountEnd.trim() !== '' ? new Date(discountEnd) : null,
        isFeatured: isFeatured || false
      } as any,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    })

    return NextResponse.json(parseProductFields(product))
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
