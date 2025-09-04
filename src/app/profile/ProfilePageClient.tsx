'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { 
  User, Mail, Phone, MapPin, Save, Edit, 
  Shield, CreditCard, Bell, Globe, Key
} from 'lucide-react'
import { toast } from '@/components/ui/Toaster'
import LocationPicker from '@/components/LocationPicker'
import { TranslatedText } from '@/components/TranslatedText'
import { useTranslation } from '@/contexts/TranslationContext'

export default function ProfilePageClient() {
  const { user, token, updateUser } = useAuth()
  const { translate } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    upiId: '',
    latitude: 0,
    longitude: 0
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        upiId: user.upiId || '',
        latitude: user.latitude || 0,
        longitude: user.longitude || 0
      })
    }
  }, [user])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: address
    }))
    setShowLocationPicker(false)
  }

  const handleSave = async () => {
    if (!token) {
      toast({
        title: 'Authentication Error',
        description: 'Please log in to update your profile',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const updatedUser = await response.json()
        updateUser(updatedUser)
        setEditing(false)
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
          variant: 'default'
        })
      } else {
        const errorData = await response.json()
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to update profile',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view your profile</h1>
          <a href="/login" className="text-blue-600 hover:underline">Go to Login</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  <TranslatedText text="My Profile" />
                </h1>
                <p className="text-gray-600">
                  <TranslatedText text="Manage your personal information and preferences" />
                </p>
              </div>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>
                <TranslatedText text={editing ? "Cancel" : "Edit Profile"} />
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-orange-600" />
                <TranslatedText text="Personal Information" />
              </h2>

              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <TranslatedText text="Full Name" />
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!editing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <TranslatedText text="Email Address" />
                  </label>
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!editing}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <TranslatedText text="Phone Number" />
                  </label>
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!editing}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <TranslatedText text="Address" />
                  </label>
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-2" />
                    <div className="flex-1">
                      <textarea
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        disabled={!editing}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                      />
                      {editing && (
                        <button
                          onClick={() => setShowLocationPicker(true)}
                          className="mt-2 text-sm text-orange-600 hover:text-orange-700 flex items-center"
                        >
                          <MapPin className="w-4 h-4 mr-1" />
                          <TranslatedText text="Pick location on map" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* UPI ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <TranslatedText text="UPI ID" />
                  </label>
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                      type="text"
                      value={formData.upiId}
                      onChange={(e) => handleInputChange('upiId', e.target.value)}
                      disabled={!editing}
                      placeholder="your-upi@bank"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    <TranslatedText text="Required for receiving payments as a seller" />
                  </p>
                </div>

                {/* Coordinates (readonly) */}
                {(formData.latitude || formData.longitude) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <TranslatedText text="Latitude" />
                      </label>
                      <input
                        type="text"
                        value={formData.latitude.toFixed(6)}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <TranslatedText text="Longitude" />
                      </label>
                      <input
                        type="text"
                        value={formData.longitude.toFixed(6)}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>
                  </div>
                )}

                {/* Save Button */}
                {editing && (
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex items-center space-x-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      <span>
                        <TranslatedText text={loading ? "Saving..." : "Save Changes"} />
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Security */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-green-600" />
                <TranslatedText text="Security" />
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    <TranslatedText text="Password" />
                  </span>
                  <button className="text-sm text-orange-600 hover:text-orange-700">
                    <TranslatedText text="Change" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    <TranslatedText text="Two-Factor Auth" />
                  </span>
                  <button className="text-sm text-orange-600 hover:text-orange-700">
                    <TranslatedText text="Enable" />
                  </button>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-blue-600" />
                <TranslatedText text="Preferences" />
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    <TranslatedText text="Email Notifications" />
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    <TranslatedText text="SMS Notifications" />
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Language Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-purple-600" />
                <TranslatedText text="Language" />
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <TranslatedText text="Choose your preferred language for the interface" />
                </p>
                {/* Language selector will be rendered here */}
              </div>
            </div>

            {/* Delete Account */}
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
              <h3 className="text-lg font-semibold mb-2 text-red-600">
                <TranslatedText text="Danger Zone" />
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                <TranslatedText text="Once you delete your account, there is no going back." />
              </p>
              <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                <TranslatedText text="Delete Account" />
              </button>
            </div>
          </div>
        </div>

        {/* Location Picker Modal */}
        {showLocationPicker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  <TranslatedText text="Select Your Location" />
                </h3>
                <button
                  onClick={() => setShowLocationPicker(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                initialLocation={
                  formData.latitude && formData.longitude
                    ? { lat: formData.latitude, lng: formData.longitude }
                    : undefined
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
