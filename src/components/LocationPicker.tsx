'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import { Icon } from 'leaflet'
import { MapPin, Crosshair, Navigation, AlertCircle, CheckCircle } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Fix for default markers
import L from 'leaflet'
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void
}

// LocationMarker component that handles map interactions
function LocationMarker({ 
  onLocationSelect, 
  currentLocation, 
  selectedPosition, 
  setSelectedPosition 
}: LocationPickerProps & {
  currentLocation: [number, number] | null
  selectedPosition: [number, number] | null
  setSelectedPosition: (pos: [number, number]) => void
}) {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      const newPosition: [number, number] = [lat, lng]
      setSelectedPosition(newPosition)
      reverseGeocode(lat, lng, onLocationSelect)
    },
  })

  // Custom icons
  const currentLocationIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })

  const selectedLocationIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })

  return (
    <>
      {/* Current location marker (blue) */}
      {currentLocation && (
        <Marker position={currentLocation} icon={currentLocationIcon}>
          <Popup>
            <div className="text-center">
              <Navigation className="w-4 h-4 inline mb-1" />
              <br />
              <strong>Your Current Location</strong>
            </div>
          </Popup>
        </Marker>
      )}
      
      {/* Selected location marker (red) */}
      {selectedPosition && (
        <Marker position={selectedPosition} icon={selectedLocationIcon}>
          <Popup>
            <div className="text-center">
              <MapPin className="w-4 h-4 inline mb-1" />
              <br />
              <strong>Selected Location</strong>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  )
}

// Reverse geocoding function
const reverseGeocode = async (lat: number, lng: number, onLocationSelect: (lat: number, lng: number, address: string) => void) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
    const data = await response.json()
    const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    onLocationSelect(lat, lng, address)
  } catch (error) {
    console.error('Reverse geocoding failed:', error)
    onLocationSelect(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`)
  }
}

export default function LocationPicker({ onLocationSelect }: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>([20.5937, 78.9629]) // Default to India center
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null)
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
  const [loading, setLoading] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown')
  const [locationRequested, setLocationRequested] = useState(false)
  const [mounted, setMounted] = useState(false)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    setMounted(true)
    checkLocationPermission()
  }, [])

  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      setPermissionStatus('denied')
      return
    }

    // Check if Permissions API is available
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' })
        setPermissionStatus(permission.state as any)
        
        // Listen for permission changes
        permission.onchange = () => {
          setPermissionStatus(permission.state as any)
        }
      } catch (error) {
        console.log('Permissions API not fully supported')
        setPermissionStatus('unknown')
      }
    }
  }
  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      alert('❌ Geolocation is not supported by this browser.')
      return
    }

    setLoading(true)
    setLocationRequested(true)

    // First try to check permission status explicitly
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' })
        console.log('🔍 Current permission status:', permission.state)
        
        if (permission.state === 'denied') {
          setLoading(false)
          setPermissionStatus('denied')
          alert(`🚫 Location access is blocked.

To enable location access:

🔧 For Chrome/Edge:
1. Click the 🔒 lock/info icon in the address bar (left of the URL)
2. Find "Location" and set it to "Allow"
3. Refresh the page

🔧 For Firefox:
1. Click the 🛡️ shield icon in the address bar
2. Turn off "Block location access"
3. Refresh the page

🔧 For Safari:
1. Safari Menu > Preferences > Websites > Location
2. Set this website to "Allow"
3. Refresh the page

Or you can manually click on the map to select your location.`)
          return
        }
      }
    } catch (e) {
      console.log('Permission API not available, proceeding with direct request')
    }

    // Show explicit user instruction before requesting
    const userConsent = confirm(`🌍 Location Access Request

This app needs your location to:
• Calculate accurate delivery charges
• Show optimized routes to sellers
• Provide real-time navigation

Click OK to allow location access, or Cancel to select manually on the map.`)

    if (!userConsent) {
      setLoading(false)
      alert('You can manually click on the map to select your location.')
      return
    }

    // Request location with explicit options
    const options = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 60000 // Allow cached location up to 1 minute old
    }

    console.log('🔍 Requesting geolocation...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ Location obtained:', position.coords)
        const { latitude, longitude } = position.coords
        const newPosition: [number, number] = [latitude, longitude]
        
        setCurrentLocation(newPosition)
        setPosition(newPosition)
        setSelectedPosition(newPosition)
        setPermissionStatus('granted')
        setLoading(false)
        
        // Center map on current location
        if (mapRef.current) {
          mapRef.current.flyTo(newPosition, 15)
        }
        
        // Auto-select current location
        reverseGeocode(latitude, longitude, onLocationSelect)
        
        console.log('✅ Location permission granted and position obtained')
        alert('✅ Location detected successfully! You can also click on the map to select a different location.')
      },
      (error) => {
        console.error('❌ Geolocation error:', error)
        setLoading(false)
        setPermissionStatus('denied')
        
        let errorMessage = ''
        let instructions = ''
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '🚫 Location access was denied by the user or browser.'
            instructions = `To enable location access:

🔧 Chrome/Edge:
1. Look for a location icon 📍 in the address bar
2. Click it and select "Always allow"
3. OR click the 🔒 lock icon → Location → Allow
4. Refresh the page

🔧 Firefox:
1. Click the 🛡️ shield icon in address bar
2. Turn off "Block location access"
3. OR go to Settings → Privacy → Permissions → Location
4. Remove this site from blocked list

🔧 Safari:
1. Safari → Preferences → Websites → Location
2. Set this website to "Allow"
3. Refresh the page

🔧 Mobile browsers:
1. Check device location settings are enabled
2. Allow location for your browser app
3. Refresh the page

You can still manually select your location by clicking on the map.`
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = '📍 Your location could not be determined.'
            instructions = 'Please check that:\n• Location services are enabled on your device\n• You have an internet connection\n• GPS is turned on (for mobile devices)'
            break
          case error.TIMEOUT:
            errorMessage = '⏱️ Location request timed out.'
            instructions = 'Please try again with a stronger GPS signal or internet connection.'
            break
          default:
            errorMessage = '❓ An unknown error occurred while getting your location.'
            instructions = 'Please try refreshing the page or manually select your location on the map.'
            break
        }
        
        alert(`${errorMessage}\n\n${instructions}`)
      },
      options
    )
  }

  const getPermissionStatusDisplay = () => {
    switch(permissionStatus) {
      case 'granted':
        return { icon: CheckCircle, text: 'Location access granted', color: 'text-green-600 bg-green-50' }
      case 'denied':
        return { icon: AlertCircle, text: 'Location access denied', color: 'text-red-600 bg-red-50' }
      case 'prompt':
        return { icon: MapPin, text: 'Click to allow location access', color: 'text-blue-600 bg-blue-50' }
      default:
        return { icon: MapPin, text: 'Location permission unknown', color: 'text-gray-600 bg-gray-50' }
    }
  }

  if (!mounted) {
    return (
      <div className="w-full h-80 bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading map...</p>
        </div>
      </div>
    )
  }

  const statusDisplay = getPermissionStatusDisplay()

  return (
    <div className="w-full space-y-4">
      {/* Location Permission Request Section */}
      <div className={`rounded-xl p-4 border ${statusDisplay.color}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <statusDisplay.icon className="w-5 h-5" />
            <div>
              <h4 className="font-medium">📍 Location Access</h4>
              <p className="text-sm mt-1">{statusDisplay.text}</p>
            </div>
          </div>
          
          {(permissionStatus === 'unknown' || permissionStatus === 'prompt' || !locationRequested) && (
            <button
              onClick={requestLocationPermission}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg transition-colors font-medium text-sm flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Requesting...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>Get My Location</span>
                </>
              )}
            </button>
          )}
          
          {permissionStatus === 'denied' && (
            <button
              onClick={requestLocationPermission}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium text-sm"
            >
              🔄 Try Again
            </button>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h4 className="font-medium text-gray-800 mb-2">📍 How to select your location:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>1. 🔵 <strong>Auto-detect:</strong> Click "Get My Location" to automatically detect your current position</p>
          <p>2. 🖱️ <strong>Manual:</strong> Click anywhere on the map to select your exact location</p>
          <p>3. 🔴 <strong>Selected:</strong> Your chosen location will appear as a red marker</p>
        </div>
      </div>
      
      {/* Map Container */}
      <div className="w-full h-80 rounded-xl overflow-hidden border border-gray-300 shadow-lg">
        <MapContainer
          center={position}
          zoom={currentLocation ? 15 : 5}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            onLocationSelect={onLocationSelect}
            currentLocation={currentLocation}
            selectedPosition={selectedPosition}
            setSelectedPosition={setSelectedPosition}
          />
        </MapContainer>
      </div>

      {/* Selected Location Display */}
      {selectedPosition && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h4 className="font-medium text-green-800">✅ Location Selected</h4>
              <p className="text-sm text-green-700">
                📍 {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
