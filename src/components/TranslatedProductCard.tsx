'use client'

import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/contexts/TranslationContext'
import { ShoppingBag, MapPin } from 'lucide-react'
import Link from 'next/link'

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

interface TranslatedProductCardProps {
  product: Product
}

export function TranslatedProductCard({ product }: TranslatedProductCardProps) {
  const { translate, currentLanguage } = useTranslation()
  const [translatedProduct, setTranslatedProduct] = useState({
    title: product.title,
    description: product.description,
    tagline: product.tagline || ''
  })

  useEffect(() => {
    const translateProductData = async () => {
      if (currentLanguage === 'en') {
        setTranslatedProduct({
          title: product.title,
          description: product.description,
          tagline: product.tagline || ''
        })
        return
      }

      try {
        const [translatedTitle, translatedDescription, translatedTagline] = await Promise.all([
          translate(product.title),
          translate(product.description),
          product.tagline ? translate(product.tagline) : Promise.resolve('')
        ])

        setTranslatedProduct({
          title: translatedTitle,
          description: translatedDescription,
          tagline: translatedTagline
        })
      } catch (error) {
        console.error('Error translating product data:', error)
        // Fallback to original data
        setTranslatedProduct({
          title: product.title,
          description: product.description,
          tagline: product.tagline || ''
        })
      }
    }

    translateProductData()
  }, [product, currentLanguage, translate])

  return (
    <Link
      href={`/products/${product.id}`}
      className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all transform hover:scale-105"
    >
      <div className="relative h-48 bg-gradient-to-br from-orange-100 to-red-100">
        {product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={translatedProduct.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-16 h-16 text-orange-400" />
          </div>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold">
              {currentLanguage === 'en' ? 'Out of Stock' : 'स्टॉक में नहीं'}
            </span>
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
          {translatedProduct.title}
        </h3>
        {translatedProduct.tagline && (
          <p className="text-sm text-orange-600 mb-2">{translatedProduct.tagline}</p>
        )}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {translatedProduct.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-orange-600">
            ₹{product.price.toLocaleString()}
          </span>
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{product.seller.name}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
