'use client'

import React, { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

let toastCounter = 0
const toasts: Toast[] = []
const listeners: ((toasts: Toast[]) => void)[] = []

export const toast = {
  success: (message: string) => {
    addToast(message, 'success')
  },
  error: (message: string) => {
    addToast(message, 'error')
  },
  info: (message: string) => {
    addToast(message, 'info')
  }
}

function addToast(message: string, type: 'success' | 'error' | 'info') {
  const id = (++toastCounter).toString()
  const newToast = { id, message, type }
  toasts.push(newToast)
  
  listeners.forEach(listener => listener([...toasts]))
  
  setTimeout(() => {
    removeToast(id)
  }, 5000)
}

function removeToast(id: string) {
  const index = toasts.findIndex(toast => toast.id === id)
  if (index > -1) {
    toasts.splice(index, 1)
    listeners.forEach(listener => listener([...toasts]))
  }
}

export function Toaster() {
  const [toastList, setToastList] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setToastList(newToasts)
    }
    
    listeners.push(listener)
    
    return () => {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  if (toastList.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toastList.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center p-4 rounded-lg shadow-lg min-w-80 max-w-md
            ${toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : ''}
            ${toast.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : ''}
            ${toast.type === 'info' ? 'bg-blue-50 border border-blue-200 text-blue-800' : ''}
            animate-in slide-in-from-right
          `}
        >
          <div className="flex-shrink-0 mr-3">
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
          </div>
          
          <div className="flex-1">
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
          
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
