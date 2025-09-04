import { NextRequest, NextResponse } from 'next/server'
import { calculateDeliveryCharge } from '@/lib/osrm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromLat, fromLng, toLat, toLng } = body

    if (!fromLat || !fromLng || !toLat || !toLng) {
      return NextResponse.json(
        { error: 'All coordinates are required' },
        { status: 400 }
      )
    }

    const deliveryInfo = await calculateDeliveryCharge(
      parseFloat(fromLat),
      parseFloat(fromLng),
      parseFloat(toLat),
      parseFloat(toLng)
    )

    return NextResponse.json(deliveryInfo)
  } catch (error) {
    console.error('Error calculating delivery:', error)
    return NextResponse.json(
      { error: 'Failed to calculate delivery charge' },
      { status: 500 }
    )
  }
}
