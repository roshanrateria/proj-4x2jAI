'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { 
  Package, Clock, CheckCircle, XCircle, MapPin, 
  Phone, Mail, Truck, CreditCard, Calendar, Navigation, ArrowLeft
} from 'lucide-react'
import { TranslatedText } from '@/components/TranslatedText'
import { useTranslation } from '@/contexts/TranslationContext'
import { toast } from '@/components/ui/Toaster'
import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues
const LiveNavigation = dynamic(() => import('@/components/LiveNavigation'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading navigation...</p>
      </div>
    </div>
  )
})

interface OrderDetails {
  id: string
  totalAmount: number
  deliveryCharge: number
  status: string
  deliveryAddress: string
  seller: {
    id: string
    name: string
    address: string
    latitude: number
    longitude: number
    phone?: string
  }
  orderItems: Array<{
    id: string
    quantity: number
    price: number
    product: {
      id: string
      title: string
      images: string[]
    }
  }>
}

export default function NavigationPage() {
  const params = useParams()
  const router = useRouter()
  const { user, token } = useAuth()
  const { translate } = useTranslation()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [navigationStarted, setNavigationStarted] = useState(false)

  const orderId = params.orderId as string

  useEffect(() => {
    if (user && orderId) {
      fetchOrderDetails()
    }
  }, [user, orderId])

  const fetchOrderDetails = async () => {
    if (!token || !orderId) return

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const orderData = await response.json()
        setOrder(orderData)
      } else {
        toast.error(await translate('Failed to load order details'))
        router.push('/orders')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error(await translate('Error loading order'))
      router.push('/orders')
    } finally {
      setLoading(false)
    }
  }

  const handleNavigationStart = () => {
    setNavigationStarted(true)
  }
  const handleNavigationEnd = async () => {
    setNavigationStarted(false)
    toast.success(await translate('Navigation ended'))
  }

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="bg-gray-200 h-8 rounded w-1/3"></div>
            <div className="bg-gray-200 h-96 rounded-xl"></div>
            <div className="bg-gray-200 h-32 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">
            <TranslatedText text="Order Not Found" />
          </h2>
          <p className="text-gray-500 mb-4">
            <TranslatedText text="The order you're looking for doesn't exist or you don't have access to it." />
          </p>
          <button
            onClick={() => router.push('/orders')}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <TranslatedText text="Back to Orders" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.back()}
              className="mr-3 p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              <Navigation className="w-6 h-6 inline mr-2" />
              <TranslatedText text="Live Navigation" />
            </h1>
          </div>

          {/* Order Info Banner */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">
                  <TranslatedText text="Order" /> #{order.id.slice(-8)}
                </h3>
                <p className="text-sm text-gray-600">
                  <TranslatedText text="Delivery to" />: {order.seller.name}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-orange-600">
                  ₹{order.totalAmount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  <TranslatedText text="Status" />: {order.status}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Navigation Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">
                  <MapPin className="w-5 h-5 inline mr-2" />
                  <TranslatedText text="Route to Seller" />
                </h2>
                <p className="text-sm text-gray-600">
                  <TranslatedText text="Live navigation with real-time location tracking" />
                </p>
              </div>
              
              <div className="h-96">
                <LiveNavigation
                  sellerLocation={{
                    lat: order.seller.latitude,
                    lng: order.seller.longitude,
                    name: order.seller.name,
                    address: order.seller.address
                  }}
                  onNavigationStart={handleNavigationStart}
                  onNavigationEnd={handleNavigationEnd}
                />
              </div>
            </div>
          </div>

          {/* Order Details & Instructions */}
          <div className="space-y-6">
            {/* Seller Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                <TranslatedText text="Seller Information" />
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium text-gray-800">{order.seller.name}</div>
                    <div className="text-sm text-gray-600">{order.seller.address}</div>
                  </div>
                </div>
                
                {order.seller.phone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <div className="text-sm text-gray-600">{order.seller.phone}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                <TranslatedText text="Order Items" />
              </h3>
              
              <div className="space-y-3">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 text-sm">
                        {item.product.title}
                      </div>
                      <div className="text-xs text-gray-600">
                        {item.quantity}x ₹{item.price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    <TranslatedText text="Delivery Charge" />
                  </span>
                  <span className="font-medium">₹{order.deliveryCharge}</span>
                </div>
                <div className="flex justify-between text-base font-semibold mt-1">
                  <span>
                    <TranslatedText text="Total" />
                  </span>
                  <span className="text-orange-600">₹{order.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Navigation Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                <Navigation className="w-5 h-5 inline mr-2" />
                <TranslatedText text="Navigation Status" />
              </h3>
              
              <div className="space-y-3">
                <div className={`flex items-center p-3 rounded-lg ${
                  navigationStarted ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'
                }`}>
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    navigationStarted ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-sm font-medium">
                    {navigationStarted ? (
                      <TranslatedText text="Navigation Active" />
                    ) : (
                      <TranslatedText text="Navigation Ready" />
                    )}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                  <Clock className="w-4 h-4 inline mr-1" />
                  <TranslatedText text="Your location will be tracked in real-time to provide accurate turn-by-turn directions." />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
