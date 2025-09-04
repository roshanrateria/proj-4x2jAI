'use client'

import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/contexts/TranslationContext'

interface TranslatedTextProps {
  text: string
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div'
  className?: string
  children?: never
  targetLanguage?: string
  fallback?: string
  asText?: boolean // When true, renders just text without wrapper element
}

export function TranslatedText({ 
  text, 
  as: Component = 'span', 
  className = '', 
  targetLanguage,
  fallback,
  asText = false
}: TranslatedTextProps) {
  const { translate, currentLanguage, translateSync } = useTranslation()
  const [translatedText, setTranslatedText] = useState(text)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const translateText = async () => {
      const target = targetLanguage || currentLanguage
      
      // If target is English, no translation needed
      if (target === 'en') {
        setTranslatedText(text)
        return
      }

      // Check if we have a cached translation
      const cachedTranslation = translateSync(text)
      if (cachedTranslation !== text) {
        setTranslatedText(cachedTranslation)
        return
      }

      // Only translate if not already translated and not English
      if (text && target !== 'en') {
        setIsLoading(true)
        try {
          const translated = await translate(text, target)
          setTranslatedText(translated)
        } catch (error) {
          console.error('Translation error:', error)
          setTranslatedText(fallback || text)
        } finally {
          setIsLoading(false)
        }
      }
    }

    translateText()
  }, [text, currentLanguage, targetLanguage, translate, translateSync, fallback])
  const displayText = isLoading ? (fallback || text) : translatedText

  // If asText is true, return just the text without any wrapper element
  if (asText) {
    return displayText
  }

  return (
    <Component className={className}>
      {displayText}
    </Component>
  )
}

// Hook for manual translation
export function useTextTranslation() {
  const { translate, currentLanguage, isTranslating } = useTranslation()
  
  const translateText = async (text: string, targetLanguage?: string) => {
    return await translate(text, targetLanguage || currentLanguage)
  }

  return {
    translateText,
    currentLanguage,
    isTranslating
  }
}
