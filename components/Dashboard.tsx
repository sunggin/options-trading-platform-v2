'use client'

import { useState, useEffect } from 'react'
import { supabase, Trade } from '@/lib/supabase'
import { formatCurrency, formatPercentage } from '@/lib/calculations'
import { DollarSign, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import UserAccountManager from './UserAccountManager'

interface DashboardProps {
  refreshTrigger: number
}

interface DashboardStats {
  totalTrades: number
  openTrades: number
  closedTrades: number
  totalRealizedGain: number
  totalUnrealizedGain: number
  totalCost: number
  overallProfitLoss: number
  totalDollarsTraded: number
  daysTradingOptions: number
  dollarsPerDay: number
}

export default function Dashboard({ refreshTrigger }: DashboardProps) {
  const { user, profile, updateStartTradingDate } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalTrades: 0,
    openTrades: 0,
    closedTrades: 0,
    totalRealizedGain: 0,
    totalUnrealizedGain: 0,
    totalCost: 0,
    overallProfitLoss: 0,
    totalDollarsTraded: 0,
    daysTradingOptions: 0,
    dollarsPerDay: 0
  })
  const [loading, setLoading] = useState(true)
  const [showDateInput, setShowDateInput] = useState(false)
  const [updatingDate, setUpdatingDate] = useState(false)

  useEffect(() => {
    calculateStats()
  }, [refreshTrigger, profile?.start_trading_date])

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

  // Function to handle updating start trading date
  const handleUpdateStartDate = async (newDate: string) => {
    if (!newDate) return
    
    setUpdatingDate(true)
    try {
      const result = await updateStartTradingDate(newDate)
      if (result.success) {
        setShowDateInput(false)
      } else {
        console.error('Failed to update start trading date:', result.error)
      }
    } catch (error) {
      console.error('Error updating start trading date:', error)
    } finally {
      setUpdatingDate(false)
    }
  }

  const calculateStats = async () => {
    if (!user) {
      setStats({
        totalTrades: 0,
        openTrades: 0,
        closedTrades: 0,
        totalRealizedGain: 0,
        totalUnrealizedGain: 0,
        totalCost: 0,
        overallProfitLoss: 0,
        totalDollarsTraded: 0,
        daysTradingOptions: 0,
        dollarsPerDay: 0
      })
      return
    }

    try {
      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id) // Filter by current user's ID

      if (error) throw error

      const totalTrades = trades?.length || 0
      const openTrades = trades?.filter((t: any) => t.status === 'open').length || 0
      const closedTrades = trades?.filter((t: any) => t.status === 'closed').length || 0
      
      const totalRealizedGain = trades?.reduce((sum: number, trade: any) => 
        sum + (trade.realized_pl || 0), 0) || 0
      
      const totalUnrealizedGain = trades?.reduce((sum: number, trade: any) => 
        sum + (trade.unrealized_pl || 0), 0) || 0
      
      console.log('Dashboard calculations:', {
        totalTrades,
        openTrades,
        closedTrades,
        totalRealizedGain,
        totalUnrealizedGain,
        tradesWithRealizedPL: trades?.filter((t: any) => t.realized_pl).map((t: any) => ({ id: t.id, realized_pl: t.realized_pl })),
        tradesWithUnrealizedPL: trades?.filter((t: any) => t.unrealized_pl).map((t: any) => ({ id: t.id, unrealized_pl: t.unrealized_pl }))
      })
      
      const totalCost = trades?.reduce((sum: number, trade: any) => 
        sum + (trade.cost * trade.contracts), 0) || 0
      
      const overallProfitLoss = totalRealizedGain + totalUnrealizedGain
      
      // Calculate Total $ Traded
      const totalDollarsTraded = trades?.reduce((sum: number, trade: any) => {
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

      // Calculate Days Trading Options and $ Per Day
      const today = new Date().toISOString().split('T')[0]
      const startTradingDate = profile?.start_trading_date || ''
      const daysTradingOptions = startTradingDate ? calculateBusinessDays(startTradingDate, today) : 0
      const dollarsPerDay = daysTradingOptions > 0 ? overallProfitLoss / daysTradingOptions : 0

      setStats({
        totalTrades,
        openTrades,
        closedTrades,
        totalRealizedGain,
        totalUnrealizedGain,
        totalCost,
        overallProfitLoss,
        totalDollarsTraded,
        daysTradingOptions,
        dollarsPerDay
      })
    } catch (error) {
      console.error('Error calculating stats:', error)
    } finally {
      setLoading(false)
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
            
            <div className="p-4 bg-racing-50 border border-racing-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-racing-800 mb-1">
                    Set Your Start Trading Date
                  </h3>
                  <p className="text-xs text-racing-600">
                    This helps calculate your trading performance metrics
                  </p>
                </div>
                <button
                  onClick={() => setShowDateInput(true)}
                  className="btn-primary text-sm py-1 px-2"
                >
                  Set Date
                </button>
              </div>
              {showDateInput && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="date"
                    value={profile?.start_trading_date || ''}
                    onChange={(e) => handleUpdateStartDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="input-field text-sm py-1"
                    disabled={updatingDate}
                  />
                  <button
                    onClick={() => setShowDateInput(false)}
                    className="btn-secondary text-sm py-1 px-2"
                    disabled={updatingDate}
                  >
                    {updatingDate ? 'Updating...' : 'Cancel'}
                  </button>
                </div>
              )}
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
        <button
          onClick={() => setShowDateInput(!showDateInput)}
          className="text-xs text-racing-600 hover:text-racing-800 underline"
        >
          {showDateInput ? 'Hide' : (profile?.start_trading_date ? 'Update' : 'Set')} Start Date
        </button>
      </div>

      {showDateInput && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            When did you start trading options?
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={profile?.start_trading_date || ''}
              onChange={(e) => handleUpdateStartDate(e.target.value)}
              className="input-field text-sm py-1"
              max={new Date().toISOString().split('T')[0]}
              disabled={updatingDate}
            />
            <button
              onClick={() => setShowDateInput(false)}
              className="btn-secondary text-sm py-1 px-2"
              disabled={updatingDate}
            >
              {updatingDate ? 'Updating...' : 'Cancel'}
            </button>
          </div>
          {profile?.start_trading_date && (
            <p className="text-xs text-gray-600 mt-1">
              Trading for {stats.daysTradingOptions} business days
            </p>
          )}
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
          title="Open Trades"
          value={stats.openTrades}
          icon={TrendingUp}
          color="blue"
          isCount={true}
        />
        <StatCard
          title="Closed Trades"
          value={stats.closedTrades}
          icon={BarChart3}
          color="gray"
          isCount={true}
        />
        <StatCard
          title="Total $ Traded"
          value={stats.totalDollarsTraded}
          icon={DollarSign}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total Cost"
          value={stats.totalCost}
          icon={DollarSign}
          color="gray"
        />
        <StatCard
          title="Realized P&L"
          value={stats.totalRealizedGain}
          icon={stats.totalRealizedGain >= 0 ? TrendingUp : TrendingDown}
          color={stats.totalRealizedGain >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Unrealized P&L"
          value={stats.totalUnrealizedGain}
          icon={stats.totalUnrealizedGain >= 0 ? TrendingUp : TrendingDown}
          color={stats.totalUnrealizedGain >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Overall P&L"
          value={stats.overallProfitLoss}
          icon={stats.overallProfitLoss >= 0 ? TrendingUp : TrendingDown}
          color={stats.overallProfitLoss >= 0 ? 'green' : 'red'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        <StatCard
          title="Days Trading Options"
          value={stats.daysTradingOptions}
          icon={BarChart3}
          color="blue"
          isCount={true}
        />
        <StatCard
          title="$ Per Day"
          value={stats.dollarsPerDay}
          icon={DollarSign}
          color={stats.dollarsPerDay >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* User Account Management */}
      <div className="mt-6">
        <UserAccountManager />
      </div>
    </div>
  )
}
