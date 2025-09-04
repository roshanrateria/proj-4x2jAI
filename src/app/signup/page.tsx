'use client'

import React, { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Eye, EyeOff, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/Toaster'
import dynamic from 'next/dynamic'
import { TranslatedText } from '@/components/TranslatedText'
import { useTranslation } from '@/contexts/TranslationContext'

// Dynamically import map component to avoid SSR issues
const LocationPicker = dynamic(() => import('../../components/LocationPicker'), { 
  ssr: false,
  loading: () => <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center"><p className="text-gray-500">Loading map...</p></div>
})

export default function SignupPage() {
  const { signup } = useAuth()
  const { translate } = useTranslation()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'BUYER' as 'BUYER' | 'SELLER',
    phone: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
    upiId: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      toast.error(await translate('Please fill in all required fields'))
      setLoading(false)
      return
    }

    // Location is now required for all users (buyers and sellers)
    if (!formData.latitude || !formData.longitude) {
      toast.error(await translate('Please select your location on the map'))
      setLoading(false)
      return
    }

    if (formData.role === 'SELLER' && !formData.upiId) {
      toast.error(await translate('Sellers must provide UPI ID'))
      setLoading(false)
      return
    }

    try {
      const success = await signup(formData)
      if (success) {
        toast.success(await translate('Account created successfully!'))
        router.push('/')
      } else {
        toast.error(await translate('Failed to create account. Please try again.'))
      }
    } catch (error) {
      toast.error(await translate('An error occurred. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setFormData({
      ...formData,
      latitude: lat,
      longitude: lng,
      address: address
    })
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-br from-orange-50 to-white">
      <div className="max-w-2xl mx-auto">        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            <TranslatedText text="Join Kalakriti" />
          </h1>
          <p className="text-gray-600">
            <TranslatedText text="Create your account to start buying or selling" />
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <TranslatedText text="I want to:" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'BUYER' })}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    formData.role === 'BUYER'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="font-semibold">
                    <TranslatedText text="Buy Products" />
                  </div>
                  <div className="text-sm text-gray-600">
                    <TranslatedText text="Shop from local sellers" />
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'SELLER' })}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    formData.role === 'SELLER'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="font-semibold">
                    <TranslatedText text="Sell Products" />
                  </div>
                  <div className="text-sm text-gray-600">
                    <TranslatedText text="Start your business" />
                  </div>
                </button>
              </div>
            </div>            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  <TranslatedText text="Full Name" /> *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <TranslatedText text="Email Address" /> *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
            </div>            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  <TranslatedText text="Password" /> *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  <TranslatedText text="Phone Number" />
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Location Selection - Required for all users */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                <TranslatedText text="Your Location" /> * <span className="text-sm text-gray-500">(<TranslatedText text="for delivery calculations" />)</span>
              </label>
              <div className="space-y-4">
                <LocationPicker onLocationSelect={handleLocationSelect} />
                {formData.address && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      <TranslatedText text="Selected" />: {formData.address}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Seller-specific fields */}
            {formData.role === 'SELLER' && (
              <div>
                <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-2">
                  <TranslatedText text="UPI ID" /> * <span className="text-sm text-gray-500">(<TranslatedText text="for receiving payments" />)</span>
                </label>
                <input
                  id="upiId"
                  type="text"
                  required
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="yourname@paytm or yourname@gpay"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-xl hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-semibold"
            >
              {loading ? <TranslatedText text="Creating Account..." /> : <TranslatedText text="Create Account" />}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              <TranslatedText text="Already have an account?" />{' '}
              <Link 
                href="/login" 
                className="text-orange-600 hover:text-orange-700 font-semibold"
              >
                <TranslatedText text="Sign in" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
