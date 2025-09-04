'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Plus, Package, TrendingUp, Users, Edit, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/Toaster'

interface Product {
  id: string
  title: string
  description: string
  tagline?: string
  price: number
  images: string[]
  inStock: boolean
  stockQuantity: number
  tags: string[]
  createdAt: string
}

interface Order {
  id: string
  totalAmount: number
  status: string
  paymentStatus: string
  deliveryAddress: string
  createdAt: string
  buyer: {
    name: string
    email: string
    phone?: string
  }
  orderItems: {
    id: string
    quantity: number
    price: number
    product: {
      title: string
    }
  }[]
}

export default function SellerDashboard() {
  const { user, token } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('overview')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockProducts: 0
  })

  useEffect(() => {
    if (user?.role === 'SELLER') {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      
      let products: any[] = []
      let orders: any[] = []
      
      // Fetch products
      const productsResponse = await fetch('/api/seller/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        products = productsData.products || []
        setProducts(products)
      }

      // Fetch orders
      const ordersResponse = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        orders = ordersData.orders || []
        setOrders(orders)

        // Calculate stats
        const totalRevenue = orders
          .filter((order: Order) => order.paymentStatus === 'PAID')
          .reduce((sum: number, order: Order) => sum + order.totalAmount, 0)
          
        const pendingOrders = orders
          .filter((order: Order) => order.status === 'PENDING').length
          
        const lowStockProducts = products
          .filter((product: Product) => product.inStock && product.stockQuantity <= 5).length

        setStats({
          totalProducts: products.length,
          totalOrders: orders.length,
          totalRevenue,
          pendingOrders,
          lowStockProducts
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const toggleProductStock = async (productId: string, currentStock: boolean) => {
    try {
      const response = await fetch(`/api/seller/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inStock: !currentStock })
      })

      if (response.ok) {
        setProducts(prev => prev.map(product => 
          product.id === productId 
            ? { ...product, inStock: !currentStock }
            : product
        ))
        toast.success(`Product marked as ${!currentStock ? 'in stock' : 'out of stock'}`)
      } else {
        toast.error('Failed to update product stock')
      }
    } catch (error) {
      toast.error('Error updating product stock')
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const response = await fetch(`/api/seller/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setProducts(prev => prev.filter(product => product.id !== productId))
        toast.success('Product deleted successfully')
      } else {
        toast.error('Failed to delete product')
      }
    } catch (error) {
      toast.error('Error deleting product')
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status } : order
        ))
        toast.success('Order status updated')
      } else {
        toast.error('Failed to update order status')
      }
    } catch (error) {
      toast.error('Error updating order status')
    }
  }

  if (user?.role !== 'SELLER') {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">Access Restricted</h2>
          <p className="text-gray-500">Only sellers can access the dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-orange-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Seller Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.name}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>
              <Package className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className={`rounded-2xl shadow-lg p-6 ${
            stats.lowStockProducts > 0 ? 'bg-amber-50 border-2 border-amber-200' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Alert</p>
                <p className={`text-2xl font-bold ${
                  stats.lowStockProducts > 0 ? 'text-amber-600' : 'text-gray-900'
                }`}>
                  {stats.lowStockProducts}
                </p>
              </div>
              <Package className={`w-8 h-8 ${
                stats.lowStockProducts > 0 ? 'text-amber-600' : 'text-gray-400'
              }`} />
            </div>
            {stats.lowStockProducts > 0 && (
              <p className="text-xs text-amber-600 mt-2">
                Products with ≤5 items in stock
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-medium ${ 
                activeTab === 'overview'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-4 font-medium ${
                activeTab === 'products'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-4 font-medium ${
                activeTab === 'orders'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Orders
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h3>
                    <div className="space-y-3">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-800">Order #{order.id.slice(-8)}</p>
                            <p className="text-sm text-gray-600">{order.buyer.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-orange-600">₹{order.totalAmount.toLocaleString()}</p>
                            <p className={`text-sm ${
                              order.status === 'PENDING' ? 'text-yellow-600' :
                              order.status === 'CONFIRMED' ? 'text-blue-600' :
                              order.status === 'DELIVERED' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {order.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Products</h3>
                    <div className="space-y-3">
                      {products.slice(0, 5).map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-800">{product.title}</p>
                            <p className="text-sm text-gray-600">₹{product.price.toLocaleString()}</p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs ${
                            product.inStock 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Your Products</h3>
                  <Link
                    href="/seller/products/new"
                    className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-600"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 rounded-lg mb-4 overflow-hidden">
                        {product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-orange-400" />
                          </div>
                        )}
                      </div>

                      <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2">{product.title}</h4>
                      <p className="text-orange-600 font-bold mb-3">₹{product.price.toLocaleString()}</p>

                      {/* Stock Quantity */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Stock Quantity:</span>
                          <span className={`font-medium ${
                            product.stockQuantity <= 5 
                              ? product.stockQuantity === 0 
                                ? 'text-red-600' 
                                : 'text-amber-600'
                              : 'text-green-600'
                          }`}>
                            {product.stockQuantity} units
                          </span>
                        </div>
                        {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                          <p className="text-xs text-amber-600 mt-1">⚠️ Low stock!</p>
                        )}
                        {product.stockQuantity === 0 && (
                          <p className="text-xs text-red-600 mt-1">❌ Out of stock!</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-600">Stock Status</span>
                        <button
                          onClick={() => toggleProductStock(product.id, product.inStock)}
                          className="flex items-center space-x-1"
                        >
                          {product.inStock ? (
                            <ToggleRight className="w-6 h-6 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-gray-400" />
                          )}
                          <span className={`text-sm ${product.inStock ? 'text-green-600' : 'text-gray-400'}`}>
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </button>
                      </div>

                      <div className="flex space-x-2">
                        <Link
                          href={`/products/${product.id}`}
                          className="flex-1 flex items-center justify-center space-x-1 bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </Link>
                        <Link
                          href={`/seller/products/${product.id}/edit`}
                          className="flex-1 flex items-center justify-center space-x-1 bg-orange-100 text-orange-700 py-2 rounded-lg hover:bg-orange-200"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="flex items-center justify-center bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Your Orders</h3>
                
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-800">Order #{order.id.slice(-8)}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-lg font-bold text-orange-600">
                            ₹{order.totalAmount.toLocaleString()}
                          </span>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Customer Details</h5>
                          <p className="text-sm text-gray-600">Name: {order.buyer.name}</p>
                          <p className="text-sm text-gray-600">Email: {order.buyer.email}</p>
                          {order.buyer.phone && (
                            <p className="text-sm text-gray-600">Phone: {order.buyer.phone}</p>
                          )}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Delivery Address</h5>
                          <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Order Items</h5>
                        <div className="space-y-2">
                          {order.orderItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-sm">
                              <span>{item.product.title} x {item.quantity}</span>
                              <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
