import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, phone, address, latitude, longitude, upiId } = body

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Location is now required for all users (buyers and sellers)
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Location is required for all users' },
        { status: 400 }
      )
    }

    // Validate seller requirements
    if (role === 'SELLER' && !upiId) {
      return NextResponse.json(
        { error: 'Sellers must provide UPI ID' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        phone,
        address,
        latitude,
        longitude,
        upiId: role === 'SELLER' ? upiId : null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        latitude: true,
        longitude: true,
        upiId: true
      }
    })

    // Generate token
    const token = generateToken(user.id)

    return NextResponse.json({
      user,
      token
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
