'use client'

import React, { useState } from 'react'
import { useAuth } from './AuthProvider'
import { ShoppingCart, User, Menu, X, Search, MessageCircle, Heart } from 'lucide-react'
import Link from 'next/link'
import { LanguageSelector } from './LanguageSelector'
import { TranslatedText } from './TranslatedText'

export function Navbar() {
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-lg border-b border-orange-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <img 
              src="/icon.png" 
              alt="Kalakriti Logo" 
              className="w-8 h-8 md:w-10 md:h-10 object-contain"
            />
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Kalakriti
            </span>
          </Link>{/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user?.role === 'SELLER' ? (
              <>
                <Link 
                  href="/seller/products" 
                  className="text-gray-700 hover:text-orange-600 transition-colors"
                >
                  <TranslatedText text="My Products" />
                </Link>
                <Link 
                  href="/seller/products/new" 
                  className="text-gray-700 hover:text-orange-600 transition-colors"
                >
                  <TranslatedText text="Add Product" />
                </Link>
                <Link 
                  href="/seller/dashboard" 
                  className="text-gray-700 hover:text-orange-600 transition-colors"
                >
                  <TranslatedText text="Dashboard" />
                </Link>
              </>
            ) : (
              <Link 
                href="/products" 
                className="text-gray-700 hover:text-orange-600 transition-colors"
              >
                <TranslatedText text="Products" />
              </Link>
            )}
            
            {user ? (
              <>                {user.role === 'BUYER' && (
                  <>
                    <Link 
                      href="/cart" 
                      className="text-gray-700 hover:text-orange-600 transition-colors flex items-center space-x-1"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <TranslatedText text="Cart" as="span" />
                    </Link>
                    <Link 
                      href="/wishlist" 
                      className="text-gray-700 hover:text-orange-600 transition-colors flex items-center space-x-1"
                    >
                      <Heart className="w-5 h-5" />
                      <TranslatedText text="Wishlist" as="span" />
                    </Link>
                  </>
                )}

                <Link 
                  href="/chat" 
                  className="text-gray-700 hover:text-orange-600 transition-colors flex items-center space-x-1"
                >
                  <MessageCircle className="w-5 h-5" />
                  <TranslatedText text="AI Chat" as="span" />
                </Link>
                
                <div className="relative group">
                  <button className="flex items-center space-x-1 text-gray-700 hover:text-orange-600 transition-colors">
                    <User className="w-5 h-5" />
                    <span>{user.name}</span>
                  </button>
                  <div className="absolute right-0 w-48 mt-2 py-2 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"
                    >
                      <TranslatedText text="Profile" />
                    </Link>
                    <Link 
                      href="/orders" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"
                    >
                      <TranslatedText text={user.role === 'SELLER' ? 'Orders/Sales' : 'Orders'} />
                    </Link>
                    <button 
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"
                    >
                      <TranslatedText text="Logout" />
                    </button>
                  </div>
                </div>

                {/* Language Selector */}
                <LanguageSelector />
              </>            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/login" 
                  className="text-gray-700 hover:text-orange-600 transition-colors"
                >
                  <TranslatedText text="Login" />
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105"
                >
                  <TranslatedText text="Sign Up" />
                </Link>
                
                {/* Language Selector for non-authenticated users */}
                <LanguageSelector />
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-orange-600"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-orange-100">
            <div className="flex flex-col space-y-4">
              {user?.role === 'SELLER' ? (
                <>
                  <Link 
                    href="/seller/products" 
                    className="text-gray-700 hover:text-orange-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <TranslatedText text="My Products" />
                  </Link>
                  <Link 
                    href="/seller/products/new" 
                    className="text-gray-700 hover:text-orange-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <TranslatedText text="Add Product" />
                  </Link>
                  <Link 
                    href="/seller/dashboard" 
                    className="text-gray-700 hover:text-orange-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <TranslatedText text="Dashboard" />
                  </Link>
                </>
              ) : (
                <Link 
                  href="/products" 
                  className="text-gray-700 hover:text-orange-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <TranslatedText text="Products" />
                </Link>
              )}
              
              {user ? (
                <>
                  {user.role === 'BUYER' && (
                    <Link 
                      href="/cart" 
                      className="text-gray-700 hover:text-orange-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <TranslatedText text="Cart" />
                    </Link>
                  )}

                  <Link 
                    href="/chat" 
                    className="text-gray-700 hover:text-orange-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <TranslatedText text="AI Chat" />
                  </Link>
                  
                  <Link 
                    href="/profile" 
                    className="text-gray-700 hover:text-orange-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <TranslatedText text="Profile" />
                  </Link>
                  <Link 
                    href="/orders" 
                    className="text-gray-700 hover:text-orange-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <TranslatedText text={user.role === 'SELLER' ? 'Orders/Sales' : 'Orders'} />
                  </Link>
                  <button 
                    onClick={() => {
                      logout()
                      setIsMenuOpen(false)
                    }}
                    className="text-left text-gray-700 hover:text-orange-600 transition-colors"
                  >
                    <TranslatedText text="Logout" />
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="text-gray-700 hover:text-orange-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <TranslatedText text="Login" />
                  </Link>
                  <Link 
                    href="/signup" 
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <TranslatedText text="Sign Up" />
                  </Link>
                </>
              )}
              
              {/* Language Selector for mobile */}
              <div className="pt-4 border-t border-orange-100">
                <LanguageSelector />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
