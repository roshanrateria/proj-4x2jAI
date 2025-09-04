interface DeliveryInfo {
  distance: number;
  charge: number;
  duration: number;
  baseFare: number;
  distanceFare: number;
  breakdown: {
    baseFare: number;
    distanceFare: number;
    total: number;
  };
}

export async function calculateDeliveryCharge(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<DeliveryInfo> {
  try {
    const response = await fetch(
      `http://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`
    )
    
    const data = await response.json()
    
    if (data.routes && data.routes[0]) {
      const route = data.routes[0]
      const distanceKm = route.distance / 1000 // Convert meters to km
      const durationMinutes = route.duration / 60 // Convert seconds to minutes
      
      // Enhanced delivery charge calculation with transparency
      const baseFare = 15 // Base fare for any delivery (minimum charge)
      const perKmRate = 3 // Rate per kilometer
      const distanceFare = distanceKm * perKmRate
      const totalCharge = baseFare + distanceFare
      
      return {
        distance: Math.round(distanceKm * 100) / 100, // Round to 2 decimal places
        charge: Math.round(totalCharge),
        duration: Math.round(durationMinutes),
        baseFare: baseFare,
        distanceFare: Math.round(distanceFare),
        breakdown: {
          baseFare: baseFare,
          distanceFare: Math.round(distanceFare),
          total: Math.round(totalCharge)
        }
      }
    }
    
    throw new Error('No route found')
  } catch (error) {
    console.error('Error calculating delivery charge:', error)
    // Fallback calculation based on straight-line distance
    const straightLineDistance = haversineDistance(fromLat, fromLng, toLat, toLng)
    const baseFare = 15
    const estimatedDistanceFare = straightLineDistance * 3.5 // Slightly higher rate for fallback
    const estimatedCharge = baseFare + estimatedDistanceFare
    
    return {
      distance: straightLineDistance,
      charge: Math.round(estimatedCharge),
      duration: Math.round(straightLineDistance * 3), // Rough estimate: 3 minutes per km
      baseFare: baseFare,
      distanceFare: Math.round(estimatedDistanceFare),
      breakdown: {
        baseFare: baseFare,
        distanceFare: Math.round(estimatedDistanceFare),
        total: Math.round(estimatedCharge)
      }
    }
  }
}

export async function getDeliveryRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<{
  geometry: [number, number][];
  distance: number;
  duration: number;
  steps: string[];
}> {
  try {
    const response = await fetch(
      `http://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`
    )
    
    const data = await response.json()
    
    if (data.routes && data.routes[0]) {
      const route = data.routes[0]
      const geometry = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]) // Swap to [lat, lng]
      const distanceKm = route.distance / 1000
      const durationMinutes = route.duration / 60
      
      // Extract turn-by-turn directions
      const steps = route.legs[0]?.steps?.map((step: any) => step.maneuver.instruction || '') || []
      
      return {
        geometry,
        distance: Math.round(distanceKm * 100) / 100,
        duration: Math.round(durationMinutes),
        steps
      }
    }
    
    throw new Error('No route found')
  } catch (error) {
    console.error('Error getting delivery route:', error)
    // Return simple straight line as fallback
    return {
      geometry: [[fromLat, fromLng], [toLat, toLng]],
      distance: haversineDistance(fromLat, fromLng, toLat, toLng),
      duration: Math.round(haversineDistance(fromLat, fromLng, toLat, toLng) * 3),
      steps: ['Direct route (no detailed directions available)']
    }
  }
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export async function getLocationFromCoordinates(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    )
    const data = await response.json()
    return data.display_name || `${lat}, ${lng}`
  } catch (error) {
    console.error('Error getting location:', error)
    return `${lat}, ${lng}`
  }
}
