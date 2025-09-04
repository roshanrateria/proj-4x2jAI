'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Heart, ShoppingCart, Trash2, Package } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/Toaster'
import { TranslatedText } from '@/components/TranslatedText'
import { useTranslation } from '@/contexts/TranslationContext'

interface WishlistItem {
  id: string
  createdAt: string
  product: {
    id: string
    title: string
    price: number
    originalPrice?: number
    images: string[]
    inStock: boolean
    stockQuantity: number
    tags: string[]
    discountPercent?: number
    isFeatured?: boolean
    seller: {
      id: string
      name: string
      address?: string
    }
  }
}

export default function WishlistPage() {
  const { user, token } = useAuth()
  const { translate } = useTranslation()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'BUYER') {
      fetchWishlistItems()
    }
  }, [user])

  const fetchWishlistItems = async () => {
    if (!token) return
    
    try {
      const response = await fetch('/api/wishlist', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setWishlistItems(data.wishlistItems)
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error)
      toast.error(await translate('Failed to load wishlist'))
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (productId: string) => {
    try {
      const response = await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setWishlistItems(prev => prev.filter(item => item.product.id !== productId))
        toast.success(await translate('Removed from wishlist'))
      } else {
        toast.error(await translate('Failed to remove item'))
      }
    } catch (error) {
      toast.error(await translate('Error removing item'))
    }
  }

  const addToCart = async (productId: string) => {
    if (!user || !token) {
      const translated = await translate('Please login to add items to cart')
      toast.error(translated)
      return
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity: 1 })
      })

      if (response.ok) {
        const translated = await translate('Added to cart!')
        toast.success(translated)
      } else {
        const errorData = await response.json()
        const translated = await translate(errorData.error || 'Failed to add to cart')
        toast.error(translated)
      }
    } catch (error) {
      const translated = await translate('Error adding to cart')
      toast.error(translated)
    }
  }

  // Helper function to check if discount is active
  const isDiscountActive = (product: any) => {
    if (!product.discountStart || !product.discountEnd) return false
    const now = new Date()
    const start = new Date(product.discountStart)
    const end = new Date(product.discountEnd)
    return now >= start && now <= end
  }

  // Helper function to calculate discount percentage
  const getDiscountPercent = (product: any) => {
    if (!product.originalPrice || !isDiscountActive(product)) return 0
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
  }

  if (user?.role !== 'BUYER') {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">
            <TranslatedText text="Access Restricted" />
          </h2>
          <p className="text-gray-500">
            <TranslatedText text="Only buyers can access the wishlist" />
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

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center">
            <Heart className="w-10 h-10 text-red-500 mr-4" />
            <TranslatedText text="My Wishlist" />
          </h1>
          <p className="text-gray-600">
            {wishlistItems.length} <TranslatedText text="items saved for later" />
          </p>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              <TranslatedText text="Your wishlist is empty" />
            </h3>
            <p className="text-gray-500 mb-6">
              <TranslatedText text="Save products you love for later" />
            </p>
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600"
            >
              <TranslatedText text="Browse Products" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {wishlistItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex space-x-4">
                  {/* Product Image */}
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product.images.length > 0 ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-orange-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <Link
                      href={`/products/${item.product.id}`}
                      className="text-lg font-semibold text-gray-800 hover:text-orange-600 transition-colors mb-2 block"
                    >
                      <TranslatedText text={item.product.title} />
                    </Link>
                    
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <span>
                        <TranslatedText text="Sold by" /> {item.product.seller.name}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center space-x-3 mb-3">
                      {isDiscountActive(item.product) && item.product.originalPrice ? (
                        <>
                          <span className="text-xl font-bold text-orange-600">
                            ₹{item.product.price.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-400 line-through">
                            ₹{item.product.originalPrice.toLocaleString()}
                          </span>
                          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                            {getDiscountPercent(item.product)}% OFF
                          </span>
                        </>
                      ) : (
                        <span className="text-xl font-bold text-orange-600">
                          ₹{item.product.price.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Stock Status */}
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.product.inStock && item.product.stockQuantity > 0
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.product.inStock && item.product.stockQuantity > 0 ? (
                          <TranslatedText text="In Stock" />
                        ) : (
                          <TranslatedText text="Out of Stock" />
                        )}
                      </span>
                      
                      {item.product.isFeatured && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                          ⭐ <TranslatedText text="Featured" />
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.product.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => removeFromWishlist(item.product.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    {item.product.inStock && item.product.stockQuantity > 0 && (
                      <button
                        onClick={() => addToCart(item.product.id)}
                        className="flex items-center justify-center space-x-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span className="text-sm">
                          <TranslatedText text="Add to Cart" />
                        </span>
                      </button>
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
