'use client'

import React, { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/Toaster'
import { TranslatedText } from '@/components/TranslatedText'
import { useTranslation } from '@/contexts/TranslationContext'

export default function LoginPage() {
  const { login } = useAuth()
  const { translate } = useTranslation()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.email || !formData.password) {
      toast.error(await translate('Please fill in all fields'))
      setLoading(false)
      return
    }

    try {
      const success = await login(formData.email, formData.password)
      if (success) {
        toast.success(await translate('Welcome back!'))
        router.push('/')
      } else {
        toast.error(await translate('Invalid email or password'))
      }
    } catch (error) {
      toast.error(await translate('An error occurred. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
      <div className="max-w-md mx-auto w-full">        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            <TranslatedText text="Welcome Back" />
          </h1>
          <p className="text-gray-600">
            <TranslatedText text="Sign in to your Kalakriti account" />
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                <TranslatedText text="Email Address" />
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                <TranslatedText text="Password" />
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-xl hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-semibold"
            >
              {loading ? <TranslatedText text="Signing in..." /> : <TranslatedText text="Sign In" />}
            </button>
          </form>          <div className="text-center mt-6">
            <p className="text-gray-600">
              <TranslatedText text="Don't have an account?" />{' '}
              <Link 
                href="/signup" 
                className="text-orange-600 hover:text-orange-700 font-semibold"
              >
                <TranslatedText text="Sign up" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
