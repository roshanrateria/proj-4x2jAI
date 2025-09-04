'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import { Navigation, MapPin, Clock, Route, Truck, RefreshCw, Target } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Fix for default markers
import L from 'leaflet'
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface LiveNavigationProps {
  sellerLocation: { lat: number; lng: number; name: string; address: string }
  onNavigationStart?: () => void
  onNavigationEnd?: () => void
}

interface RouteInfo {
  geometry: [number, number][]
  distance: number
  duration: number
  steps: Array<{
    instruction: string
    distance: number
    duration: number
  }>
}

// Component to handle live location updates
function LiveLocationTracker({ 
  onLocationUpdate, 
  isTracking 
}: { 
  onLocationUpdate: (lat: number, lng: number, accuracy: number) => void
  isTracking: boolean 
}) {
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isTracking || !navigator.geolocation) return

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000 // Update every 5 seconds
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords
      console.log('📍 Live location update:', { latitude, longitude, accuracy })
      onLocationUpdate(latitude, longitude, accuracy)
    }

    const handleError = (error: GeolocationPositionError) => {
      console.error('❌ Live location error:', error)
    }

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [isTracking, onLocationUpdate])

  return null
}

// Component to auto-center map on current location
function MapController({ currentLocation, targetLocation }: {
  currentLocation: [number, number] | null
  targetLocation: [number, number]
}) {
  const map = useMap()

  useEffect(() => {
    if (currentLocation) {
      // Fit map to show both current location and target
      const bounds = L.latLngBounds([currentLocation, targetLocation])
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [currentLocation, targetLocation, map])

  return null
}

export default function LiveNavigation({ 
  sellerLocation, 
  onNavigationStart, 
  onNavigationEnd 
}: LiveNavigationProps) {
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [route, setRoute] = useState<RouteInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locationAccuracy, setLocationAccuracy] = useState<number>(0)
  const [navigationStarted, setNavigationStarted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [distanceToDestination, setDistanceToDestination] = useState<number>(0)

  // Custom icons
  const currentLocationIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })

  const sellerLocationIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })

  // Get current location initially
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      return
    }

    setLoading(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setCurrentLocation([latitude, longitude])
        setLocationAccuracy(accuracy)
        setLoading(false)
        console.log('✅ Initial location obtained:', { latitude, longitude, accuracy })
      },
      (error) => {
        console.error('❌ Error getting location:', error)
        setError('Unable to get your current location. Please enable location access.')
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    )
  }

  // Handle live location updates
  const handleLocationUpdate = (lat: number, lng: number, accuracy: number) => {
    setCurrentLocation([lat, lng])
    setLocationAccuracy(accuracy)
    
    // Calculate distance to destination
    if (sellerLocation) {
      const distance = calculateDistance(lat, lng, sellerLocation.lat, sellerLocation.lng)
      setDistanceToDestination(distance)
      
      // Check if we've arrived (within 50 meters)
      if (distance < 0.05 && isNavigating) {
        setIsNavigating(false)
        setNavigationStarted(false)
        onNavigationEnd?.()
        alert('🎉 You have arrived at your destination!')
      }
    }
  }

  // Calculate distance between two points (in km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Get optimized route from OSRM
  const getOptimizedRoute = async (fromLat: number, fromLng: number, toLat: number, toLng: number) => {
    try {
      setLoading(true)
      setError('')
      
      // OSRM route request with steps for turn-by-turn navigation
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?steps=true&geometries=geojson&overview=full`
      )

      if (!response.ok) {
        throw new Error('Failed to get route from OSRM')
      }

      const data = await response.json()
      
      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0]
        
        // Extract coordinates from the route geometry
        const coordinates: [number, number][] = routeData.geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] // OSRM returns [lng, lat], we need [lat, lng]
        )

        // Extract turn-by-turn instructions
        const steps = routeData.legs[0].steps.map((step: any) => ({
          instruction: step.maneuver.instruction || 'Continue',
          distance: step.distance,
          duration: step.duration
        }))

        const routeInfo: RouteInfo = {
          geometry: coordinates,
          distance: routeData.distance / 1000, // Convert to km
          duration: routeData.duration / 60, // Convert to minutes
          steps
        }

        setRoute(routeInfo)
        console.log('✅ Route calculated:', routeInfo)
        return routeInfo
      } else {
        throw new Error('No route found')
      }
    } catch (error) {
      console.error('❌ Error getting route:', error)
      setError('Unable to calculate route. Please try again.')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Start navigation
  const startNavigation = async () => {
    if (!currentLocation) {
      alert('Please allow location access to start navigation.')
      await getCurrentLocation()
      return
    }

    setLoading(true)
    const routeInfo = await getOptimizedRoute(
      currentLocation[0], 
      currentLocation[1], 
      sellerLocation.lat, 
      sellerLocation.lng
    )

    if (routeInfo) {
      setIsNavigating(true)
      setNavigationStarted(true)
      setCurrentStep(0)
      onNavigationStart?.()
    }
  }

  // Stop navigation
  const stopNavigation = () => {
    setIsNavigating(false)
    setNavigationStarted(false)
    setRoute(null)
    setCurrentStep(0)
    onNavigationEnd?.()
  }

  // Initialize location on component mount
  useEffect(() => {
    getCurrentLocation()
  }, [])

  return (
    <div className="w-full space-y-4">
      {/* Navigation Controls */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Navigation className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-800">Live Navigation</h3>
              <p className="text-sm text-gray-600">to {sellerLocation.name}</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {!navigationStarted ? (
              <button
                onClick={startNavigation}
                disabled={loading || !currentLocation}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors font-medium text-sm flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Calculating...</span>
                  </>
                ) : (
                  <>
                    <Route className="w-4 h-4" />
                    <span>Start Navigation</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={stopNavigation}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium text-sm flex items-center space-x-2"
              >
                <Target className="w-4 h-4" />
                <span>Stop Navigation</span>
              </button>
            )}
            
            <button
              onClick={getCurrentLocation}
              disabled={loading}
              className="px-3 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Route Information */}
        {route && (
          <div className="grid grid-cols-3 gap-4 p-3 bg-blue-50 rounded-lg mb-3">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-800">{route.distance.toFixed(1)} km</div>
              <div className="text-sm text-blue-600">Distance</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-800">{Math.round(route.duration)} min</div>
              <div className="text-sm text-blue-600">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-800">{distanceToDestination.toFixed(2)} km</div>
              <div className="text-sm text-blue-600">Remaining</div>
            </div>
          </div>
        )}

        {/* Current Step Instruction */}
        {isNavigating && route && route.steps.length > 0 && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <Truck className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-semibold text-green-800">
                  {route.steps[currentStep]?.instruction || 'Continue on route'}
                </div>
                <div className="text-sm text-green-600">
                  Step {currentStep + 1} of {route.steps.length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Location Accuracy */}
        {currentLocation && (
          <div className="text-xs text-gray-500 mt-2">
            📍 Location accuracy: ±{Math.round(locationAccuracy)}m
            {isNavigating && <span className="ml-2">🔄 Live tracking enabled</span>}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg mt-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="w-full h-96 rounded-xl overflow-hidden border border-gray-300 shadow-lg">
        {currentLocation ? (
          <MapContainer
            center={currentLocation}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Auto-center map */}
            <MapController 
              currentLocation={currentLocation} 
              targetLocation={[sellerLocation.lat, sellerLocation.lng]} 
            />
            
            {/* Current location marker */}
            <Marker position={currentLocation} icon={currentLocationIcon}>
              <Popup>
                <div className="text-center">
                  <Navigation className="w-4 h-4 inline mb-1" />
                  <br />
                  <strong>Your Current Location</strong>
                  <br />
                  <span className="text-xs">Accuracy: ±{Math.round(locationAccuracy)}m</span>
                </div>
              </Popup>
            </Marker>
            
            {/* Seller location marker */}
            <Marker position={[sellerLocation.lat, sellerLocation.lng]} icon={sellerLocationIcon}>
              <Popup>
                <div className="text-center">
                  <MapPin className="w-4 h-4 inline mb-1" />
                  <br />
                  <strong>{sellerLocation.name}</strong>
                  <br />
                  <span className="text-xs">{sellerLocation.address}</span>
                </div>
              </Popup>
            </Marker>
            
            {/* Route polyline */}
            {route && (
              <Polyline
                positions={route.geometry}
                color="blue"
                weight={4}
                opacity={0.8}
              />
            )}
          </MapContainer>
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-500">Getting your location...</p>
            </div>
          </div>
        )}
      </div>

      {/* Live location tracker */}
      <LiveLocationTracker 
        onLocationUpdate={handleLocationUpdate}
        isTracking={isNavigating}
      />
    </div>
  )
}
