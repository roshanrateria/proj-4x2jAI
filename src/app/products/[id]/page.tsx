'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useParams } from 'next/navigation'
import { 
  ShoppingCart, Heart, MapPin, Star, Package, Truck, 
  Shield, ArrowLeft, Plus, Minus, MessageCircle, Sparkles,
  Share2, ChevronLeft, ChevronRight, Bot
} from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/Toaster'
import { calculateDeliveryCharge } from '@/lib/osrm'
import ProductAIChat from '@/components/ProductAIChat'
import { TranslatedText } from '@/components/TranslatedText'
import { useTranslation } from '@/contexts/TranslationContext'

interface Product {
  id: string
  title: string
  description: string
  tagline?: string
  price: number
  images: string[]
  inStock: boolean
  stockQuantity: number
  tags: string[]
  // Discount & Pricing fields
  originalPrice?: number
  discountPercent?: number
  discountAmount?: number
  discountStart?: string
  discountEnd?: string
  isFeatured?: boolean
  // Artisan-specific fields
  material?: string
  technique?: string
  artForm?: string
  origin?: string
  length?: string
  width?: string
  height?: string
  weight?: string
  artisanStory?: string
  culturalSignificance?: string
  timeToCreate?: string
  isCustomizable?: boolean
  careInstructions?: string
  authenticityMark?: string
  createdAt: string
  seller: {
    id: string
    name: string
    address?: string
    latitude?: number
    longitude?: number
  }
}

interface AIRecommendation {
  title: string
  description: string
  reasoning: string
  confidence: number
}

