'use client'

import { useState, useEffect } from 'react'
import { supabase, Trade } from '@/lib/supabase'
import { formatCurrency, formatPercentage } from '@/lib/calculations'
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Trash2, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface DashboardProps {
  refreshTrigger: number
}

interface DashboardStats {
  totalTrades: number
  totalRealizedGain: number
  totalUnrealizedGain: number
  totalCost: number
  overallProfitLoss: number
  totalDollarsTraded: number
  daysTradingOptions: number
  dollarsPerDay: number
}

export default function Dashboard({ refreshTrigger }: DashboardProps) {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalTrades: 0,
    totalRealizedGain: 0,
    totalUnrealizedGain: 0,
    totalCost: 0,
    overallProfitLoss: 0,
    totalDollarsTraded: 0,
    daysTradingOptions: 0,
    dollarsPerDay: 0
  })
  const [loading, setLoading] = useState(true)
  const [financialDataLoading, setFinancialDataLoading] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [trades, setTrades] = useState<Trade[]>([])

  useEffect(() => {
    calculateStats()
  }, [refreshTrigger])

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


  // Fast loading - basic stats that load immediately
  const calculateBasicStats = async () => {
    console.log('Dashboard: calculateBasicStats called, user:', user)
    
    if (!user) {
      console.log('Dashboard: No user found, setting empty stats')
      setStats({
        totalTrades: 0,
        totalRealizedGain: 0,
        totalUnrealizedGain: 0,
        totalCost: 0,
        overallProfitLoss: 0,
        totalDollarsTraded: 0,
        daysTradingOptions: 0,
        dollarsPerDay: 0
      })
      setLoading(false)
      return
    }

    // Don't set loading to true - let static content show immediately
    try {
      console.log('Dashboard: Fetching trades for user:', user.id)
      
      // Fetch all trade data for stats and display
      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('trading_date', { ascending: false })

      if (error) {
        console.error('Dashboard: Supabase error:', error)
        throw error
      }

      console.log('Dashboard: Trades fetched successfully:', trades?.length || 0, 'trades')
      console.log('Dashboard: Raw trades data:', trades)

      // Store trades for display
      setTrades(trades || [])
      const totalTrades = trades?.length || 0
      
      console.log('Dashboard: Calculated stats - Total:', totalTrades)

      // Set basic stats immediately
      setStats(prev => ({
        ...prev,
        totalTrades,
        // Keep financial data as 0 for now, will be updated by calculateFinancialStats
        totalRealizedGain: 0,
        totalUnrealizedGain: 0,
        totalCost: 0,
        overallProfitLoss: 0,
        totalDollarsTraded: 0,
        daysTradingOptions: 0,
        dollarsPerDay: 0
      }))

      setLoading(false) // Basic stats loaded, show dashboard

      // Now load financial data in background
      calculateFinancialStats()
    } catch (error) {
      console.error('Error calculating basic stats:', error)
      setLoading(false)
    }
  }

  // Slow loading - financial calculations that happen in background
  const calculateFinancialStats = async () => {
    if (!user) return

    setFinancialDataLoading(true)
    try {
      // Use trades data we already have
      const tradesData = trades

      const totalRealizedGain = tradesData?.reduce((sum: number, trade: any) => 
        sum + (trade.realized_pl || 0), 0) || 0
      
      const totalUnrealizedGain = tradesData?.reduce((sum: number, trade: any) => 
        sum + (trade.unrealized_pl || 0), 0) || 0
      
      const totalCost = tradesData?.reduce((sum: number, trade: any) => 
        sum + (trade.cost * trade.contracts), 0) || 0
      
      const overallProfitLoss = totalRealizedGain + totalUnrealizedGain
      
      // Calculate Total $ Traded
      const totalDollarsTraded = tradesData?.reduce((sum: number, trade: any) => {
        const { option_type, cost, contracts, strike_price } = trade
        
        // For Call option and Put option: cost * contracts
        if (option_type === 'Call option' || option_type === 'Put option') {
          return sum + (cost * contracts)
        }
        
        // For PMCC covered call, covered call, cash secured put: strike_price * 100 * contracts
        if (option_type === 'PMCC covered call' || option_type === 'Covered call' || option_type === 'Cash secured put') {
          return sum + (strike_price * 100 * contracts)
        }
        
        return sum
      }, 0) || 0

      // Calculate Days Trading Options and $ Per Day (simplified without start date)
      const daysTradingOptions = 0 // Simplified - no start date tracking
      const dollarsPerDay = 0 // Simplified - no start date tracking

      // Update with financial data
      setStats(prev => ({
        ...prev,
        totalRealizedGain,
        totalUnrealizedGain,
        totalCost,
        overallProfitLoss,
        totalDollarsTraded,
        daysTradingOptions,
        dollarsPerDay
      }))
    } catch (error) {
      console.error('Error calculating financial stats:', error)
    } finally {
      setFinancialDataLoading(false)
    }
  }

  // Main function that triggers both
  const calculateStats = async () => {
    await calculateBasicStats()
  }

  // Delete all trades function
  const deleteAllTrades = async () => {
    if (!user) {
      alert('You must be logged in to delete trades.')
      return
    }

    setIsDeletingAll(true)
    try {
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
        totalTrades: 0,
        totalRealizedGain: 0,
        totalUnrealizedGain: 0,
        totalCost: 0,
        overallProfitLoss: 0,
        totalDollarsTraded: 0,
        daysTradingOptions: 0,
        dollarsPerDay: 0
      })
      
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

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'blue', 
    isPercentage = false, 
    isCount = false,
    isLoading = false
  }: {
    title: string
    value: number
    icon: any
    color?: 'blue' | 'green' | 'red' | 'gray'
    isPercentage?: boolean
    isCount?: boolean
    isLoading?: boolean
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      red: 'bg-red-50 text-red-600',
      gray: 'bg-gray-50 text-gray-600'
    }

    const formatValue = () => {
      if (isLoading) {
        return '...'
      }
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
          <div className={`p-1.5 rounded-full ${colorClasses[color]} ${isLoading ? 'animate-pulse' : ''}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="ml-2">
            <p className="text-xs font-medium text-gray-600">{title}</p>
            <p className={`text-sm font-semibold text-gray-900 ${isLoading ? 'animate-pulse' : ''}`}>
              {formatValue()}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show empty state if no trades
  if (stats.totalTrades === 0) {
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
      </div>
      
      {/* Progress indicator for financial data loading */}
      {financialDataLoading && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-700 font-medium">Loading financial data...</span>
          </div>
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <StatCard
          title="Total Trades"
          value={stats.totalTrades}
          icon={BarChart3}
          color="blue"
          isCount={true}
        />
        <StatCard
          title="Total $ Traded"
          value={stats.totalDollarsTraded}
          icon={DollarSign}
          color="blue"
          isLoading={financialDataLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total Cost"
          value={stats.totalCost}
          icon={DollarSign}
          color="gray"
          isLoading={financialDataLoading}
        />
        <StatCard
          title="Realized P&L"
          value={stats.totalRealizedGain}
          icon={stats.totalRealizedGain >= 0 ? TrendingUp : TrendingDown}
          color={stats.totalRealizedGain >= 0 ? 'green' : 'red'}
          isLoading={financialDataLoading}
        />
        <StatCard
          title="Unrealized P&L"
          value={stats.totalUnrealizedGain}
          icon={stats.totalUnrealizedGain >= 0 ? TrendingUp : TrendingDown}
          color={stats.totalUnrealizedGain >= 0 ? 'green' : 'red'}
          isLoading={financialDataLoading}
        />
        <StatCard
          title="Overall P&L"
          value={stats.overallProfitLoss}
          icon={stats.overallProfitLoss >= 0 ? TrendingUp : TrendingDown}
          color={stats.overallProfitLoss >= 0 ? 'green' : 'red'}
          isLoading={financialDataLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        <StatCard
          title="Days Trading Options"
          value={stats.daysTradingOptions}
          icon={BarChart3}
          color="blue"
          isCount={true}
          isLoading={financialDataLoading}
        />
        <StatCard
          title="$ Per Day"
          value={stats.dollarsPerDay}
          icon={DollarSign}
          color={stats.dollarsPerDay >= 0 ? 'green' : 'red'}
          isLoading={financialDataLoading}
        />
      </div>

      {/* Delete All Trades Section */}
      {stats.totalTrades > 0 && (
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
                Permanently delete all {stats.totalTrades} trades from your account. This action cannot be undone.
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
                      This will permanently delete all {stats.totalTrades} trades and cannot be undone.
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

      {/* Open Trades Section */}
      {trades.filter(trade => trade.status === 'open').length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Open Trades</h2>
          {Object.entries(
            trades
              .filter(trade => trade.status === 'open')
              .reduce((acc: Record<string, Trade[]>, trade) => {
                const account = trade.account || 'Unnamed Account'
                if (!acc[account]) acc[account] = []
                acc[account].push(trade)
                return acc
              }, {})
          ).map(([account, accountTrades]) => (
            <div key={account} className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">{account}</h3>
              <div className="grid gap-3">
                {accountTrades.map((trade) => (
                  <div key={trade.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900">{trade.ticker}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            trade.option_type === 'Call' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {trade.option_type}
                          </span>
                          <span className="text-sm text-gray-500">
                            ${trade.strike_price}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Expires: {new Date(trade.expiration_date).toLocaleDateString()}</div>
                          <div>Contracts: {trade.contracts}</div>
                          <div>Cost: ${trade.cost}</div>
                          <div>Date: {new Date(trade.trading_date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-medium ${
                          (trade.unrealized_pl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(trade.unrealized_pl || 0)}
                        </div>
                        <div className="text-sm text-gray-500">Unrealized P&L</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Closed Trades Section */}
      {trades.filter(trade => trade.status === 'closed').length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Closed Trades</h2>
          {Object.entries(
            trades
              .filter(trade => trade.status === 'closed')
              .reduce((acc: Record<string, Trade[]>, trade) => {
                const account = trade.account || 'Unnamed Account'
                if (!acc[account]) acc[account] = []
                acc[account].push(trade)
                return acc
              }, {})
          ).map(([account, accountTrades]) => (
            <div key={account} className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">{account}</h3>
              <div className="grid gap-3">
                {accountTrades.map((trade) => (
                  <div key={trade.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900">{trade.ticker}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            trade.option_type === 'Call' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {trade.option_type}
                          </span>
                          <span className="text-sm text-gray-500">
                            ${trade.strike_price}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Expired: {new Date(trade.expiration_date).toLocaleDateString()}</div>
                          <div>Contracts: {trade.contracts}</div>
                          <div>Cost: ${trade.cost}</div>
                          <div>Date: {new Date(trade.trading_date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-medium ${
                          (trade.realized_pl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(trade.realized_pl || 0)}
                        </div>
                        <div className="text-sm text-gray-500">Realized P&L</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
