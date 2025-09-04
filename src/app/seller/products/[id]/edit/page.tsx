'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useTranslation } from '@/contexts/TranslationContext'
import { TranslatedText } from '@/components/TranslatedText'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Upload, X, Sparkles, Loader2, Plus, 
  Tag, Package, DollarSign, FileText, Lightbulb, Save
} from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  title: string
  description: string
  tagline?: string
  tags: string[]
  price: number
  images: string[]
  inStock: boolean
  stockQuantity: number
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
  updatedAt: string
}

interface AISuggestion {
  title?: { value: string; reason: string }
  tagline?: { value: string; reason: string }
  description?: { value: string; reason: string }
  tags?: { value: string[]; reason: string }
  priceRange?: { value: { min: number; max: number }; analysis: string; reason: string }
  analysis?: any
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, token } = useAuth()
  const { translate } = useTranslation()
  const router = useRouter()
  
  const [productId, setProductId] = useState<string | null>(null)
  const [product, setProduct] = useState<Product | null>(null);  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tagline: '',
    price: '',
    images: [] as string[],
    tags: [] as string[],
    inStock: true,
    stockQuantity: 0,
    // Discount & Pricing fields 💰
    originalPrice: '',
    discountPercent: '',
    discountAmount: '',
    discountStart: '',
    discountEnd: '',
    isFeatured: false,
    // Artisan-specific fields 🎨
    material: '',
    technique: '',
    artForm: '',
    origin: '',
    length: '',
    width: '',
    height: '',
    weight: '',
    artisanStory: '',
    culturalSignificance: '',
    timeToCreate: '',
    isCustomizable: false,
    careInstructions: '',
    authenticityMark: ''
  })
  
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion>({})
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    async function initializeParams() {
      const resolvedParams = await params
      setProductId(resolvedParams.id)
    }
    initializeParams()
  }, [params])

  useEffect(() => {
    if (user?.role !== 'SELLER') {
      router.push('/login')
      return
    }
    if (productId) {
      fetchProduct()
    }
  }, [user, router, productId])

  const fetchProduct = async () => {
    if (!productId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/seller/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProduct(data);        setFormData({
          title: data.title,
          description: data.description,
          tagline: data.tagline || '',
          price: data.price.toString(),
          images: data.images,
          tags: data.tags,
          inStock: data.inStock,
          stockQuantity: data.stockQuantity || 0,
          // Discount fields
          originalPrice: data.originalPrice ? data.originalPrice.toString() : '',
          discountPercent: data.discountPercent ? data.discountPercent.toString() : '',
          discountAmount: data.discountAmount ? data.discountAmount.toString() : '',
          discountStart: data.discountStart ? data.discountStart.split('T')[0] : '',
          discountEnd: data.discountEnd ? data.discountEnd.split('T')[0] : '',
          isFeatured: data.isFeatured || false,
          // Artisan fields
          material: data.material || '',
          technique: data.technique || '',
          artForm: data.artForm || '',
          origin: data.origin || '',
          length: data.length || '',
          width: data.width || '',
          height: data.height || '',
          weight: data.weight || '',
          artisanStory: data.artisanStory || '',
          culturalSignificance: data.culturalSignificance || '',
          timeToCreate: data.timeToCreate || '',
          isCustomizable: data.isCustomizable || false,
          careInstructions: data.careInstructions || '',
          authenticityMark: data.authenticityMark || ''
        })
      } else if (response.status === 404) {
        alert('Product not found')
        router.push('/seller/products')
      } else {
        alert('Failed to load product')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      alert('Error loading product')
    } finally {
      setLoading(false)
    }
  }
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Auto-calculate discounted price when originalPrice or discountPercent changes
      if (field === 'originalPrice' || field === 'discountPercent') {
        const originalPrice = parseFloat(field === 'originalPrice' ? value : newData.originalPrice) || 0
        const discountPercent = parseFloat(field === 'discountPercent' ? value : newData.discountPercent) || 0
        
        if (originalPrice > 0 && discountPercent > 0 && discountPercent <= 100) {
          const discountAmount = (originalPrice * discountPercent) / 100
          const finalPrice = originalPrice - discountAmount
          newData.price = finalPrice.toFixed(2)
          newData.discountAmount = discountAmount.toFixed(2)
        }
      }
      
      return newData
    })
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return

    setImageUploading(true)
    const newImages: string[] = []

    try {
      for (let i = 0; i < Math.min(files.length, 5 - formData.images.length); i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image file`)
          continue
        }

        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is too large (max 5MB)`)
          continue
        }

        const reader = new FileReader()
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })

        const base64 = await base64Promise
        newImages.push(base64)
      }

      if (newImages.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...newImages].slice(0, 5)
        }))
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Error uploading images')
    } finally {
      setImageUploading(false)
    }
  }

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }))
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!productId) {
      alert('Product ID not available')
      return
    }
    
    if (!formData.title || !formData.description || !formData.price) {
      alert('Please fill in all required fields')
      return
    }

    if (formData.stockQuantity < 0) {
      alert('Stock quantity cannot be negative')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/seller/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
          discountPercent: formData.discountPercent ? parseFloat(formData.discountPercent) : null,
          discountAmount: formData.discountAmount ? parseFloat(formData.discountAmount) : null,
          discountStart: formData.discountStart || null,
          discountEnd: formData.discountEnd || null,
          isFeatured: formData.isFeatured,
          inStock: formData.stockQuantity > 0 ? formData.inStock : false
        })
      })

      if (response.ok) {
        alert('Product updated successfully!')
        router.push('/seller/products')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update product')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Error updating product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Product Not Found</h2>
          <Link
            href="/seller/products"
            className="text-orange-600 hover:text-orange-700"
          >
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link 
              href="/seller/products" 
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <TranslatedText text="Back to Products" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">
              <TranslatedText text="Edit Product" />
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <Package className="w-5 h-5 mr-2 text-orange-500" />
              <TranslatedText text="Basic Information" />
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TranslatedText text="Product Title" /> *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter product title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TranslatedText text="Tagline" />
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Catchy tagline for your product"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Detailed product description"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => handleInputChange('stockQuantity', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available units in stock
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <Upload className="w-5 h-5 mr-2 text-orange-500" />
              Product Images ({formData.images.length}/5)
            </h2>

            {/* Image Preview */}
            {formData.images.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Current Images:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-1 left-1 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                          Main
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add More Images */}
            {formData.images.length < 5 && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Add more images</p>
                <p className="text-sm text-gray-500 mb-4">Max {5 - formData.images.length} more images</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-flex items-center px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer"
                >
                  {imageUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Images
                    </>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-orange-500" />
              Tags
            </h2>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-orange-600 hover:text-orange-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Add a tag"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4" />                </button>
              </div>
            </div>          </div>

          {/* Discount & Pricing Management 💰 */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border border-green-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <span className="w-6 h-6 mr-2 text-2xl">💰</span>
              Discount & Pricing Management
              <span className="ml-2 text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">Boost Sales!</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Original Price (₹)
                </label>
                <input
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Original price before discount"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">Set this to enable discount display</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Percentage (%)
                </label>
                <input
                  type="number"
                  value={formData.discountPercent}
                  onChange={(e) => handleInputChange('discountPercent', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 20 for 20% off"
                  min="0"
                  max="99"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fixed Discount Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.discountAmount}
                  onChange={(e) => handleInputChange('discountAmount', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Fixed amount off"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">Alternative to percentage discount</p>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">⭐ Featured Product</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Start Date
                </label>
                <input
                  type="date"
                  value={formData.discountStart}
                  onChange={(e) => handleInputChange('discountStart', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount End Date
                </label>
                <input
                  type="date"
                  value={formData.discountEnd}
                  onChange={(e) => handleInputChange('discountEnd', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Discount Preview */}
            {formData.originalPrice && formData.price && parseFloat(formData.originalPrice) > parseFloat(formData.price) && (
              <div className="mt-6 p-4 bg-white rounded-lg border border-green-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">💡 Discount Preview:</h3>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-500 line-through">₹{parseFloat(formData.originalPrice).toLocaleString()}</span>
                  <span className="text-green-600 font-bold text-lg">₹{parseFloat(formData.price).toLocaleString()}</span>
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                    {Math.round(((parseFloat(formData.originalPrice) - parseFloat(formData.price)) / parseFloat(formData.originalPrice)) * 100)}% OFF
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Customers save ₹{(parseFloat(formData.originalPrice) - parseFloat(formData.price)).toLocaleString()}!
                </p>
              </div>
            )}
          </div>

          {/* Artisan Craft Details - Material & Technique 🎨 */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 border border-purple-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <span className="w-6 h-6 mr-2 text-2xl">🎨</span>
              Artisan Craft Details
              <span className="ml-2 text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded-full">Crafted with 💝</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Material
                </label>
                <select
                  value={formData.material}
                  onChange={(e) => handleInputChange('material', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select material</option>
                  <option value="Wood">Wood (Teak, Sandalwood, Rosewood)</option>
                  <option value="Clay">Clay & Terracotta</option>
                  <option value="Silk">Pure Silk</option>
                  <option value="Cotton">Organic Cotton</option>
                  <option value="Metal">Metal (Brass, Copper, Silver)</option>
                  <option value="Stone">Natural Stone</option>
                  <option value="Bamboo">Bamboo</option>
                  <option value="Paper">Handmade Paper</option>
                  <option value="Leather">Genuine Leather</option>
                  <option value="Glass">Hand-blown Glass</option>
                  <option value="Jute">Natural Jute</option>
                  <option value="Wool">Pure Wool</option>
                  <option value="Other">Other Natural Material</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crafting Technique
                </label>
                <select
                  value={formData.technique}
                  onChange={(e) => handleInputChange('technique', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select technique</option>
                  <option value="Hand-carved">Hand-carved</option>
                  <option value="Hand-woven">Hand-woven</option>
                  <option value="Hand-painted">Hand-painted</option>
                  <option value="Hand-embroidered">Hand-embroidered</option>
                  <option value="Wheel-thrown">Wheel-thrown Pottery</option>
                  <option value="Block-printed">Block-printed</option>
                  <option value="Hand-knotted">Hand-knotted</option>
                  <option value="Molded">Hand-molded</option>
                  <option value="Etched">Hand-etched</option>
                  <option value="Beaten">Hand-beaten Metal</option>
                  <option value="Inlay">Inlay Work</option>
                  <option value="Filigree">Filigree Work</option>
                  <option value="Other">Other Traditional Technique</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Traditional Art Form
                </label>
                <select
                  value={formData.artForm}
                  onChange={(e) => handleInputChange('artForm', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select art form</option>
                  <option value="Madhubani">Madhubani Painting</option>
                  <option value="Warli">Warli Tribal Art</option>
                  <option value="Kalamkari">Kalamkari</option>
                  <option value="Tanjore">Tanjore Painting</option>
                  <option value="Pattachitra">Pattachitra</option>
                  <option value="Blue Pottery">Blue Pottery</option>
                  <option value="Pashmina">Pashmina Weaving</option>
                  <option value="Ikat">Ikat Weaving</option>
                  <option value="Bandhani">Bandhani Tie-Dye</option>
                  <option value="Chikankari">Chikankari Embroidery</option>
                  <option value="Kantha">Kantha Stitching</option>
                  <option value="Dokra">Dokra Metal Craft</option>
                  <option value="Channapatna">Channapatna Toys</option>
                  <option value="Kondapalli">Kondapalli Toys</option>
                  <option value="Other">Other Traditional Art</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Place of Origin
                </label>
                <input
                  type="text"
                  value={formData.origin}
                  onChange={(e) => handleInputChange('origin', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Madhubani, Bihar or Kashmir, India"
                />
              </div>
            </div>
          </div>

          {/* Dimensions & Physical Properties 📏 */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-6 border border-blue-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <span className="w-6 h-6 mr-2 text-2xl">📏</span>
              Dimensions & Properties
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Length (cm)
                </label>
                <input
                  type="number"
                  value={formData.length}
                  onChange={(e) => handleInputChange('length', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width (cm)
                </label>
                <input
                  type="number"
                  value={formData.width}
                  onChange={(e) => handleInputChange('width', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (grams)
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  step="1"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Artisan Story & Heritage 💝 */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-6 border border-amber-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <span className="w-6 h-6 mr-2 text-2xl">💝</span>
              The Story Behind This Creation
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Artisan's Story
                </label>
                <textarea
                  value={formData.artisanStory}
                  onChange={(e) => handleInputChange('artisanStory', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Tell the story of the artisan who created this piece, their heritage, and the tradition they represent..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cultural Significance
                </label>
                <textarea
                  value={formData.culturalSignificance}
                  onChange={(e) => handleInputChange('culturalSignificance', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Describe the cultural, religious, or historical significance of this piece..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time to Create (days)
                  </label>
                  <input
                    type="number"
                    value={formData.timeToCreate}
                    onChange={(e) => handleInputChange('timeToCreate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center space-x-3 mt-6">
                    <input
                      type="checkbox"
                      checked={formData.isCustomizable}
                      onChange={(e) => handleInputChange('isCustomizable', e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-gray-700">Can be customized</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Care & Authenticity 🛡️ */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-lg p-6 border border-emerald-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <span className="w-6 h-6 mr-2 text-2xl">🛡️</span>
              Care Instructions & Authenticity
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Care Instructions
                </label>
                <textarea
                  value={formData.careInstructions}
                  onChange={(e) => handleInputChange('careInstructions', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="How should customers care for this product? Include cleaning, storage, and maintenance instructions..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Authenticity Mark / Certification
                </label>
                <input
                  type="text"
                  value={formData.authenticityMark}
                  onChange={(e) => handleInputChange('authenticityMark', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., GI Tag Certified, Handicrafts Board Seal, etc."
                />
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Availability</h2>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.inStock}
                  onChange={(e) => handleInputChange('inStock', e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-500"
                />
                <span className="text-gray-700">Product is available for sale</span>
              </label>
              
              {formData.stockQuantity === 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  ⚠️ Product will be marked as out of stock when quantity is 0
                </p>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 font-semibold flex items-center justify-center space-x-2"
            >              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>
                    <TranslatedText text="Saving..." />
                  </span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>
                    <TranslatedText text="Save Changes" />
                  </span>
                </>
              )}
            </button>
            
            <Link
              href="/seller/products"
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-center"
            >
              <TranslatedText text="Cancel" />
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
