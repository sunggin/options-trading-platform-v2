'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Users, TrendingUp, MessageSquare, Share2, ThumbsUp, Eye, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SocialPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-6">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-6">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Link 
              href="/"
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Users className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Social Trading</h1>
            </div>
          </div>
          <p className="text-gray-600">
            Connect with other traders, share strategies, and learn from the community.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-700">Community</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">1,234</p>
            <p className="text-xs text-gray-500">Active Traders</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-700">Top Performers</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">156</p>
            <p className="text-xs text-gray-500">This Month</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-700">Discussions</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">892</p>
            <p className="text-xs text-gray-500">Active Topics</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Share2 className="w-5 h-5 text-orange-600" />
              <h3 className="text-sm font-semibold text-gray-700">Shared Trades</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">3,421</p>
            <p className="text-xs text-gray-500">Total Shares</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feed Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Coming Soon Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Social Features Coming Soon!
              </h2>
              <p className="text-gray-600 mb-6">
                We're building an amazing social trading platform where you can:
              </p>
              <div className="space-y-3 max-w-md mx-auto text-left">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <Share2 className="w-3 h-3 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Share Your Trades</h3>
                    <p className="text-xs text-gray-600">Show off your winning strategies with the community</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <Eye className="w-3 h-3 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Follow Top Traders</h3>
                    <p className="text-xs text-gray-600">Learn from the best performers in the community</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                    <MessageSquare className="w-3 h-3 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Join Discussions</h3>
                    <p className="text-xs text-gray-600">Participate in strategy discussions and market analysis</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                    <TrendingUp className="w-3 h-3 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">View Leaderboards</h3>
                    <p className="text-xs text-gray-600">See who's making the best trades this month</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sample Post Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  JD
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">John Doe</h3>
                  <p className="text-xs text-gray-500">@johntrader • 2 hours ago</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                Just closed a profitable TSLA covered call! +$450 in 3 days. The key was timing the entry after the morning dip. 
                📈 #OptionsTrading #CoveredCall
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-100 pt-3">
                <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                  <ThumbsUp className="w-4 h-4" />
                  <span>24</span>
                </button>
                <button className="flex items-center gap-1 hover:text-purple-600 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  <span>8</span>
                </button>
                <button className="flex items-center gap-1 hover:text-green-600 transition-colors">
                  <Share2 className="w-4 h-4" />
                  <span>3</span>
                </button>
              </div>
              <div className="mt-3 text-xs text-gray-400 italic">
                * Sample post - Social features coming soon
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Your Profile Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {user?.email?.split('@')[0] || 'User'}
                  </h3>
                  <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Followers</span>
                  <span className="font-semibold">Coming Soon</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Following</span>
                  <span className="font-semibold">Coming Soon</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Posts</span>
                  <span className="font-semibold">Coming Soon</span>
                </div>
              </div>
            </div>

            {/* Trending Topics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Trending Topics</h2>
              <div className="space-y-3">
                <div className="hover:bg-gray-50 p-2 rounded cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">#CoveredCalls</span>
                    <span className="text-xs text-gray-500">245 posts</span>
                  </div>
                </div>
                <div className="hover:bg-gray-50 p-2 rounded cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">#WheelStrategy</span>
                    <span className="text-xs text-gray-500">189 posts</span>
                  </div>
                </div>
                <div className="hover:bg-gray-50 p-2 rounded cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">#PMCC</span>
                    <span className="text-xs text-gray-500">156 posts</span>
                  </div>
                </div>
                <div className="hover:bg-gray-50 p-2 rounded cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">#EarningsPlays</span>
                    <span className="text-xs text-gray-500">134 posts</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 italic mt-3">* Coming soon</p>
            </div>

            {/* Suggested Users */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Suggested Traders</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                    SM
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">Sarah Miller</h3>
                    <p className="text-xs text-gray-500">+45% this year</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                    MJ
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">Mike Johnson</h3>
                    <p className="text-xs text-gray-500">+38% this year</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                    LB
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">Lisa Brown</h3>
                    <p className="text-xs text-gray-500">+32% this year</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 italic mt-3">* Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

