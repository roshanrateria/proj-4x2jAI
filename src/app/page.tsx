'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Search, ShoppingBag, Users, Sparkles, MessageCircle, MapPin } from 'lucide-react'
import Link from 'next/link'
import { TranslatedText } from '@/components/TranslatedText'
import { TranslatedProductCard } from '@/components/TranslatedProductCard'
import { useTranslation } from '@/contexts/TranslationContext'

interface Product {
  id: string
  title: string
  description: string
  tagline?: string
  price: number
  images: string[]
  inStock: boolean
  seller: {
    id: string
    name: string
    address?: string
  }
}

export default function HomePage() {
  const { user } = useAuth()
  const { translate } = useTranslation()
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchPlaceholder, setSearchPlaceholder] = useState('Search for products, categories, or sellers...')

  useEffect(() => {
    fetchFeaturedProducts()
    // Translate search placeholder
    translate('Search for products, categories, or sellers...').then(setSearchPlaceholder)
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=8&inStock=true')
      const data = await response.json()
      if (response.ok) {
        setFeaturedProducts(data.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      if (typeof window !== 'undefined') {
        window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`
      }
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 to-red-600/10"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          {/* Logo in Hero */}
          <div className="flex justify-center mb-8">
            <img 
              src="/icon.png" 
              alt="Kalakriti Logo" 
              className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-lg"
            />
          </div>
          
          <TranslatedText 
            text="Welcome to Kalakriti"
            as="h1"
            className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6"
          />
          <TranslatedText 
            text="Discover amazing products from local sellers with AI-powered assistance and multilingual support"
            as="p"
            className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto"
          />

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border border-orange-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-lg"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all"
              >
                <TranslatedText text="Search" />
              </button>
            </div>
          </form>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Link 
              href="/products"
              className="group bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <ShoppingBag className="w-12 h-12 text-orange-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <TranslatedText 
                text="Browse Products"
                as="h3"
                className="text-xl font-semibold text-gray-800 mb-2"
              />
              <TranslatedText 
                text="Explore our wide range of products from local sellers"
                as="p"
                className="text-gray-600"
              />
            </Link>

            <Link 
              href="/chat"
              className="group bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <MessageCircle className="w-12 h-12 text-orange-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <TranslatedText 
                text="AI Shopping Assistant"
                as="h3"
                className="text-xl font-semibold text-gray-800 mb-2"
              />
              <TranslatedText 
                text="Get personalized recommendations from our AI chatbot"
                as="p"
                className="text-gray-600"
              />
            </Link>

            {user?.role === 'SELLER' ? (
              <Link 
                href="/seller/dashboard"
                className="group bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <Users className="w-12 h-12 text-orange-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <TranslatedText 
                  text="Seller Dashboard"
                  as="h3"
                  className="text-xl font-semibold text-gray-800 mb-2"
                />
                <TranslatedText 
                  text="Manage your products and orders"
                  as="p"
                  className="text-gray-600"
                />
              </Link>
            ) : (
              <Link 
                href="/signup"
                className="group bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <Sparkles className="w-12 h-12 text-orange-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <TranslatedText 
                  text="Start Selling"
                  as="h3"
                  className="text-xl font-semibold text-gray-800 mb-2"
                />
                <TranslatedText 
                  text="Join our marketplace and start selling your products"
                  as="p"
                  className="text-gray-600"
                />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <TranslatedText 
              text="Featured Products"
              as="h2"
              className="text-4xl font-bold text-gray-800 mb-4"
            />
            <TranslatedText 
              text="Discover the latest and greatest from our sellers"
              as="p"
              className="text-xl text-gray-600"
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
                  <div className="bg-gray-200 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-2/3 mb-4"></div>
                  <div className="bg-gray-200 h-6 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <TranslatedProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {featuredProducts.length === 0 && !loading && (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <TranslatedText 
                text="No products available"
                as="h3"
                className="text-xl font-semibold text-gray-600 mb-2"
              />
              <TranslatedText 
                text="Check back later for new products!"
                as="p"
                className="text-gray-500"
              />
            </div>
          )}

          <div className="text-center mt-12">
            <Link 
              href="/products"
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105"
            >
              <TranslatedText text="View All Products" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <TranslatedText 
              text="Why Choose Kalakriti?"
              as="h2"
              className="text-4xl font-bold text-gray-800 mb-4"
            />
            <TranslatedText 
              text="Experience the future of online shopping"
              as="p"
              className="text-xl text-gray-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <TranslatedText 
                text="AI-Powered Assistance"
                as="h3"
                className="text-xl font-semibold text-gray-800 mb-2"
              />
              <TranslatedText 
                text="Get personalized product recommendations and shopping help from our intelligent chatbot"
                as="p"
                className="text-gray-600"
              />
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <TranslatedText 
                text="Local Delivery"
                as="h3"
                className="text-xl font-semibold text-gray-800 mb-2"
              />
              <TranslatedText 
                text="Accurate delivery cost calculation based on real road distances using OSRM routing"
                as="p"
                className="text-gray-600"
              />
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <TranslatedText 
                text="Multilingual Support"
                as="h3"
                className="text-xl font-semibold text-gray-800 mb-2"
              />
              <TranslatedText 
                text="Shop in your preferred language with Bhashini-powered translation"
                as="p"
                className="text-gray-600"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
