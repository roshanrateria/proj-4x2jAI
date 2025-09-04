'use client'

import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getDeliveryRoute } from '@/lib/osrm'

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface Order {
  id: string
  totalAmount: number
  status: string
  deliveryAddress: string
  deliveryLatitude: number
  deliveryLongitude: number
  buyer: {
    name: string
    email: string
  }
}

interface DeliveryMapProps {
  orders: Order[]
  sellerLatitude: number
  sellerLongitude: number
}

export default function DeliveryMap({ orders, sellerLatitude, sellerLongitude }: DeliveryMapProps) {
  const [mounted, setMounted] = useState(false)
  const [routes, setRoutes] = useState<Record<string, [number, number][]>>({})
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Calculate routes for pending orders
    const calculateRoutes = async () => {
      const newRoutes: Record<string, [number, number][]> = {}
      
      for (const order of orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED')) {
        try {
          const route = await getDeliveryRoute(
            sellerLatitude,
            sellerLongitude,
            order.deliveryLatitude,
            order.deliveryLongitude
          )
          newRoutes[order.id] = route.geometry
        } catch (error) {
          console.error('Error calculating route for order:', order.id, error)
          // Fallback to straight line
          newRoutes[order.id] = [
            [sellerLatitude, sellerLongitude],
            [order.deliveryLatitude, order.deliveryLongitude]
          ]
        }
      }
      
      setRoutes(newRoutes)
    }

    if (orders.length > 0 && sellerLatitude && sellerLongitude) {
      calculateRoutes()
    }
  }, [orders, sellerLatitude, sellerLongitude])

  if (!mounted) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center">
        <p className="text-gray-500">Loading delivery map...</p>
      </div>
    )
  }

  // Filter orders that have valid coordinates
  const validOrders = orders.filter(order => 
    order.deliveryLatitude && 
    order.deliveryLongitude &&
    (order.status === 'PENDING' || order.status === 'CONFIRMED')
  )

  if (validOrders.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">No pending deliveries to show</p>
          <p className="text-sm text-gray-400">Orders with confirmed delivery locations will appear here</p>
        </div>
      </div>
    )
  }

  // Create seller icon (blue)
  const sellerIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="blue" width="32" height="32">
        <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  })

  // Create delivery icons based on status
  const getDeliveryIcon = (status: string) => {
    const color = status === 'PENDING' ? 'orange' : status === 'CONFIRMED' ? 'green' : 'red'
    return L.icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      `),
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24]
    })
  }

  // Get route color based on status
  const getRouteColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#f59e0b' // orange
      case 'CONFIRMED': return '#10b981' // green
      default: return '#ef4444' // red
    }
  }

  // Calculate map center and bounds
  const allLatLngs = [
    [sellerLatitude, sellerLongitude],
    ...validOrders.map(order => [order.deliveryLatitude, order.deliveryLongitude])
  ]
  
  const centerLat = allLatLngs.reduce((sum, coord) => sum + coord[0], 0) / allLatLngs.length
  const centerLng = allLatLngs.reduce((sum, coord) => sum + coord[1], 0) / allLatLngs.length

  return (
    <div className="w-full space-y-4">
      {/* Legend */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-800 mb-2">Map Legend</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            <span>Your Location</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
            <span>Pending Delivery</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
            <span>Confirmed Delivery</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="w-full h-96 rounded-xl overflow-hidden border border-gray-300">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Seller location */}
          <Marker 
            position={[sellerLatitude, sellerLongitude]} 
            icon={sellerIcon}
          >
            <Popup>
              <div className="text-center">
                <strong>Your Shop Location</strong>
                <br />
                <span className="text-sm text-gray-600">All deliveries start from here</span>
              </div>
            </Popup>
          </Marker>
          
          {/* Delivery locations and routes */}
          {validOrders.map((order) => (
            <React.Fragment key={order.id}>
              {/* Route line */}
              {routes[order.id] && (
                <Polyline
                  positions={routes[order.id]}
                  color={getRouteColor(order.status)}
                  weight={3}
                  opacity={0.7}
                  dashArray={order.status === 'PENDING' ? '10, 10' : undefined}
                />
              )}
              
              {/* Delivery marker */}
              <Marker
                position={[order.deliveryLatitude, order.deliveryLongitude]}
                icon={getDeliveryIcon(order.status)}
                eventHandlers={{
                  click: () => setSelectedOrder(order)
                }}
              >
                <Popup>
                  <div className="min-w-48">
                    <strong>Order #{order.id.slice(-8)}</strong>
                    <br />
                    <span className="text-sm text-gray-600">Customer: {order.buyer.name}</span>
                    <br />
                    <span className="text-sm text-gray-600">Amount: ₹{order.totalAmount.toLocaleString()}</span>
                    <br />
                    <span className={`text-sm font-medium ${
                      order.status === 'PENDING' ? 'text-orange-600' :
                      order.status === 'CONFIRMED' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Status: {order.status}
                    </span>
                    <br />
                    <div className="text-xs text-gray-500 mt-1">
                      <strong>Address:</strong>
                      <br />
                      {order.deliveryAddress}
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}
        </MapContainer>
      </div>

      {/* Order details sidebar */}
      {selectedOrder && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-2">
            Selected Order #{selectedOrder.id.slice(-8)}
          </h4>
          <div className="space-y-2 text-sm">
            <div><strong>Customer:</strong> {selectedOrder.buyer.name}</div>
            <div><strong>Email:</strong> {selectedOrder.buyer.email}</div>
            <div><strong>Amount:</strong> ₹{selectedOrder.totalAmount.toLocaleString()}</div>
            <div><strong>Status:</strong> 
              <span className={`ml-1 font-medium ${
                selectedOrder.status === 'PENDING' ? 'text-orange-600' :
                selectedOrder.status === 'CONFIRMED' ? 'text-green-600' : 'text-red-600'
              }`}>
                {selectedOrder.status}
              </span>
            </div>
            <div><strong>Delivery Address:</strong> {selectedOrder.deliveryAddress}</div>
          </div>
          <button
            onClick={() => setSelectedOrder(null)}
            className="mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Close details
          </button>
        </div>
      )}
    </div>
  )
}
