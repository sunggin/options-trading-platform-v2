'use client'

import { useState, useEffect } from 'react'
import { supabase, Trade } from '@/lib/supabase'
import { formatCurrency, formatPercentage } from '@/lib/calculations'
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Trash2, AlertTriangle, Edit2, Save, X, Flag } from 'lucide-react'
import { format } from 'date-fns'
import { getStockPrice } from '@/lib/stockApi'
import { useAuth } from '@/contexts/AuthContext'
import TradeForm from '@/components/TradeForm'

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
  
  // Analysis state
  const [editingField, setEditingField] = useState<{ tradeId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({})
  const [filterStatus, setFilterStatus] = useState<'all' | 'open'>('all')
  const [filterAccount, setFilterAccount] = useState<string>('all')
  const [filterTicker, setFilterTicker] = useState<string>('')
  const [filterOptionType, setFilterOptionType] = useState<string>('all')
  const [filterTradingDateFrom, setFilterTradingDateFrom] = useState<string>('')
  const [filterTradingDateTo, setFilterTradingDateTo] = useState<string>('')
  const [filterExpirationDateFrom, setFilterExpirationDateFrom] = useState<string>('')
  const [filterExpirationDateTo, setFilterExpirationDateTo] = useState<string>('')
  const [filterStrikePriceMin, setFilterStrikePriceMin] = useState<string>('')
  const [filterStrikePriceMax, setFilterStrikePriceMax] = useState<string>('')
  const [filterCostMin, setFilterCostMin] = useState<string>('')
  const [filterCostMax, setFilterCostMax] = useState<string>('')
  const [filterRealizedPlMin, setFilterRealizedPlMin] = useState<string>('')
  const [filterRealizedPlMax, setFilterRealizedPlMax] = useState<string>('')
  const [filterUnrealizedPlMin, setFilterUnrealizedPlMin] = useState<string>('')
  const [filterUnrealizedPlMax, setFilterUnrealizedPlMax] = useState<string>('')
  const [filterAudited, setFilterAudited] = useState<string>('all')
  const [filterExercised, setFilterExercised] = useState<string>('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false)

  useEffect(() => {
    calculateStats()
  }, [refreshTrigger])

  useEffect(() => {
    if (trades.length > 0) {
      fetchCurrentPrices()
    }
  }, [trades])

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
    
    if (!user) {
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
      
      // Fetch all trade data for stats and display
      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('trading_date', { ascending: false })

      if (error) {
        throw error
      }


      // Store trades for display
      setTrades(trades || [])
      const totalTrades = trades?.length || 0
      

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
    } finally {
      setFinancialDataLoading(false)
    }
  }

  // Main function that triggers both
  const calculateStats = async () => {
    await calculateBasicStats()
  }

  // Analysis helper functions
  const fetchCurrentPrices = async () => {
    try {
      const uniqueTickers = Array.from(new Set(trades.map(trade => trade.ticker.toUpperCase())))
      
      const pricePromises = uniqueTickers.map(async (ticker) => {
        try {
          const result = await getStockPrice(ticker)
          return { ticker, price: result.success ? result.data?.price || 0 : 0 }
        } catch (error) {
          return { ticker, price: 0 }
        }
      })

      const results = await Promise.all(pricePromises)
      const priceMap: Record<string, number> = {}
      results.forEach(({ ticker, price }) => {
        priceMap[ticker] = price
      })
      
      setCurrentPrices(priceMap)
    } catch (error) {
    }
  }

  const getFilteredTrades = () => {
    let filtered = trades

    if (filterStatus !== 'all') {
      filtered = filtered.filter(trade => trade.status === filterStatus)
    }

    if (filterAccount !== 'all') {
      filtered = filtered.filter(trade => trade.account === filterAccount)
    }

    if (filterTicker) {
      filtered = filtered.filter(trade => 
        trade.ticker.toLowerCase().includes(filterTicker.toLowerCase())
      )
    }

    if (filterOptionType !== 'all') {
      filtered = filtered.filter(trade => trade.option_type === filterOptionType)
    }

    if (filterTradingDateFrom) {
      filtered = filtered.filter(trade => trade.trading_date >= filterTradingDateFrom)
    }

    if (filterTradingDateTo) {
      filtered = filtered.filter(trade => trade.trading_date <= filterTradingDateTo)
    }

    if (filterExpirationDateFrom) {
      filtered = filtered.filter(trade => trade.expiration_date >= filterExpirationDateFrom)
    }

    if (filterExpirationDateTo) {
      filtered = filtered.filter(trade => trade.expiration_date <= filterExpirationDateTo)
    }

    if (filterStrikePriceMin) {
      const min = parseFloat(filterStrikePriceMin)
      if (!isNaN(min)) {
        filtered = filtered.filter(trade => trade.strike_price >= min)
      }
    }

    if (filterStrikePriceMax) {
      const max = parseFloat(filterStrikePriceMax)
      if (!isNaN(max)) {
        filtered = filtered.filter(trade => trade.strike_price <= max)
      }
    }

    if (filterCostMin) {
      const min = parseFloat(filterCostMin)
      if (!isNaN(min)) {
        filtered = filtered.filter(trade => (trade.cost || 0) >= min)
      }
    }

    if (filterCostMax) {
      const max = parseFloat(filterCostMax)
      if (!isNaN(max)) {
        filtered = filtered.filter(trade => (trade.cost || 0) <= max)
      }
    }

    if (filterRealizedPlMin) {
      const min = parseFloat(filterRealizedPlMin)
      if (!isNaN(min)) {
        filtered = filtered.filter(trade => (trade.realized_pl || 0) >= min)
      }
    }

    if (filterRealizedPlMax) {
      const max = parseFloat(filterRealizedPlMax)
      if (!isNaN(max)) {
        filtered = filtered.filter(trade => (trade.realized_pl || 0) <= max)
      }
    }

    if (filterUnrealizedPlMin) {
      const min = parseFloat(filterUnrealizedPlMin)
      if (!isNaN(min)) {
        filtered = filtered.filter(trade => (trade.unrealized_pl || 0) >= min)
      }
    }

    if (filterUnrealizedPlMax) {
      const max = parseFloat(filterUnrealizedPlMax)
      if (!isNaN(max)) {
        filtered = filtered.filter(trade => (trade.unrealized_pl || 0) <= max)
      }
    }

    if (filterAudited !== 'all') {
      const auditedValue = filterAudited === 'true'
      filtered = filtered.filter(trade => (trade.audited || false) === auditedValue)
    }

    if (filterExercised !== 'all') {
      const exercisedValue = filterExercised === 'true'
      filtered = filtered.filter(trade => (trade.exercised || false) === exercisedValue)
    }


    return filtered
  }

  const clearAllFilters = () => {
    setFilterStatus('all')
    setFilterAccount('all')
    setFilterTicker('')
    setFilterOptionType('all')
    setFilterTradingDateFrom('')
    setFilterTradingDateTo('')
    setFilterExpirationDateFrom('')
    setFilterExpirationDateTo('')
    setFilterStrikePriceMin('')
    setFilterStrikePriceMax('')
    setFilterCostMin('')
    setFilterCostMax('')
    setFilterRealizedPlMin('')
    setFilterRealizedPlMax('')
    setFilterUnrealizedPlMin('')
    setFilterUnrealizedPlMax('')
    setFilterAudited('all')
    setFilterExercised('all')
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filterStatus !== 'all') count++
    if (filterAccount !== 'all') count++
    if (filterTicker) count++
    if (filterOptionType !== 'all') count++
    if (filterTradingDateFrom || filterTradingDateTo) count++
    if (filterExpirationDateFrom || filterExpirationDateTo) count++
    if (filterStrikePriceMin || filterStrikePriceMax) count++
    if (filterCostMin || filterCostMax) count++
    if (filterRealizedPlMin || filterRealizedPlMax) count++
    if (filterUnrealizedPlMin || filterUnrealizedPlMax) count++
    if (filterAudited !== 'all') count++
    if (filterExercised !== 'all') count++
    return count
  }

  const handleStartEdit = (tradeId: string, field: string, currentValue: any) => {
    setEditingField({ tradeId, field })
    setEditValue(currentValue?.toString() || '')
  }

  const handleCancelEdit = () => {
    setEditingField(null)
    setEditValue('')
  }

  const handleSaveEdit = async () => {
    if (!editingField) return

    try {
      const { tradeId, field } = editingField
      let updateValue: any = editValue

      if (field === 'contracts') {
        updateValue = parseInt(editValue) || 0
      } else if (['cost', 'strike_price', 'pmcc_calc', 'realized_pl', 'unrealized_pl', 'expected_return'].includes(field)) {
        updateValue = parseFloat(editValue) || 0
      } else if (field === 'audited' || field === 'exercised') {
        updateValue = editValue === 'true'
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      const currentTrade = trades.find(t => t.id === tradeId)
      let updateData: any = { [field]: updateValue }

      if (['cost', 'strike_price', 'contracts', 'option_type'].includes(field) && currentTrade) {
        const optionType = field === 'option_type' ? editValue : currentTrade.option_type
        const strikePrice = field === 'strike_price' ? updateValue : currentTrade.strike_price
        const cost = field === 'cost' ? updateValue : currentTrade.cost
        const contracts = field === 'contracts' ? updateValue : currentTrade.contracts

        if (optionType === 'Call option' && contracts > 0) {
          const pmccCalc = strikePrice + (cost / contracts / 100)
          updateData.pmcc_calc = pmccCalc
        } else {
          updateData.pmcc_calc = null
        }
      }

      if (['realized_pl', 'unrealized_pl', 'strike_price', 'contracts', 'option_type'].includes(field) && currentTrade) {
        const optionType = field === 'option_type' ? editValue : currentTrade.option_type
        
        if (['Covered call', 'Cash covered call', 'Cash secured put', 'PMCC call option'].includes(optionType)) {
          const realizedPl = field === 'realized_pl' ? updateValue : (currentTrade.realized_pl || 0)
          const unrealizedPl = field === 'unrealized_pl' ? updateValue : (currentTrade.unrealized_pl || 0)
          const strikePrice = field === 'strike_price' ? updateValue : currentTrade.strike_price
          const contracts = field === 'contracts' ? updateValue : currentTrade.contracts
          
          const denominator = (strikePrice * 100) * contracts
          if (denominator > 0) {
            const expectedReturn = ((realizedPl + unrealizedPl) / denominator) * 100
            updateData.expected_return = expectedReturn
          }
        }
      }

      const { error } = await supabase
        .from('trades')
        .update(updateData)
        .eq('id', tradeId)

      if (error) throw error

      setEditingField(null)
      setEditValue('')
      calculateStats()
    } catch (error) {
      alert(`Failed to update field: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trade?')) return

    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', id)

      if (error) throw error
      calculateStats()
    } catch (error) {
      alert('Failed to delete trade. Please try again.')
    }
  }

  const getGainLossColor = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'text-gray-500'
    if (amount === 0) return 'text-black'
    return amount > 0 ? 'text-green-600' : 'text-red-600'
  }

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0]
    return dateString === today
  }

  const handleToggleCheckbox = async (tradeId: string, field: 'audited' | 'exercised', value: boolean) => {
    try {
      const { error } = await supabase
        .from('trades')
        .update({ [field]: value })
        .eq('id', tradeId)

      if (error) throw error
      calculateStats()
    } catch (error) {
      alert(`Failed to update ${field}`)
    }
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


      {/* Statistics Cards - 4x2 Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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

      {/* Options Trading Form Section */}
      <div className="mt-8">
        <TradeForm onTradeAdded={() => {
          calculateStats()
          if (typeof window !== 'undefined' && (window as any).refreshDashboard) {
            (window as any).refreshDashboard()
          }
        }} />
      </div>

      {/* Trade Analysis Section */}
      {trades.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Trade Analysis</h2>
            </div>
            <div className="text-sm text-gray-600">
              Total: {trades.length} trades
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
                {getActiveFilterCount() > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {getActiveFilterCount()} active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showAdvancedFilters ? 'Hide Advanced' : 'Show Advanced'}
                </button>
                {getActiveFilterCount() > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'open')}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All ({trades.length})</option>
                  <option value="open">Open ({trades.filter(t => t.status === 'open').length})</option>
                </select>
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Account</label>
                <select
                  value={filterAccount}
                  onChange={(e) => setFilterAccount(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Accounts</option>
                  {Array.from(new Set(trades.map(trade => trade.account))).map(account => (
                    <option key={account} value={account}>
                      {account} ({trades.filter(t => t.account === account).length})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Ticker</label>
                <input
                  type="text"
                  value={filterTicker}
                  onChange={(e) => setFilterTicker(e.target.value.toUpperCase())}
                  placeholder="e.g., AAPL"
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Option Type</label>
                <select
                  value={filterOptionType}
                  onChange={(e) => setFilterOptionType(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Types</option>
                  {Array.from(new Set(trades.map(trade => trade.option_type))).map(type => (
                    <option key={type} value={type}>
                      {type} ({trades.filter(t => t.option_type === type).length})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {/* Date Range Filters */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-700">Trading Date Range</h4>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={filterTradingDateFrom}
                        onChange={(e) => setFilterTradingDateFrom(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="From"
                      />
                      <input
                        type="date"
                        value={filterTradingDateTo}
                        onChange={(e) => setFilterTradingDateTo(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="To"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-700">Expiration Date Range</h4>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={filterExpirationDateFrom}
                        onChange={(e) => setFilterExpirationDateFrom(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="From"
                      />
                      <input
                        type="date"
                        value={filterExpirationDateTo}
                        onChange={(e) => setFilterExpirationDateTo(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="To"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-700">Strike Price Range</h4>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={filterStrikePriceMin}
                        onChange={(e) => setFilterStrikePriceMin(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={filterStrikePriceMax}
                        onChange={(e) => setFilterStrikePriceMax(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results Summary */}
            <div className="text-xs text-gray-600 pt-2 border-t border-gray-100">
              Showing {getFilteredTrades().length} of {trades.length} trades
              {getActiveFilterCount() > 0 && (
                <span className="ml-2 text-blue-600">
                  ({getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} applied)
                </span>
              )}
            </div>
          </div>

          {/* Analysis Table */}
          {(() => {
            const allFilteredTrades = getFilteredTrades().sort((a, b) => {
              const accountOrder = ['SAE', 'ST', 'ST Operating', 'Robinhood']
              const aAccountIndex = accountOrder.indexOf(a.account)
              const bAccountIndex = accountOrder.indexOf(b.account)
              
              if (aAccountIndex !== bAccountIndex) {
                return aAccountIndex - bAccountIndex
              }
              
              if (a.status !== b.status) {
                return a.status === 'open' ? -1 : 1
              }
              
              return new Date(b.trading_date).getTime() - new Date(a.trading_date).getTime()
            })
            
            if (allFilteredTrades.length > 0) {
              return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-600">Account</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-600">Date</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-600">Ticker</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-600">Price @ Purchase</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-600">Price Today</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-600">Option Type</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-600">Contracts</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-600">Strike</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-600">Cost</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-600">Expiration</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-600">Status</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-600">Realized P&L</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-600">Unrealized P&L</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allFilteredTrades.map((trade) => (
                          <tr key={trade.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm">{trade.account}</td>
                            <td className="py-3 px-4 text-sm">{format(new Date(trade.trading_date), 'MMM dd, yyyy')}</td>
                            <td className="py-3 px-4 text-sm font-mono font-semibold text-blue-600">{trade.ticker}</td>
                            <td className="py-3 px-4 text-sm font-mono text-gray-600">{formatCurrency(trade.price_at_purchase)}</td>
                            <td className="py-3 px-4 text-sm font-mono text-gray-600">
                              {currentPrices[trade.ticker] ? formatCurrency(currentPrices[trade.ticker]) : 'Loading...'}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                trade.option_type === 'Call option' ? 'bg-blue-100 text-blue-800' : 
                                trade.option_type === 'Put option' ? 'bg-red-100 text-red-800' :
                                trade.option_type === 'Covered call' ? 'bg-yellow-100 text-yellow-800' :
                                trade.option_type === 'Cash covered call' ? 'bg-yellow-100 text-yellow-800' :
                                trade.option_type === 'Cash secured put' ? 'bg-green-100 text-green-800' :
                                trade.option_type === 'PMCC call option' ? 'bg-purple-100 text-purple-800' :
                                trade.option_type === 'PMCC covered call' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {trade.option_type}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm">{trade.contracts}</td>
                            <td className="py-3 px-4 text-sm font-mono">{formatCurrency(trade.strike_price)}</td>
                            <td className="py-3 px-4 text-sm font-mono">{formatCurrency(trade.cost)}</td>
                            <td className="py-3 px-4 text-sm">
                              <div className="flex items-center gap-1">
                                {format(new Date(trade.expiration_date), 'MMM dd, yyyy')}
                                {isToday(trade.expiration_date) && (
                                  <Flag className="w-4 h-4 text-orange-500" />
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                trade.status === 'open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {trade.status.toUpperCase()}
                              </span>
                            </td>
                            <td className={`py-3 px-4 text-sm font-mono ${getGainLossColor(trade.realized_pl)}`}>
                              {trade.realized_pl ? formatCurrency(trade.realized_pl) : '$0.00'}
                            </td>
                            <td className={`py-3 px-4 text-sm font-mono ${getGainLossColor(trade.unrealized_pl)}`}>
                              {trade.unrealized_pl ? formatCurrency(trade.unrealized_pl) : '$0.00'}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(trade.id)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            }
            return null
          })()}

          {/* Show message if no trades match filters */}
          {getFilteredTrades().length === 0 && trades.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No trades match filters</h3>
                <p className="text-xs text-gray-500">Try adjusting your filter criteria.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Danger Zone - Delete All Trades Section */}
      {stats.totalTrades > 0 && (
        <div className="mt-8">
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
    </div>
  )
}
