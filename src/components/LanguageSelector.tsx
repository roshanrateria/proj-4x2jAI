'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from '@/contexts/TranslationContext'
import { Globe, ChevronDown, Check } from 'lucide-react'

export function LanguageSelector() {
  const { currentLanguage, setLanguage, availableLanguages } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLanguageChange = (languageCode: string) => {
    setLanguage(languageCode)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-orange-200 hover:border-orange-300 transition-colors"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4 text-orange-600" />
        <span className="text-sm font-medium text-gray-700">
          {currentLang?.flag} {currentLang?.code.toUpperCase()}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
          <div className="py-2">
            {availableLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors flex items-center justify-between ${
                  currentLanguage === language.code ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{language.flag}</span>
                  <div>
                    <div className="font-medium">{language.name}</div>
                    <div className="text-sm text-gray-500">{language.nativeName}</div>
                  </div>
                </div>
                {currentLanguage === language.code && (
                  <Check className="w-4 h-4 text-orange-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
