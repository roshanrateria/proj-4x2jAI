'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { 
  Package, Clock, CheckCircle, XCircle, MapPin, 
  Phone, Mail, Truck, CreditCard, Calendar, Navigation
} from 'lucide-react'
import { toast } from '@/components/ui/Toaster'
import { TranslatedText } from '@/components/TranslatedText'
import { useTranslation } from '@/contexts/TranslationContext'
import { useRouter } from 'next/navigation'

interface Order {
  id: string
  totalAmount: number
  deliveryCharge: number
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED'
  deliveryAddress: string
  createdAt: string
  seller?: {
    id: string
    name: string
    email: string
    phone?: string
  }
  orderItems: {
    id: string
    quantity: number
    price: number
    product: {
      id: string
      title: string
      images: string[]
    }
  }[]
}

export default function OrdersPage() {
  const { user, token } = useAuth()
  const { translate } = useTranslation()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (user?.role === 'BUYER') {
      fetchOrders()
    }
  }, [user])

  const fetchOrders = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
      } else {
        toast.error(await translate('Failed to load orders'))
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error(await translate('Error loading orders'))
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'CONFIRMED':
        return <CheckCircle className="w-5 h-5 text-blue-500" />
      case 'SHIPPED':
        return <Truck className="w-5 h-5 text-purple-500" />
      case 'DELIVERED':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Package className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (user?.role !== 'BUYER') {
    return (      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">
            <TranslatedText text="Access Restricted" />
          </h2>
          <p className="text-gray-500">
            <TranslatedText text="Only buyers can view orders" />
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2">
                    <div className="bg-gray-200 h-6 rounded w-32"></div>
                    <div className="bg-gray-200 h-4 rounded w-24"></div>
                  </div>
                  <div className="bg-gray-200 h-6 rounded w-20"></div>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-200 h-4 rounded w-full"></div>
                  <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            <TranslatedText text="My Orders" />
          </h1>
          <p className="text-xl text-gray-600">
            <TranslatedText text="Track and manage your purchases" />
          </p>
        </div>

        {orders.length === 0 ? (          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              <TranslatedText text="No orders yet" />
            </h3>
            <p className="text-gray-500 mb-6">
              <TranslatedText text="Start shopping to see your orders here" />
            </p>
            <a
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600"
            >
              <TranslatedText text="Browse Products" />
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">                    <div className="mb-4 lg:mb-0">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        <TranslatedText text="Order" /> #{order.id.slice(-8)}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CreditCard className="w-4 h-4" />
                          <span>₹{order.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(order.status)}
                          <span>
                            <TranslatedText text={order.status.replace('_', ' ')} />
                          </span>
                        </div>
                      </span>
                    </div>
                  </div>                  {/* Order Items */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="font-medium text-gray-800 mb-4">
                      <TranslatedText text="Items Ordered" />
                    </h4>
                    <div className="space-y-4">
                      {order.orderItems.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg overflow-hidden">
                            {item.product.images.length > 0 ? (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-orange-400" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-800">
                              <TranslatedText text={item.product.title} />
                            </h5>
                            <p className="text-sm text-gray-600">
                              <TranslatedText text="Quantity" />: {item.quantity} × ₹{item.price.toLocaleString()}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-semibold text-gray-800">
                              ₹{(item.quantity * item.price).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">                      {/* Delivery Address */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          <TranslatedText text="Delivery Address" />
                        </h4>
                        <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
                          {order.deliveryAddress}
                        </p>
                      </div>

                      {/* Order Total */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-3">
                          <TranslatedText text="Order Summary" />
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              <TranslatedText text="Subtotal" />
                            </span>
                            <span>₹{(order.totalAmount - order.deliveryCharge).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              <TranslatedText text="Delivery" />
                            </span>
                            <span>₹{order.deliveryCharge.toLocaleString()}</span>
                          </div>
                          <hr className="my-2" />
                          <div className="flex justify-between font-semibold">
                            <span>
                              <TranslatedText text="Total" />
                            </span>
                            <span className="text-orange-600">₹{order.totalAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>                    {/* Seller Info */}
                    {order.seller && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="font-medium text-gray-800 mb-3">
                          <TranslatedText text="Seller Information" />
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {order.seller.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{order.seller.name}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <Mail className="w-3 h-3" />
                                  <span>{order.seller.email}</span>
                                </div>
                                {order.seller.phone && (
                                  <div className="flex items-center space-x-1">
                                    <Phone className="w-3 h-3" />
                                    <span>{order.seller.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Navigation Actions */}
                    {(order.status === 'CONFIRMED' || order.status === 'SHIPPED') && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() => router.push(`/navigate/${order.id}`)}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center"
                          >
                            <Navigation className="w-5 h-5 mr-2" />
                            <TranslatedText text="Start Navigation" />
                          </button>
                            <button                  onClick={async () => {
                    if (order.seller?.phone) {
                      if (typeof window !== 'undefined') {
                        window.open(`tel:${order.seller.phone}`)
                      }
                    } else {
                      toast.error(await translate('Seller phone number not available'))
                    }
                  }}
                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center"
                            disabled={!order.seller?.phone}
                          >
                            <Phone className="w-5 h-5 mr-2" />
                            <TranslatedText text="Call Seller" />
                          </button>
                        </div>
                        
                        <div className="mt-3 text-center">
                          <p className="text-sm text-gray-500">
                            <TranslatedText text="Get live navigation to the seller's location" />
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