export default function ProductDetailPage() {
  const { user, token } = useAuth()
  const { translate } = useTranslation()
  const params = useParams()
  const productId = params.id as string
    const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([])
  const [deliveryInfo, setDeliveryInfo] = useState<{distance: number, charge: number, duration: number} | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [showProductAIChat, setShowProductAIChat] = useState(false)
  const [isInWishlist, setIsInWishlist] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [productId])
  useEffect(() => {
    if (product && user?.latitude && user?.longitude && product.seller.latitude && product.seller.longitude) {
      calculateDelivery()
    }
  }, [product, user])

  useEffect(() => {
    if (product && user?.role === 'BUYER') {
      checkWishlistStatus()
    }
  }, [product, user])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${productId}`)
      
      if (response.ok) {
        const data = await response.json()
        setProduct(data.product)
        
        // Fetch related products based on tags
        if (data.product.tags.length > 0) {
          fetchRelatedProducts(data.product.tags)
        }
      } else {
        toast.error('Product not found')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedProducts = async (tags: string[]) => {
    try {
      const params = new URLSearchParams({
        limit: '4',
        category: tags[0] // Use first tag as category filter
      })
      
      const response = await fetch(`/api/products?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRelatedProducts(data.products.filter((p: Product) => p.id !== productId))
      }
    } catch (error) {
      console.error('Error fetching related products:', error)
    }
  }

  const calculateDelivery = async () => {
    if (!user?.latitude || !user?.longitude || !product?.seller.latitude || !product?.seller.longitude) return
    
    try {
      const info = await calculateDeliveryCharge(
        product.seller.latitude,
        product.seller.longitude,
        user.latitude,
        user.longitude
      )
      setDeliveryInfo(info)
    } catch (error) {
      console.error('Error calculating delivery:', error)
    }
  }  
  const addToCart = async () => {
    if (!user || !token) {
      const translated = await translate('Please login to add items to cart')
      toast.error(translated)
      return
    }

    if (user.role === 'SELLER') {
      const translated = await translate('Sellers cannot add items to cart')
      toast.error(translated)
      return
    }

    if (!product || !product.inStock) {
      const translated = await translate('Product is out of stock')
      toast.error(translated)
      return
    }    if (quantity > product.stockQuantity) {
      const translated = await translate('Only ' + product.stockQuantity + ' items available')
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
        body: JSON.stringify({ productId: product!.id, quantity })
      })

      if (response.ok) {
        const translated = await translate('Added to cart!')
        toast.success(translated)
      } else {
        const translated = await translate('Failed to add to cart')
        toast.error(translated)
      }
    } catch (error) {
      const translated = await translate('Error adding to cart')
      toast.error(translated)
    }
  }

  const getAIRecommendations = async () => {
    if (!product) return
    
    setAiLoading(true)
    try {
      const response = await fetch('/api/ai/product-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: {
            title: product.title,
            description: product.description,
            price: product.price,
            tags: product.tags
          },
          userProfile: {
            role: user?.role,
            location: user?.address
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiRecommendations(data.recommendations)
      }
    } catch (error) {
      console.error('Error getting AI recommendations:', error)
      toast.error('Failed to get AI recommendations')
    } finally {
      setAiLoading(false)
    }
  }
  const shareProduct = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title,
          text: product?.description,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href)
      toast.success('Product link copied to clipboard!')
    }  }

  // Check if product is in wishlist
  const checkWishlistStatus = async () => {
    if (!user || user.role !== 'BUYER' || !token || !product) return
    
    try {
      const response = await fetch('/api/wishlist', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const productInWishlist = data.wishlistItems.some((item: any) => item.product.id === product.id)
        setIsInWishlist(productInWishlist)
      }
    } catch (error) {
      console.error('Error checking wishlist status:', error)
    }
  }

  // Toggle wishlist
  const toggleWishlist = async () => {
    if (!user || !token) {
      const translated = await translate('Please login to manage wishlist')
      toast.error(translated)
      return
    }

    if (user.role === 'SELLER') {
      const translated = await translate('Sellers cannot use wishlist')
      toast.error(translated)
      return
    }

    if (!product) return

    try {
      if (isInWishlist) {
        // Remove from wishlist
        const response = await fetch(`/api/wishlist?productId=${product.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          setIsInWishlist(false)
          const translated = await translate('Removed from wishlist')
          toast.success(translated)
        } else {
          const translated = await translate('Failed to remove from wishlist')
          toast.error(translated)
        }
      } else {
        // Add to wishlist
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ productId: product.id })
        })

        if (response.ok) {
          setIsInWishlist(true)
          const translated = await translate('Added to wishlist')
          toast.success(translated)
        } else {
          const errorData = await response.json()
          const translated = await translate(errorData.error || 'Failed to add to wishlist')
          toast.error(translated)
        }
      }
    } catch (error) {
      const translated = await translate('Error updating wishlist')
      toast.error(translated)
    }
  }

  // Helper function to check if discount is active
  const isDiscountActive = (product: Product) => {
    if (!product.discountStart || !product.discountEnd) return false
    const now = new Date()
    const start = new Date(product.discountStart)
    const end = new Date(product.discountEnd)
    return now >= start && now <= end
  }

  // Helper function to calculate discount percentage
  const getDiscountPercent = (product: Product) => {
    if (!product.originalPrice || !isDiscountActive(product)) return 0
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="bg-gray-200 h-96 rounded-2xl"></div>
                <div className="flex space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-200 h-20 w-20 rounded-lg"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-gray-200 h-8 rounded w-3/4"></div>
                <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                <div className="bg-gray-200 h-20 rounded"></div>
                <div className="bg-gray-200 h-12 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2"><TranslatedText text="Product not found" /></h2>
          <Link href="/products" className="text-orange-600 hover:text-orange-700">
            ← <TranslatedText text="Back to products" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}        <Link 
          href="/products" 
          className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <TranslatedText text="Back to Products" />
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl overflow-hidden">
              {product.images.length > 0 ? (
                <img
                  src={product.images[currentImageIndex]}
                  alt={product.title}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 flex items-center justify-center">
                  <Package className="w-24 h-24 text-orange-400" />
                </div>
              )}
              
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(prev => 
                      prev === 0 ? product.images.length - 1 : prev - 1
                    )}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(prev => 
                      prev === product.images.length - 1 ? 0 : prev + 1
                    )}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}              {!product.inStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xl font-semibold">
                    <TranslatedText text="Out of Stock" />
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      currentImageIndex === index ? 'border-orange-500' : 'border-gray-200'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2"><TranslatedText text={product.title} /></h1>
                  {product.tagline && (
                    <p className="text-lg text-orange-600 mb-4"><TranslatedText text={product.tagline} /></p>
                  )}
                </div>
                <div className="flex space-x-2">                  <button
                    onClick={shareProduct}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  {user?.role === 'BUYER' && (
                    <button 
                      onClick={toggleWishlist}
                      className={`p-2 border rounded-lg transition-colors ${
                        isInWishlist
                          ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
                    </button>
                  )}
                </div>
              </div>              <div className="flex items-center space-x-4 mb-6">
                <div className="flex flex-col">
                  {/* Current Price with Discount Badge */}
                  <div className="flex items-center space-x-3">
                    <span className="text-4xl font-bold text-orange-600">
                      ₹{product.price.toLocaleString()}
                    </span>
                    {isDiscountActive(product) && product.originalPrice && (
                      <>
                        <span className="text-xl text-gray-400 line-through">
                          ₹{product.originalPrice.toLocaleString()}
                        </span>
                        <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                          {getDiscountPercent(product)}% OFF
                        </span>
                      </>
                    )}
                  </div>
                  
                  {/* Savings Amount */}
                  {isDiscountActive(product) && product.originalPrice && (
                    <span className="text-sm text-green-600 font-medium mt-1">
                      🎉 You save ₹{(product.originalPrice - product.price).toLocaleString()}!
                    </span>
                  )}
                </div>
                
                {/* Stock Status and Featured Badge */}
                <div className="flex flex-col space-y-2">                  <span className={`px-3 py-1 rounded-full text-sm ${
                    product.inStock 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.inStock ? <TranslatedText text="In Stock" /> : <TranslatedText text="Out of Stock" />}
                  </span>
                    {product.isFeatured && (
                    <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      ⭐ <TranslatedText text="Featured" />
                    </span>
                  )}
                </div>
                  {product.inStock && product.stockQuantity && (
                  <span className="text-sm text-gray-600">
                    (<TranslatedText text={`${product.stockQuantity} available`} />)
                  </span>
                )}
              </div>

              {/* Limited Time Offer Banner */}
              {isDiscountActive(product) && product.discountEnd && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600 text-lg">⏰</span>                    <div>
                      <p className="text-red-800 font-semibold"><TranslatedText text="Limited Time Offer!" /></p>
                      <p className="text-red-600 text-sm">
                        <TranslatedText text="Hurry! This special price ends on" /> {new Date(product.discountEnd).toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full"
                    >
                      <TranslatedText text={tag} />
                    </span>
                  ))}
                </div>
              )}<p className="text-gray-600 leading-relaxed mb-6"><TranslatedText text={product.description} /></p>

              {/* Artisan Heritage Section 🎨 */}
              {(product.material || product.technique || product.artForm || product.origin) && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 mb-6 border border-purple-100">                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="w-6 h-6 mr-2 text-2xl">🎨</span>
                    <TranslatedText text="Artisan Craft Details" />
                    <span className="ml-2 text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded-full"><TranslatedText text="Crafted with" /> 💝</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">                    {product.material && (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600"><TranslatedText text="Primary Material" /></p>
                        <p className="font-semibold text-gray-800"><TranslatedText text={product.material} /></p>
                      </div>
                    )}
                    {product.technique && (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600"><TranslatedText text="Crafting Technique" /></p>
                        <p className="font-semibold text-gray-800"><TranslatedText text={product.technique} /></p>
                      </div>
                    )}
                    {product.artForm && (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600"><TranslatedText text="Traditional Art Form" /></p>
                        <p className="font-semibold text-gray-800"><TranslatedText text={product.artForm} /></p>
                      </div>
                    )}
                    {product.origin && (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600"><TranslatedText text="Place of Origin" /></p>
                        <p className="font-semibold text-gray-800"><TranslatedText text={product.origin} /></p>
                      </div>
                    )}
                  </div>

                  {/* Dimensions */}
                  {(product.length || product.width || product.height || product.weight) && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <span className="mr-2">📏</span>
                        Dimensions & Properties
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {product.length && (
                          <div className="bg-white rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-600">Length</p>
                            <p className="font-semibold text-gray-800">{product.length} cm</p>
                          </div>
                        )}
                        {product.width && (
                          <div className="bg-white rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-600">Width</p>
                            <p className="font-semibold text-gray-800">{product.width} cm</p>
                          </div>
                        )}
                        {product.height && (
                          <div className="bg-white rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-600">Height</p>
                            <p className="font-semibold text-gray-800">{product.height} cm</p>
                          </div>
                        )}
                        {product.weight && (
                          <div className="bg-white rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-600">Weight</p>
                            <p className="font-semibold text-gray-800">{product.weight} g</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Time & Customization */}
                  <div className="mt-4 flex items-center justify-between">
                    {product.timeToCreate && (
                      <div className="flex items-center space-x-2">
                        <span className="text-amber-600">⏱️</span>
                        <span className="text-sm text-gray-600">
                          {product.timeToCreate} days to create
                        </span>
                      </div>
                    )}
                    {product.isCustomizable && (
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600">✨</span>
                        <span className="text-sm text-green-700 bg-green-100 px-2 py-1 rounded-full">
                          Customizable
                        </span>
                      </div>
                    )}
                    {product.authenticityMark && (
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-600">🛡️</span>
                        <span className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                          Certified Authentic
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Artisan Story Section 💝 */}
              {(product.artisanStory || product.culturalSignificance) && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 mb-6 border border-amber-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="w-6 h-6 mr-2 text-2xl">💝</span>
                    The Story Behind This Creation
                  </h3>
                  
                  {product.artisanStory && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Artisan's Story</h4>
                      <p className="text-gray-600 leading-relaxed">{product.artisanStory}</p>
                    </div>
                  )}
                  
                  {product.culturalSignificance && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Cultural Significance</h4>
                      <p className="text-gray-600 leading-relaxed">{product.culturalSignificance}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Care Instructions 🛡️ */}
              {product.careInstructions && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 mb-6 border border-emerald-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="w-6 h-6 mr-2 text-2xl">🛡️</span>
                    Care Instructions
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{product.careInstructions}</p>
                </div>
              )}
            </div>

            {/* Seller Info */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Seller Information</h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {product.seller.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{product.seller.name}</p>
                  {product.seller.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{product.seller.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {deliveryInfo && (
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Truck className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-800">Delivery Information</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Distance: {deliveryInfo.distance.toFixed(1)} km</p>
                    <p>Delivery charge: ₹{deliveryInfo.charge}</p>
                    <p>Estimated time: {Math.round(deliveryInfo.duration)} minutes</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quantity and Actions */}
            {user?.role === 'BUYER' && product.inStock && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="font-medium text-gray-700"><TranslatedText text="Quantity:" /></span>
                  <div className="flex items-center space-x-2">                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                      disabled={quantity >= product.stockQuantity}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>                  </div>
                </div>

                {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                  <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded-lg">
                    ⚠️ Only {product.stockQuantity} left in stock!
                  </p>
                )}                <div className="flex space-x-4">
                  <button
                    onClick={addToCart}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span><TranslatedText text="Add to Cart" /></span>
                  </button>
                  
                  <button
                    onClick={() => setShowProductAIChat(true)}
                    className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all"
                  >
                    <Bot className="w-5 h-5" />
                    <span><TranslatedText text="Ask AI" /></span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowAIAssistant(!showAIAssistant)
                      if (!showAIAssistant && aiRecommendations.length === 0) {
                        getAIRecommendations()
                      }
                    }}
                    className="flex items-center justify-center space-x-2 bg-purple-100 text-purple-700 px-6 py-3 rounded-xl hover:bg-purple-200"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span><TranslatedText text="Recommendations" /></span>
                  </button>
                </div>
              </div>
            )}

            {/* Trust Badges */}            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span><TranslatedText text="Secure payments" /></span>
              </div>
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <span><TranslatedText text="Fast delivery" /></span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-600" />
                <span><TranslatedText text="Quality assured" /></span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Assistant Panel */}
        {showAIAssistant && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h3 className="text-2xl font-bold text-gray-800">AI Product Assistant</h3>
            </div>

            {aiLoading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-6">
                    <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                    <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : aiRecommendations.length > 0 ? (
              <div className="space-y-4">
                {aiRecommendations.map((rec, index) => (
                  <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-800">{rec.title}</h4>
                      <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                        {(rec.confidence * 100).toFixed(0)}% confident
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{rec.description}</p>
                    <p className="text-sm text-gray-500 italic">{rec.reasoning}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">Click "Get AI Recommendations" to see personalized insights about this product.</p>
            )}
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-8">Related Products</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
                <Link
                  key={relProduct.id}
                  href={`/products/${relProduct.id}`}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
                >
                  <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100">
                    {relProduct.images.length > 0 ? (
                      <img
                        src={relProduct.images[0]}
                        alt={relProduct.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-orange-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                      {relProduct.title}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-orange-600">
                        ₹{relProduct.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500">{relProduct.seller.name}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Product AI Chat Modal */}
        {product && (
          <ProductAIChat
            product={product}
            isOpen={showProductAIChat}
            onClose={() => setShowProductAIChat(false)}
          />
        )}
      </div>
    </div>
  )
}
