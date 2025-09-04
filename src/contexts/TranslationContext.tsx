'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { BhashiniService } from '@/lib/bhashini'

interface TranslationContextType {
  currentLanguage: string
  setLanguage: (language: string) => void
  translate: (text: string, targetLanguage?: string) => Promise<string>
  translateSync: (text: string) => string
  availableLanguages: Language[]
  isTranslating: boolean
  translationCache: Map<string, string>
}

interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
}

const availableLanguages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
]

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

interface TranslationProviderProps {
  children: ReactNode
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState('en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationCache] = useState(new Map<string, string>())

  useEffect(() => {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('kalakriti-language')
    if (savedLanguage && availableLanguages.find(lang => lang.code === savedLanguage)) {
      setCurrentLanguage(savedLanguage)
    }
  }, [])

  const setLanguage = (language: string) => {
    setCurrentLanguage(language)
    localStorage.setItem('kalakriti-language', language)
    
    // Clear cache when language changes to force retranslation
    translationCache.clear()
  }

  const generateCacheKey = (text: string, targetLanguage: string) => {
    return `${text}|${targetLanguage}`
  }

  const translate = async (text: string, targetLanguage?: string): Promise<string> => {
    const target = targetLanguage || currentLanguage
    
    // Don't translate if target is English or same as source
    if (target === 'en' || !text.trim()) {
      return text
    }

    const cacheKey = generateCacheKey(text, target)
    
    // Check cache first
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!
    }

    try {
      setIsTranslating(true)
      const translatedText = await BhashiniService.translateText(text, 'en', target)
      
      // Cache the translation
      translationCache.set(cacheKey, translatedText)
      
      return translatedText
    } catch (error) {
      console.error('Translation error:', error)
      return text // Return original text on error
    } finally {
      setIsTranslating(false)
    }
  }

  const translateSync = (text: string): string => {
    if (currentLanguage === 'en' || !text.trim()) {
      return text
    }

    const cacheKey = generateCacheKey(text, currentLanguage)
    return translationCache.get(cacheKey) || text
  }

  const value: TranslationContextType = {
    currentLanguage,
    setLanguage,
    translate,
    translateSync,
    availableLanguages,
    isTranslating,
    translationCache
  }

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}
