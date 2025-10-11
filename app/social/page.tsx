'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Users, TrendingUp, MessageSquare, Share2, ThumbsUp, Eye, ArrowLeft, UserPlus, UserCheck, UserX, Clock } from 'lucide-react'
import Link from 'next/link'

interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

interface PlatformUser {
  user_id: string
  email: string
}

interface SharedTrade {
  id: string
  tradeId: string
  userId: string
  userEmail: string
  ticker: string
  account: string
  optionType: string
  contracts: number
  cost: number
  strikePrice: number
  expirationDate: string
  tradingDate: string
  status: string
  realizedPl?: number
  unrealizedPl?: number
  currentPrice?: number
  sharedAt: string
  sharedBy: string
}

export default function SocialPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [sharedTrades, setSharedTrades] = useState<SharedTrade[]>([])
  const [userCount, setUserCount] = useState<number>(0)
  const [friends, setFriends] = useState<Friendship[]>([])
  const [friendRequests, setFriendRequests] = useState<Friendship[]>([])
  const [sentRequests, setSentRequests] = useState<Friendship[]>([])
  const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>([])
  const [showUserList, setShowUserList] = useState(false)

  useEffect(() => {
    // Load shared trades from localStorage
    const loadSharedTrades = () => {
      try {
        const stored = localStorage.getItem('shared_trades')
        if (stored) {
          setSharedTrades(JSON.parse(stored))
        }
      } catch (error) {
        console.error('Error loading shared trades:', error)
      }
    }
    
    // Fetch real user count from database
    const fetchUserCount = async () => {
      try {
        const { count, error } = await supabase
          .from('trades')
          .select('user_id', { count: 'exact', head: true })
        
        if (!error && count !== null) {
          // Get unique user count by querying distinct user_ids
          const { data: uniqueUsers, error: usersError } = await supabase
            .from('trades')
            .select('user_id')
          
          if (!usersError && uniqueUsers) {
            const uniqueUserIds = new Set(uniqueUsers.map((t: any) => t.user_id))
            setUserCount(uniqueUserIds.size)
          }
        }
      } catch (error) {
        console.error('Error fetching user count:', error)
        // Set to 1 if error (at least the current user)
        setUserCount(1)
      }
    }
    
    // Fetch friendships
    const fetchFriendships = async () => {
      if (!user) return
      
      try {
        // Get accepted friends
        const { data: acceptedFriends, error: friendsError } = await supabase
          .from('friendships')
          .select('*')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq('status', 'accepted')
        
        if (!friendsError && acceptedFriends) {
          setFriends(acceptedFriends)
        }
        
        // Get incoming friend requests (where I'm the friend_id and status is pending)
        const { data: incoming, error: incomingError } = await supabase
          .from('friendships')
          .select('*')
          .eq('friend_id', user.id)
          .eq('status', 'pending')
        
        if (!incomingError && incoming) {
          setFriendRequests(incoming)
        }
        
        // Get sent friend requests (where I'm the user_id and status is pending)
        const { data: sent, error: sentError } = await supabase
          .from('friendships')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pending')
        
        if (!sentError && sent) {
          setSentRequests(sent)
        }
      } catch (error) {
        console.error('Error fetching friendships:', error)
      }
    }
    
    // Fetch platform users
    const fetchPlatformUsers = async () => {
      if (!user) return
      
      try {
        const { data: uniqueUsers, error } = await supabase
          .from('trades')
          .select('user_id')
        
        if (!error && uniqueUsers) {
          const userIds = uniqueUsers.map((t: any) => t.user_id) as string[]
          const uniqueUserIds = Array.from(new Set(userIds))
          // Filter out current user
          const otherUsers = uniqueUserIds.filter((id: string) => id !== user.id)
          
          // For simplicity, we'll use user IDs directly
          // In a real app, you'd fetch actual user profiles
          setPlatformUsers(otherUsers.map((id: string) => ({ user_id: id, email: 'User' })))
        }
      } catch (error) {
        console.error('Error fetching platform users:', error)
      }
    }
    
    loadSharedTrades()
    fetchUserCount()
    fetchFriendships()
    fetchPlatformUsers()
    
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [user])

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    return `${Math.floor(seconds / 86400)} days ago`
  }

  const getOptionTypeColor = (optionType: string) => {
    if (optionType === 'Call option') return 'bg-blue-100 text-blue-800'
    if (optionType === 'Put option') return 'bg-red-100 text-red-800'
    if (optionType === 'Covered call') return 'bg-yellow-100 text-yellow-800'
    if (optionType === 'Cash secured put') return 'bg-green-100 text-green-800'
    return 'bg-gray-100 text-gray-800'
  }

  // Friend management functions
  const sendFriendRequest = async (friendId: string) => {
    if (!user) return
    
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending'
        })
      
      if (error) {
        alert('Failed to send friend request: ' + error.message)
      } else {
        alert('Friend request sent!')
        // Refresh friendships
        window.location.reload()
      }
    } catch (error) {
      console.error('Error sending friend request:', error)
      alert('Failed to send friend request')
    }
  }

  const acceptFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId)
      
      if (error) {
        alert('Failed to accept request: ' + error.message)
      } else {
        alert('Friend request accepted!')
        window.location.reload()
      }
    } catch (error) {
      console.error('Error accepting friend request:', error)
      alert('Failed to accept friend request')
    }
  }

  const rejectFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)
      
      if (error) {
        alert('Failed to reject request: ' + error.message)
      } else {
        alert('Friend request rejected')
        window.location.reload()
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error)
      alert('Failed to reject friend request')
    }
  }

  const removeFriend = async (friendshipId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return
    
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)
      
      if (error) {
        alert('Failed to remove friend: ' + error.message)
      } else {
        alert('Friend removed')
        window.location.reload()
      }
    } catch (error) {
      console.error('Error removing friend:', error)
      alert('Failed to remove friend')
    }
  }

  // Check if user is a friend
  const isFriend = (userId: string) => {
    return friends.some(f => f.user_id === userId || f.friend_id === userId)
  }

  // Check if friend request already sent
  const hasSentRequest = (userId: string) => {
    return sentRequests.some(r => r.friend_id === userId)
  }

  // Check if received request from user
  const hasReceivedRequest = (userId: string) => {
    return friendRequests.some(r => r.user_id === userId)
  }

  // Get friend user IDs
  const getFriendIds = () => {
    if (!user) return []
    return friends.map(f => f.user_id === user.id ? f.friend_id : f.user_id)
  }

  // Filter shared trades to show only from friends
  const getVisibleTrades = () => {
    if (!user) return sharedTrades
    const friendIds = getFriendIds()
    // Show only trades shared by current user or friends
    return sharedTrades.filter(trade => {
      // Show own trades or trades from friends
      return trade.userId === user.id || friendIds.includes(trade.userId)
    })
  }

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
            <p className="text-2xl font-bold text-gray-900">
              {userCount > 0 ? userCount.toLocaleString() : '...'}
            </p>
            <p className="text-xs text-gray-500">
              {userCount === 1 ? 'Active Trader' : 'Active Traders'}
            </p>
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

            {/* Friend Management Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Friends</h2>
                  <p className="text-sm text-gray-600">
                    {friends.length} friend{friends.length !== 1 ? 's' : ''} • Only friends can see your shared trades
                  </p>
                </div>
                <button
                  onClick={() => setShowUserList(!showUserList)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Find Traders
                </button>
              </div>

              {/* Friend Requests */}
              {friendRequests.length > 0 && (
                <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    Friend Requests ({friendRequests.length})
                  </h3>
                  <div className="space-y-2">
                    {friendRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            U
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">User</p>
                            <p className="text-xs text-gray-500">Wants to be friends</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => acceptFriendRequest(request.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                          >
                            <UserCheck className="w-3 h-3" />
                            Accept
                          </button>
                          <button
                            onClick={() => rejectFriendRequest(request.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                          >
                            <UserX className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User List Modal */}
              {showUserList && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">All Platform Traders</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {platformUsers.map((platformUser) => (
                      <div key={platformUser.user_id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            T
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Trader</p>
                            <p className="text-xs text-gray-500">Active on platform</p>
                          </div>
                        </div>
                        {isFriend(platformUser.user_id) ? (
                          <span className="text-xs text-green-600 font-medium">✓ Friends</span>
                        ) : hasSentRequest(platformUser.user_id) ? (
                          <span className="text-xs text-gray-500">Request Sent</span>
                        ) : hasReceivedRequest(platformUser.user_id) ? (
                          <span className="text-xs text-yellow-600 font-medium">Requested You</span>
                        ) : (
                          <button
                            onClick={() => sendFriendRequest(platformUser.user_id)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                          >
                            <UserPlus className="w-3 h-3" />
                            Add Friend
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends List */}
              {friends.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Your Friends</h3>
                  <div className="space-y-2">
                    {friends.map((friendship) => (
                      <div key={friendship.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            F
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Friend</p>
                            <p className="text-xs text-gray-500">Connected trader</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFriend(friendship.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {friends.length === 0 && friendRequests.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-4">No friends yet. Start connecting with other traders!</p>
                  <button
                    onClick={() => setShowUserList(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Find Traders →
                  </button>
                </div>
              )}
            </div>

            {/* Shared Trades Feed */}
            {getVisibleTrades().length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Shared Trades Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Be the first to share your winning trades with the community!
                </p>
                <Link
                  href="/analysis"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Go to Analysis to Share Trades
                </Link>
              </div>
            ) : (
              getVisibleTrades().map((trade) => (
                <div key={trade.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {trade.sharedBy?.charAt(0).toUpperCase() || 'T'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{trade.sharedBy || 'Trader'}</h3>
                      <p className="text-xs text-gray-500">{trade.userEmail || ''} • {getTimeAgo(trade.sharedAt)}</p>
                    </div>
                  </div>

                  {/* Trade Summary */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-blue-600">${trade.ticker}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOptionTypeColor(trade.optionType)}`}>
                        {trade.optionType}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        trade.status === 'open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {trade.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Contracts:</span>{' '}
                        <span className="font-semibold">{trade.contracts}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Strike:</span>{' '}
                        <span className="font-semibold">{formatCurrency(trade.strikePrice)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Cost:</span>{' '}
                        <span className="font-semibold">{formatCurrency(trade.cost)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">
                          {trade.status === 'closed' ? 'Realized' : 'Unrealized'} P&L:
                        </span>{' '}
                        <span className={`font-semibold ${
                          (trade.realizedPl || trade.unrealizedPl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(trade.realizedPl || trade.unrealizedPl)}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-700">
                      {trade.status === 'closed' 
                        ? `Closed ${trade.optionType.toLowerCase()} on ${trade.ticker} for ${
                            (trade.realizedPl || 0) >= 0 ? 'a profit' : 'a loss'
                          } of ${formatCurrency(Math.abs(trade.realizedPl || 0))}! 📈`
                        : `Opened ${trade.optionType.toLowerCase()} on ${trade.ticker}. Currently ${
                            (trade.unrealizedPl || 0) >= 0 ? 'up' : 'down'
                          } ${formatCurrency(Math.abs(trade.unrealizedPl || 0))}. 📊`
                      }
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-100 pt-3">
                    <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                      <ThumbsUp className="w-4 h-4" />
                      <span>Like</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-purple-600 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      <span>Comment</span>
                    </button>
                    <Link 
                      href="/analysis"
                      className="flex items-center gap-1 hover:text-green-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </Link>
                  </div>
                </div>
              ))
            )}
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

