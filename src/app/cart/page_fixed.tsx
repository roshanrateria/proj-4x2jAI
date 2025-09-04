'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Trash2, Plus, Minus, ShoppingBag, MapPin, CreditCard } from 'lucide-react'
import { toast } from '@/components/ui/Toaster'
import { calculateDeliveryCharge } from '@/lib/osrm'
import QRCode from 'qrcode'
import { TranslatedText } from '@/components/TranslatedText'
import { useTranslation } from '@/contexts/TranslationContext'

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    title: string
    price: number
    images: string[]
    inStock: boolean
    seller: {
      id: string
      name: string
      address?: string
      latitude?: number
      longitude?: number
    }
  }
}

interface DeliveryInfo {
  distance: number
  charge: number
  duration: number
  baseFare: number
  distanceFare: number
  breakdown: {
    baseFare: number
    distanceFare: number
    total: number
  }
}

export default function CartPage() {
  const { user, token } = useAuth()
  const { translate } = useTranslation()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deliveryCharges, setDeliveryCharges] = useState<Record<string, DeliveryInfo>>({})
  const [showCheckout, setShowCheckout] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'payment' | 'confirmation'>('payment')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [orderTotal, setOrderTotal] = useState(0)

  useEffect(() => {
    if (user?.role === 'BUYER') {
      fetchCartItems()
    }
  }, [user])
  
  useEffect(() => {
    calculateAllDeliveryCharges()
  }, [cartItems, user])

  const fetchCartItems = async () => {
    if (!token) return
    
    try {
      const response = await fetch('/api/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCartItems(data.cartItems)
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
      toast.error(await translate('Failed to load cart'))
    } finally {
      setLoading(false)
    }
  }

  const calculateAllDeliveryCharges = async () => {
    if (!user?.latitude || !user?.longitude || cartItems.length === 0) return

    const charges: Record<string, DeliveryInfo> = {}
    
    for (const item of cartItems) {
      const seller = item.product.seller
      if (seller.latitude && seller.longitude) {
        try {
          const deliveryInfo = await calculateDeliveryCharge(
            seller.latitude,
            seller.longitude,
            user.latitude,
            user.longitude
          )
          charges[seller.id] = deliveryInfo
        } catch (error) {
          console.error('Error calculating delivery for seller:', seller.id, error)
        }
      }
    }
    
    setDeliveryCharges(charges)
  }

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId)
      return
    }

    // Optimistic update
    setCartItems(prev => prev.map(item => 
      item.id === cartItemId ? { ...item, quantity: newQuantity } : item
    ))
    
    try {
      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cartItemId, quantity: newQuantity })
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(await translate(errorData.error || 'Failed to update quantity'))
        fetchCartItems() // Revert on error
      } else {
        const successMsg = await translate('Quantity updated')
        toast.success(successMsg)
      }
    } catch (error) {
      toast.error(await translate('Error updating quantity'))
      fetchCartItems()
    }
  }

  const removeFromCart = async (cartItemId: string) => {
    try {
      const response = await fetch(`/api/cart?id=${cartItemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setCartItems(prev => prev.filter(item => item.id !== cartItemId))
        toast.success(await translate('Item removed from cart'))
      } else {
        toast.error(await translate('Failed to remove item'))
      }
    } catch (error) {
      toast.error(await translate('Error removing item'))
    }
  }
  
  const proceedToCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error(await translate('Your cart is empty'))
      return
    }
    
    if (!user?.address) {
      toast.error(await translate('Please update your address in profile before checkout'))
      return
    }
    
    setShowCheckout(true)
    setPaymentStep('payment')
    generatePaymentQR()
  }

  const generatePaymentQR = async () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
    const totalDelivery = Object.values(deliveryCharges).reduce((sum, charge) => sum + charge.charge, 0)
    const total = subtotal + totalDelivery
    setOrderTotal(total)

    // Group items by seller for payment
    const sellerGroups = cartItems.reduce((groups, item) => {
      const sellerId = item.product.seller.id
      if (!groups[sellerId]) {
        groups[sellerId] = {
          seller: item.product.seller,
          items: [],
          subtotal: 0
        }
      }
      groups[sellerId].items.push(item)
      groups[sellerId].subtotal += item.product.price * item.quantity
      return groups
    }, {} as Record<string, any>)

    // For demo, we'll show the first seller's UPI ID
    const firstSeller = Object.values(sellerGroups)[0] as any
    const seller = await fetch(`/api/users/${firstSeller.seller.id}`).then(r => r.json())
    
    if (seller.upiId) {
      const upiString = `upi://pay?pa=${seller.upiId}&pn=${seller.name}&am=${total}&cu=INR&tn=Kalakriti Order Payment`
      const qrUrl = await QRCode.toDataURL(upiString)
      setQrCodeUrl(qrUrl)
    }
  }

  const confirmPayment = async () => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cartItems,
          deliveryAddress: user?.address, // Use buyer's saved address
          deliveryCharges
        })
      })

      if (response.ok) {
        setPaymentStep('confirmation')
        setCartItems([]) // Clear cart
        toast.success(await translate('Order placed successfully!'))
      } else {
        toast.error(await translate('Failed to place order'))
      }
    } catch (error) {
      toast.error(await translate('Error placing order'))
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const totalDelivery = Object.values(deliveryCharges).reduce((sum, charge) => sum + charge.charge, 0)
  const total = subtotal + totalDelivery

  if (user?.role !== 'BUYER') {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">
            <TranslatedText text="Access Restricted" />
          </h2>
          <p className="text-gray-500">
            <TranslatedText text="Only buyers can access the cart" />
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex space-x-4">
                  <div className="bg-gray-200 w-20 h-20 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                    <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                    <div className="bg-gray-200 h-6 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (showCheckout) {
    return (
      <div className="min-h-screen py-12 px-4">        
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {paymentStep === 'payment' && (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  <TranslatedText text="Order Summary & Payment" />
                </h2>
                
                {/* Delivery Address Section */}
                <div className="bg-blue-50 p-4 rounded-xl mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    <TranslatedText text="Delivery Address" />
                  </h3>
                  <p className="text-gray-700">{user?.address}</p>
                </div>

                {/* Delivery Charges Breakdown */}
                <div className="bg-gray-50 p-4 rounded-xl mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    <TranslatedText text="Delivery Charges Breakdown" />
                  </h3>
                  {Object.entries(deliveryCharges).map(([sellerId, charge]) => {
                    const seller = cartItems.find(item => item.product.seller.id === sellerId)?.product.seller
                    return (
                      <div key={sellerId} className="mb-3 p-3 bg-white rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{seller?.name}</span>
                          <span className="font-bold text-orange-600">₹{charge.charge}</span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Base fare:</span>
                            <span>₹{charge.baseFare}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Distance ({charge.distance} km):</span>
                            <span>₹{charge.distanceFare}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Estimated time:</span>
                            <span>{charge.duration} minutes</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <div className="text-center space-y-6">
                  <div className="bg-orange-50 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      <TranslatedText text="Total Amount" />
                    </h3>
                    <p className="text-3xl font-bold text-orange-600">₹{orderTotal.toLocaleString()}</p>
                  </div>
                  
                  {qrCodeUrl && (
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        <TranslatedText text="Scan the QR code below to pay via UPI:" />
                      </p>
                      <img src={qrCodeUrl} alt="Payment QR Code" className="mx-auto w-48 h-48" />
                      <p className="text-sm text-gray-500">
                        <TranslatedText text="Or use any UPI app to scan and pay" />
                      </p>
                    </div>
                  )}
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowCheckout(false)}
                      className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50"
                    >
                      <TranslatedText text="Back to Cart" />
                    </button>
                    <button
                      onClick={confirmPayment}
                      className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700"
                    >
                      <TranslatedText text="I've Paid" />
                    </button>
                  </div>
                </div>              
              </>
            )}

            {paymentStep === 'confirmation' && (
              <div className="text-center space-y-6">
                <div className="text-green-600">
                  <CreditCard className="w-16 h-16 mx-auto mb-4" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  <TranslatedText text="Order Placed Successfully!" />
                </h2>
                <p className="text-gray-600">
                  <TranslatedText text="Thank you for your order. You will receive a confirmation email shortly." />
                </p>
                <button
                  onClick={() => {
                    setShowCheckout(false)
                    setPaymentStep('payment')
                  }}
                  className="py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600"
                >
                  <TranslatedText text="Continue Shopping" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            <TranslatedText text="Shopping Cart" />
          </h1>
          <p className="text-gray-600">
            {cartItems.length} <TranslatedText text="items in your cart" />
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              <TranslatedText text="Your cart is empty" />
            </h3>
            <p className="text-gray-500 mb-6">
              <TranslatedText text="Add some products to get started" />
            </p>
            <a
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600"
            >
              <TranslatedText text="Browse Products" />
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex space-x-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg overflow-hidden">
                      {item.product.images.length > 0 ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-orange-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">
                        <TranslatedText text={item.product.title} />
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>
                          <TranslatedText text="Sold by" /> {item.product.seller.name}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-orange-600">₹{item.product.price.toLocaleString()}</p>
                      
                      {deliveryCharges[item.product.seller.id] && (
                        <p className="text-sm text-gray-500">
                          <TranslatedText text="Delivery" />: ₹{deliveryCharges[item.product.seller.id].charge} 
                          ({deliveryCharges[item.product.seller.id].distance.toFixed(1)} km)
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  <TranslatedText text="Order Summary" />
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      <TranslatedText text="Subtotal" />
                    </span>
                    <span className="font-semibold">₹{subtotal.toLocaleString()}</span>
                  </div>
                  
                  {/* Delivery Breakdown */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>
                        <TranslatedText text="Delivery Charges:" />
                      </span>
                    </div>
                    {Object.entries(deliveryCharges).map(([sellerId, charge]) => {
                      const seller = cartItems.find(item => item.product.seller.id === sellerId)?.product.seller
                      return (
                        <div key={sellerId} className="text-sm text-gray-600 ml-2 mb-1">
                          <div className="flex justify-between">
                            <span>{seller?.name}</span>
                            <span>₹{charge.charge}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Base ₹{charge.baseFare} + ₹{charge.distanceFare} ({charge.distance}km)
                          </div>
                        </div>
                      )
                    })}
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-600">
                        <TranslatedText text="Total Delivery" />
                      </span>
                      <span className="font-semibold">₹{totalDelivery.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <hr className="my-4" />
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">
                      <TranslatedText text="Total" />
                    </span>
                    <span className="font-bold text-orange-600">₹{total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={proceedToCheckout}
                  className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 font-semibold"
                >
                  <TranslatedText text="Proceed to Checkout" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
