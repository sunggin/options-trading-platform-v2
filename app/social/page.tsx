'use client'

import { useState, useEffect } from 'react'
import { supabase, Trade } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Share2, TrendingUp, TrendingDown, Calendar, DollarSign, User, Eye } from 'lucide-react'
import { format } from 'date-fns'

interface SharedTrade extends Trade {
  username?: string
}

export default function SocialPage() {
  const { user } = useAuth()
  const [sharedTrades, setSharedTrades] = useState<SharedTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSharedTrades()
  }, [])

  const fetchSharedTrades = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get all shared trades with user information
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select(`
          *,
          profiles!trades_user_id_fkey (
            username
          )
        `)
        .eq('share', true)
        .order('created_at', { ascending: false })

      if (tradesError) {
        throw tradesError
      }

      // Transform the data to include username
      const transformedTrades = trades?.map((trade: any) => ({
        ...trade,
        username: trade.profiles?.username || 'Anonymous'
      })) || []

      setSharedTrades(transformedTrades)
    } catch (error) {
      console.error('Error fetching shared trades:', error)
      setError('Failed to load shared trades. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-racing-50 to-racing-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-racing-600 mx-auto mb-4"></div>
          <p className="text-racing-700">Loading shared trades...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-racing-50 to-racing-100">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-racing-800 mb-2">Error Loading Trades</h2>
          <p className="text-racing-600 mb-6">{error}</p>
          <button
            onClick={fetchSharedTrades}
            className="bg-racing-600 hover:bg-racing-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Share2 className="w-8 h-8 text-racing-600" />
          <h1 className="text-3xl font-bold text-gray-900">Social Trading</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Discover and learn from trades shared by the community. See what strategies other traders are using.
        </p>
      </div>

      {sharedTrades.length === 0 ? (
        <div className="text-center py-12">
          <Share2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Shared Trades Yet</h2>
          <p className="text-gray-600 mb-6">
            Be the first to share a trade! Go to the Analysis page and check the "Share" box on any trade.
          </p>
          <a
            href="/analysis"
            className="bg-racing-600 hover:bg-racing-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Go to Analysis
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {sharedTrades.length} Shared Trade{sharedTrades.length !== 1 ? 's' : ''}
              </h2>
              <div className="text-sm text-gray-500">
                Updated {format(new Date(), 'MMM d, yyyy')}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {sharedTrades.map((trade) => (
              <div key={trade.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-racing-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-racing-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{trade.username}</h3>
                      <p className="text-sm text-gray-500">
                        {format(new Date(trade.trading_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      trade.status === 'open' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {trade.status}
                    </span>
                    <Share2 className="w-4 h-4 text-racing-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 mb-1">Ticker</div>
                    <div className="font-semibold text-gray-900">{trade.ticker}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 mb-1">Option Type</div>
                    <div className="font-semibold text-gray-900">{trade.option_type}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 mb-1">Strike Price</div>
                    <div className="font-semibold text-gray-900">{formatCurrency(trade.strike_price)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 mb-1">Contracts</div>
                    <div className="font-semibold text-gray-900">{trade.contracts}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 mb-1">Cost</div>
                    <div className="font-semibold text-gray-900">{formatCurrency(trade.cost)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 mb-1">Realized P&L</div>
                    <div className={`font-semibold flex items-center gap-1 ${
                      (trade.realized_pl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(trade.realized_pl || 0) >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {formatCurrency(trade.realized_pl)}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 mb-1">Unrealized P&L</div>
                    <div className={`font-semibold flex items-center gap-1 ${
                      (trade.unrealized_pl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(trade.unrealized_pl || 0) >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {formatCurrency(trade.unrealized_pl)}
                    </div>
                  </div>
                </div>

                {trade.expiration_date && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Expires: {format(new Date(trade.expiration_date), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
