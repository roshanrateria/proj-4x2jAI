'use client'

import React from 'react'
import { useTranslation } from '@/contexts/TranslationContext'
import { Globe } from 'lucide-react'

export function TranslationLoadingIndicator() {
  const { isTranslating } = useTranslation()

  if (!isTranslating) return null

  return (
    <div className="fixed top-20 right-4 z-50 bg-white/90 backdrop-blur-sm border border-orange-200 rounded-lg px-3 py-2 shadow-lg">
      <div className="flex items-center space-x-2">
        <Globe className="w-4 h-4 text-orange-600 animate-spin" />
        <span className="text-sm text-gray-700">Translating...</span>
      </div>
    </div>
  )
}
