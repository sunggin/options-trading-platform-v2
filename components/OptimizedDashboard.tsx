'use client'

import { useState, useEffect } from 'react'
import { loadDashboardStatsHybrid, invalidateTradesCache } from '@/lib/optimizedSupabase'
import { formatCurrency, formatPercentage } from '@/lib/calculations'
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Trash2, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface DashboardProps {
  refreshTrigger: number
}

interface DashboardStats {
  total_trades: number
  open_trades: number
  closed_trades: number
  total_realized_gain: number
  total_unrealized_gain: number
  total_cost: number
  overall_profit_loss: number
  total_dollars_traded: number
}

export default function OptimizedDashboard({ refreshTrigger }: DashboardProps) {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    total_trades: 0,
    open_trades: 0,
    closed_trades: 0,
    total_realized_gain: 0,
    total_unrealized_gain: 0,
    total_cost: 0,
    overall_profit_loss: 0,
    total_dollars_traded: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    loadStats()
  }, [refreshTrigger, user])

  const loadStats = async () => {
    if (!user) {
      setStats({
        total_trades: 0,
        open_trades: 0,
        closed_trades: 0,
        total_realized_gain: 0,
        total_unrealized_gain: 0,
        total_cost: 0,
        overall_profit_loss: 0,
        total_dollars_traded: 0
      })
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('Loading dashboard stats for user:', user.id)
      
      // Use hybrid loading strategy: localStorage -> cache -> database
      const { data, error } = await loadDashboardStatsHybrid(user.id)

      if (error) {
        console.error('Error loading dashboard stats:', error)
        setError('Failed to load dashboard statistics')
        setStats({
          total_trades: 0,
          open_trades: 0,
          closed_trades: 0,
          total_realized_gain: 0,
          total_unrealized_gain: 0,
          total_cost: 0,
          overall_profit_loss: 0,
          total_dollars_traded: 0
        })
      } else if (data) {
        console.log('Dashboard stats loaded successfully:', data)
        setStats({
          total_trades: data.total_trades || 0,
          open_trades: data.open_trades || 0,
          closed_trades: data.closed_trades || 0,
          total_realized_gain: data.total_realized_gain || 0,
          total_unrealized_gain: data.total_unrealized_gain || 0,
          total_cost: data.total_cost || 0,
          overall_profit_loss: data.overall_profit_loss || 0,
          total_dollars_traded: data.total_dollars_traded || 0
        })
      } else {
        // No data found - user has no trades
        setStats({
          total_trades: 0,
          open_trades: 0,
          closed_trades: 0,
          total_realized_gain: 0,
          total_unrealized_gain: 0,
          total_cost: 0,
          overall_profit_loss: 0,
          total_dollars_traded: 0
        })
      }
    } catch (error) {
      console.error('Unexpected error loading dashboard stats:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }


  // Function to calculate business days between two dates
  const calculateBusinessDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start >= end) return 0
    
    let count = 0
    const current = new Date(start)
    
    while (current < end) {
      const dayOfWeek = current.getDay()
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++
      }
      current.setDate(current.getDate() + 1)
    }
    
    return count
  }

  // Delete all trades function
  const deleteAllTrades = async () => {
    if (!user) {
      alert('You must be logged in to delete trades.')
      return
    }

    setIsDeletingAll(true)
    try {
      // Import supabase for deletion
      const { supabase } = await import('@/lib/optimizedSupabase')
      
      // First, get all trade IDs for the current user
      const { data: allTrades, error: fetchError } = await supabase
        .from('trades')
        .select('id')
        .eq('user_id', user.id)
      
      if (fetchError) {
        console.error('Error fetching trades:', fetchError)
        alert(`Failed to fetch trades: ${fetchError.message}`)
        return
      }
      
      if (allTrades && allTrades.length > 0) {
        // Delete each trade individually
        const { error: deleteError } = await supabase
          .from('trades')
          .delete()
          .in('id', allTrades.map((trade: any) => trade.id))
        
        if (deleteError) {
          console.error('Error deleting trades:', deleteError)
          alert(`Failed to delete trades: ${deleteError.message}`)
          return
        }
      }
      
      // Reset stats to show empty state
      setStats({
        total_trades: 0,
        open_trades: 0,
        closed_trades: 0,
        total_realized_gain: 0,
        total_unrealized_gain: 0,
        total_cost: 0,
        overall_profit_loss: 0,
        total_dollars_traded: 0
      })
      
      // Invalidate cache and reload
      invalidateTradesCache(user.id)
      loadStats()
      
      // Trigger refresh
      if (typeof window !== 'undefined' && (window as any).refreshDashboard) {
        (window as any).refreshDashboard()
      }
      
      alert(`Successfully deleted ${allTrades?.length || 0} trades!`)
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Error deleting all trades:', error)
      alert('Failed to delete all trades. Please try again.')
    } finally {
      setIsDeletingAll(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const startTradingDate = '' // Simplified - no start date tracking
  const daysTradingOptions = startTradingDate ? calculateBusinessDays(startTradingDate, today) : 0
  const dollarsPerDay = daysTradingOptions > 0 ? stats.overall_profit_loss / daysTradingOptions : 0

  if (loading) {
    return (
      <div className="card mb-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card mb-8">
        <div className="flex items-center justify-center py-8">
          <div className="text-red-600">
            <p className="font-medium">Error loading dashboard</p>
            <p className="text-sm mt-1">{error}</p>
            <button 
              onClick={loadStats}
              className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'blue', 
    isPercentage = false, 
    isCount = false
  }: {
    title: string
    value: number
    icon: any
    color?: 'blue' | 'green' | 'red' | 'gray'
    isPercentage?: boolean
    isCount?: boolean
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      red: 'bg-red-50 text-red-600',
      gray: 'bg-gray-50 text-gray-600'
    }

    const formatValue = () => {
      if (isCount) {
        return value.toString()
      }
      if (isPercentage) {
        return formatPercentage(value)
      }
      return formatCurrency(value)
    }

    return (
      <div className="card p-2">
        <div className="flex items-center">
          <div className={`p-1.5 rounded-full ${colorClasses[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="ml-2">
            <p className="text-xs font-medium text-gray-600">{title}</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatValue()}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show empty state if no trades
  if (stats.total_trades === 0) {
    return (
      <div className="mb-4">
        <div className="card">
          <div className="text-center py-8">
            <div className="mb-4">
              <BarChart3 className="w-16 h-16 text-racing-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-racing-800 mb-2">
                Welcome to Your Trading Dashboard
              </h2>
              <p className="text-racing-600 mb-6">
                Start tracking your options trades by adding your first trade below.
              </p>
            </div>
            
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold">Trading Dashboard</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {stats.total_trades} trades • {daysTradingOptions} days trading
          </span>
          <button
            onClick={loadStats}
            className="text-xs text-racing-600 hover:text-racing-800 underline"
            title="Refresh dashboard data"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <StatCard
          title="Total Trades"
          value={stats.total_trades}
          icon={BarChart3}
          color="blue"
          isCount={true}
        />
        <StatCard
          title="Open Trades"
          value={stats.open_trades}
          icon={TrendingUp}
          color="blue"
          isCount={true}
        />
        <StatCard
          title="Closed Trades"
          value={stats.closed_trades}
          icon={BarChart3}
          color="gray"
          isCount={true}
        />
        <StatCard
          title="Total $ Traded"
          value={stats.total_dollars_traded}
          icon={DollarSign}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total Cost"
          value={stats.total_cost}
          icon={DollarSign}
          color="gray"
        />
        <StatCard
          title="Realized P&L"
          value={stats.total_realized_gain}
          icon={stats.total_realized_gain >= 0 ? TrendingUp : TrendingDown}
          color={stats.total_realized_gain >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Unrealized P&L"
          value={stats.total_unrealized_gain}
          icon={stats.total_unrealized_gain >= 0 ? TrendingUp : TrendingDown}
          color={stats.total_unrealized_gain >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Overall P&L"
          value={stats.overall_profit_loss}
          icon={stats.overall_profit_loss >= 0 ? TrendingUp : TrendingDown}
          color={stats.overall_profit_loss >= 0 ? 'green' : 'red'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        <StatCard
          title="Days Trading Options"
          value={daysTradingOptions}
          icon={BarChart3}
          color="blue"
          isCount={true}
        />
        <StatCard
          title="$ Per Day"
          value={dollarsPerDay}
          icon={DollarSign}
          color={dollarsPerDay >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Performance indicator */}
      <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between text-xs">
          <span className="text-blue-700">
            📊 Dashboard loaded with optimized caching
          </span>
          <span className="text-blue-600">
            Instant loading enabled
          </span>
        </div>
      </div>

      {/* Delete All Trades Section */}
      {stats.total_trades > 0 && (
        <div className="mt-6">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs text-gray-600">
                Permanently delete all {stats.total_trades} trades from your account. This action cannot be undone.
              </p>
              
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-md transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All Trades
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm font-medium text-red-800 mb-1">
                      ⚠️ Are you absolutely sure?
                    </p>
                    <p className="text-xs text-red-700">
                      This will permanently delete all {stats.total_trades} trades and cannot be undone.
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={deleteAllTrades}
                      disabled={isDeletingAll}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm py-2 px-4 rounded-md transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {isDeletingAll ? 'Deleting...' : 'Yes, Delete All Trades'}
                    </button>
                    
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeletingAll}
                      className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white text-sm py-2 px-4 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
