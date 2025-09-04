'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useTranslation } from '@/contexts/TranslationContext'
import { TranslatedText } from '@/components/TranslatedText'
import { Plus, Edit, Trash2, Eye, Package, DollarSign, Calendar, Star } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  createdAt: string
  updatedAt: string
}

export default function SellerProductsPage() {
  const { user, token } = useAuth()
  const { translate } = useTranslation()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'SELLER') {
      router.push('/login')
      return
    }
    fetchProducts()
  }, [user, router])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/seller/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }      const data = await response.json()
      setProducts(data.products)
    } catch (error) {
      console.error('Error fetching products:', error)
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }
  const handleDeleteProduct = async (productId: string) => {
    const confirmMessage = await translate('Are you sure you want to delete this product?')
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch(`/api/seller/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete product')
      }

      setProducts(products.filter(p => p.id !== productId))
    } catch (error) {
      console.error('Error deleting product:', error)
      const errorMessage = await translate('Failed to delete product')
      alert(errorMessage)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6">
                  <div className="h-40 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-7xl mx-auto">        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              <TranslatedText text="My Products" />
            </h1>
            <p className="text-gray-600">
              <TranslatedText text="Manage your product listings" />
            </p>
          </div>
          <Link
            href="/seller/products/new"
            className="mt-4 sm:mt-0 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span>
              <TranslatedText text="Add New Product" />
            </span>
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Package className="w-10 h-10 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  <TranslatedText text="Total Products" />
                </p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Star className="w-10 h-10 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  <TranslatedText text="In Stock" />
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.inStock).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <DollarSign className="w-10 h-10 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  <TranslatedText text="Avg. Price" />
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.length > 0 
                    ? formatPrice(products.reduce((sum, p) => sum + p.price, 0) / products.length)
                    : '₹0'}
                </p>
              </div>
            </div>
          </div>
        </div>        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              <TranslatedText text="No products yet" />
            </h3>
            <p className="text-gray-600 mb-6">
              <TranslatedText text="Start selling by adding your first product" />
            </p>
            <Link
              href="/seller/products/new"
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 hover:from-orange-600 hover:to-red-600 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>
                <TranslatedText text="Add Your First Product" />
              </span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Product Image */}
                <div className="h-48 bg-gray-200 relative">
                  {product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-16 h-16" />
                    </div>
                  )}                  {!product.inStock && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
                      <TranslatedText text="Out of Stock" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.title}
                  </h3>
                  {product.tagline && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                      {product.tagline}
                    </p>
                  )}                  <p className="text-2xl font-bold text-orange-600 mb-3">
                    {formatPrice(product.price)}
                  </p>
                  
                  {/* Stock Info */}
                  <div className="flex items-center justify-between mb-3">                    <span className={`px-2 py-1 rounded-full text-xs ${
                      product.inStock 
                        ? product.stockQuantity <= 5
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.inStock 
                        ? <><TranslatedText text="Stock" />: {product.stockQuantity}</>
                        : <TranslatedText text="Out of Stock" />
                      }
                    </span>
                  </div>
                  
                  {/* Tags */}
                  {product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {product.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}                      {product.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{product.tags.length - 3} <TranslatedText text="more" />
                        </span>
                      )}
                    </div>
                  )}                  {/* Meta Info */}
                  <div className="flex items-center text-xs text-gray-500 mb-4">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>
                      <TranslatedText text="Created" /> {formatDate(product.createdAt)}
                    </span>
                  </div>                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Link
                      href={`/products/${product.id}`}
                      className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm text-center hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>
                        <TranslatedText text="View" />
                      </span>
                    </Link>
                    <button
                      onClick={() => router.push(`/seller/products/${product.id}/edit`)}
                      className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-200 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span>
                        <TranslatedText text="Edit" />
                      </span>
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded text-sm hover:bg-red-200 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>
                        <TranslatedText text="Delete" />
                      </span>
                    </button>
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
