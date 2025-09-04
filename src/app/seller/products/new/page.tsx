'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useTranslation } from '@/contexts/TranslationContext'
import { TranslatedText } from '@/components/TranslatedText'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Upload, X, Sparkles, Loader2, Plus, 
  Tag, Package, DollarSign, FileText, Lightbulb
} from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/Toaster'

interface AISuggestion {
  title?: {
    value: string
    reason: string
  }
  tagline?: {
    value: string
    reason: string
  }
  description?: {
    value: string
    reason: string
  }
  tags?: {
    value: string[]
    reason: string
  }
  category?: string
  priceRange?: {
    value: { min: number; max: number }
    analysis: string
    reason: string
  }
  analysis?: {
    images?: {
      status: string
      recommendations: string
    }
    overall?: {
      strengths?: string[]
      improvements?: string[]
      marketingTips?: string[]
    }
  }
}

export default function NewProductPage() {
  const { user, token } = useAuth()
  const { translate } = useTranslation()
  const router = useRouter()
    const [formData, setFormData] = useState({
    title: '',
    description: '',
    tagline: '',
    price: '',
    images: [] as string[],
    tags: [] as string[],
    inStock: true,
    stockQuantity: 0,
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
  const [loading, setLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion>({})
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)

  useEffect(() => {
    if (user?.role !== 'SELLER') {
      router.push('/login')
    }
  }, [user, router])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
      for (let i = 0; i < Math.min(files.length, 5); i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`)
          continue
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast.error(`${file.name} is too large (max 5MB)`)
          continue
        }

        // Convert to base64 for now (in production, upload to cloud storage)
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
          images: [...prev.images, ...newImages].slice(0, 5) // Max 5 images
        }))
        toast.success(`Added ${newImages.length} image(s)`)
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Error uploading images')
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    handleImageUpload(files)
  }
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const getAISuggestions = async () => {
    if (!formData.description && !formData.title) {
      const errorMsg = await translate('Please add a title or description first')
      toast.error(errorMsg)
      return
    }

    setAiLoading(true)
    try {
      const response = await fetch('/api/ai/product-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          tagline: formData.tagline,
          price: formData.price ? parseFloat(formData.price) : null,
          currentTags: formData.tags,
          images: formData.images,
          hasImages: formData.images.length > 0,
          imageCount: formData.images.length
        })
      })

      if (response.ok) {
        const suggestions = await response.json()
        setAiSuggestions(suggestions)
        setShowAISuggestions(true)
        const successMsg = await translate('AI suggestions generated successfully!')
        toast.success(successMsg)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to get AI suggestions')
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error)
      toast.error('Error getting AI suggestions')
    } finally {
      setAiLoading(false)
    }
  }

  const applySuggestion = (field: string, value: any) => {
    if (field === 'tags' && Array.isArray(value)) {
      setFormData(prev => ({
        ...prev,
        tags: [...new Set([...prev.tags, ...value])]
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    toast.success(`Applied AI suggestion for ${field}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description || !formData.price) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        })
      })

      if (response.ok) {
        toast.success('Product created successfully!')
        router.push('/seller/dashboard')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create product')
      }
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error('Error creating product')
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'SELLER') {
    return null
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link 
              href="/seller/dashboard" 
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <TranslatedText text="Back to Dashboard" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">
              <TranslatedText text="Add New Product" />
            </h1>
          </div>
          
          <button
            onClick={getAISuggestions}
            disabled={aiLoading}
            className="flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 disabled:opacity-50"
          >
            {aiLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>
              <TranslatedText text="Get AI Suggestions" />
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">              {/* Basic Information */}
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
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter product title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <TranslatedText text="Tagline" /> (<TranslatedText text="Optional" />)
                    </label>
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={(e) => handleInputChange('tagline', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Short catchy tagline"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <TranslatedText text="Description" /> *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Detailed product description"
                      required
                    />
                  </div>                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <TranslatedText text="Price" /> (₹) *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) => handleInputChange('price', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <TranslatedText text="Stock Quantity" /> *
                      </label>
                      <input
                        type="number"
                        value={formData.stockQuantity}
                        onChange={(e) => handleInputChange('stockQuantity', parseInt(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="0"
                        min="0"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        <TranslatedText text="How many units do you have in stock?" />
                      </p>
                    </div>
                  </div>
                </div>
              </div>              {/* Tags */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-orange-500" />
                  <TranslatedText text="Tags & Categories" />
                </h2>

                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Add tags (e.g., electronics, mobile, smartphone)"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 hover:text-orange-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>              {/* Images */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <Upload className="w-5 h-5 mr-2 text-orange-500" />
                  Product Images ({formData.images.length}/5)
                </h2>

                {/* Image Upload Area */}
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Upload product images</p>
                  <p className="text-sm text-gray-500 mb-4">Drag and drop or click to browse (Max 5 images, 5MB each)</p>
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
                    className="inline-flex items-center px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer disabled:opacity-50"
                  >
                    {imageUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Choose Files
                      </>
                    )}
                  </label>
                </div>

                {/* Image Preview */}
                {formData.images.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Preview Images:</h3>
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
                    <p className="text-xs text-gray-500 mt-2">
                      First image will be used as the main product image
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

              {/* Stock Status */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Availability</h2>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.inStock}
                    onChange={(e) => handleInputChange('inStock', e.target.checked)}
                    className="rounded text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-gray-700">Product is in stock</span>
                </label>
              </div>              {/* Submit Button */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 font-semibold"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>
                        <TranslatedText text="Creating Product..." />
                      </span>
                    </div>
                  ) : (
                    <TranslatedText text="Create Product" />
                  )}
                </button>
                  <Link
                  href="/seller/dashboard"
                  className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-center"
                >
                  <TranslatedText text="Cancel" />
                </Link>
              </div>
            </form>
          </div>

          {/* AI Suggestions Sidebar */}
          <div className="lg:col-span-1">
            {showAISuggestions && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 sticky top-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-purple-500" />
                    AI Suggestions
                  </h3>
                  <button
                    onClick={() => setShowAISuggestions(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>                <div className="space-y-4">
                  {aiSuggestions.title && (
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2">Suggested Title</h4>
                      <p className="text-sm text-gray-600 mb-2">{aiSuggestions.title.value}</p>
                      <p className="text-xs text-gray-500 mb-3 italic">{aiSuggestions.title.reason}</p>
                      <button
                        onClick={() => applySuggestion('title', aiSuggestions.title?.value || '')}
                        className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200"
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  {aiSuggestions.tagline && (
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2">Suggested Tagline</h4>
                      <p className="text-sm text-gray-600 mb-2">{aiSuggestions.tagline.value}</p>
                      <p className="text-xs text-gray-500 mb-3 italic">{aiSuggestions.tagline.reason}</p>
                      <button
                        onClick={() => applySuggestion('tagline', aiSuggestions.tagline?.value || '')}
                        className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200"
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  {aiSuggestions.description && (
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2">Enhanced Description</h4>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-3">{aiSuggestions.description.value}</p>
                      <p className="text-xs text-gray-500 mb-3 italic">{aiSuggestions.description.reason}</p>
                      <button
                        onClick={() => applySuggestion('description', aiSuggestions.description?.value || '')}
                        className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200"
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  {aiSuggestions.tags && aiSuggestions.tags.value?.length > 0 && (
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2">Suggested Tags</h4>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {aiSuggestions.tags.value.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mb-3 italic">{aiSuggestions.tags.reason}</p>
                      <button
                        onClick={() => applySuggestion('tags', aiSuggestions.tags?.value || [])}
                        className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200"
                      >
                        Add All
                      </button>
                    </div>
                  )}

                  {aiSuggestions.priceRange && (
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2">Price Analysis</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Suggested: ₹{aiSuggestions.priceRange.value.min.toLocaleString()} - ₹{aiSuggestions.priceRange.value.max.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">{aiSuggestions.priceRange.analysis}</p>
                      <p className="text-xs text-gray-500 mb-3 italic">{aiSuggestions.priceRange.reason}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => applySuggestion('price', aiSuggestions.priceRange?.value.min.toString() || '')}
                          className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200"
                        >
                          Use Min ₹{aiSuggestions.priceRange.value.min}
                        </button>                        <button
                          onClick={() => applySuggestion('price', Math.round(((aiSuggestions.priceRange?.value.min || 0) + (aiSuggestions.priceRange?.value.max || 0)) / 2).toString())}
                          className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200"
                        >
                          Use Avg ₹{Math.round((aiSuggestions.priceRange.value.min + aiSuggestions.priceRange.value.max) / 2)}
                        </button>
                      </div>
                    </div>
                  )}

                  {aiSuggestions.analysis && (
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-3">AI Analysis</h4>
                      
                      {/* Image Analysis */}
                      {aiSuggestions.analysis.images && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Images</h5>
                          <p className="text-xs text-gray-600 mb-1">{aiSuggestions.analysis.images.status}</p>
                          <p className="text-xs text-blue-600">{aiSuggestions.analysis.images.recommendations}</p>
                        </div>
                      )}                      {/* Strengths & Improvements */}
                      {aiSuggestions.analysis.overall && (
                        <div>
                          {aiSuggestions.analysis.overall.strengths && aiSuggestions.analysis.overall.strengths.length > 0 && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-green-700 mb-1">✅ Strengths</h5>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {aiSuggestions.analysis.overall.strengths.map((strength: string, index: number) => (
                                  <li key={index}>• {strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {aiSuggestions.analysis.overall.improvements && aiSuggestions.analysis.overall.improvements.length > 0 && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-orange-700 mb-1">🔧 Improvements</h5>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {aiSuggestions.analysis.overall.improvements.map((improvement: string, index: number) => (
                                  <li key={index}>• {improvement}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {aiSuggestions.analysis.overall.marketingTips && aiSuggestions.analysis.overall.marketingTips.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-purple-700 mb-1">💡 Marketing Tips</h5>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {aiSuggestions.analysis.overall.marketingTips.map((tip: string, index: number) => (
                                  <li key={index}>• {tip}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-blue-50 rounded-2xl p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 Tips for Better Listings</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Use clear, descriptive titles</li>
                <li>• Add multiple high-quality images</li>
                <li>• Include relevant tags for better discoverability</li>
                <li>• Write detailed descriptions</li>
                <li>• Price competitively</li>
                <li>• Keep stock status updated</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
