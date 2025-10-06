'use client'

import { useState, useEffect } from 'react'
import { supabase, Trade } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Edit2, Trash2, Save, X, DollarSign, TrendingUp, TrendingDown, Square, RotateCcw, Flag, ChevronDown, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
// import { getStockPrice } from '@/lib/stockApi' // Disabled for performance

interface TradesTableProps {
  refreshTrigger: number
}

export default function TradesTable({ refreshTrigger }: TradesTableProps) {
  const { user } = useAuth()
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [editingField, setEditingField] = useState<{ tradeId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({})
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  
  // State for collapsible sections
  const [isOpenTradesExpanded, setIsOpenTradesExpanded] = useState(true)
  const [isClosedTradesExpanded, setIsClosedTradesExpanded] = useState(false)
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({})
  
  // Helper functions for collapsible sections
  const toggleAccountSection = (accountKey: string) => {
    setExpandedAccounts(prev => ({
      ...prev,
      [accountKey]: !prev[accountKey]
    }))
  }
  
  const isAccountExpanded = (accountKey: string) => {
    return expandedAccounts[accountKey] !== false // Default to expanded
  }
  
      // Delete all trades function
      const deleteAllTrades = async () => {
        if (!user) {
          alert('You must be logged in to delete trades.')
          return
        }

        if (!confirm('Are you sure you want to delete ALL your trades? This action cannot be undone.')) {
          return
        }
        
        setIsDeletingAll(true)
        try {
          
          // Test connection first
          const { data: testData, error: testError } = await supabase
            .from('trades')
            .select('count', { count: 'exact', head: true })
            .eq('user_id', user.id)
          
          if (testError) {
            alert(`Connection failed: ${testError.message}. Please check your internet connection and try again.`)
            return
          }

          // Use a simpler approach - delete all trades for the current user directly
          const { error: deleteError } = await supabase
            .from('trades')
            .delete()
            .eq('user_id', user.id) // Delete all trades for current user
          
          if (deleteError) {

            alert(`Failed to delete trades: ${deleteError.message}`)
            return
          }

          // Clear local state
          setTrades([])
          setCurrentPrices({})
          
          // Trigger refresh
          if (typeof window !== 'undefined' && (window as any).refreshDashboard) {
            (window as any).refreshDashboard()
          }
          
          alert('All trades have been deleted successfully!')
        } catch (error) {

          if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            alert('Network error: Unable to connect to the server. Please check your internet connection and try again.')
          } else {
            alert(`Failed to delete all trades: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        } finally {
          setIsDeletingAll(false)
        }
      }
  
      // Separate trades by account and status
      const getTradesByAccount = () => {
        const accountGroups: Record<string, { open: Trade[], closed: Trade[] }> = {}
        
        trades.forEach(trade => {
          const account = trade.account || 'Unknown'
          if (!accountGroups[account]) {
            accountGroups[account] = { open: [], closed: [] }
          }
          
          if (trade.status === 'open') {
            accountGroups[account].open.push(trade)
          } else {
            accountGroups[account].closed.push(trade)
          }
        })
        
        return accountGroups
      }

      // Define the preferred account order
      const getAccountOrder = (accountGroups: Record<string, { open: Trade[], closed: Trade[] }>) => {
        const preferredOrder = ['SAE', 'ST', 'ST Operating', 'Robinhood']
        const accounts = Object.keys(accountGroups)
        
        // Sort accounts according to preferred order, then add any remaining accounts
        const sortedAccounts = preferredOrder.filter(account => accounts.includes(account))
        const remainingAccounts = accounts.filter(account => !preferredOrder.includes(account))
        
        return [...sortedAccounts, ...remainingAccounts]
      }
  
  const tradesByAccount = getTradesByAccount()

  useEffect(() => {
    fetchTrades()
  }, [refreshTrigger])

  // Disabled for performance - stock price fetching causes major slowdowns
  // useEffect(() => {
  //   if (trades.length > 0) {
  //     fetchCurrentPrices()
  //   }
  // }, [trades])

  const fetchTrades = async () => {

    if (!user) {

      setLoading(false)
      return
    }

    setLoading(true) // Set loading at start
    try {

      // Optimize query - only select needed fields for better performance
      const { data, error } = await supabase
        .from('trades')
        .select('id, ticker, account, trading_date, option_type, expiration_date, status, contracts, cost, strike_price, price_at_purchase, pmcc_calc, realized_pl, unrealized_pl, audited, exercised, share')
        .eq('user_id', user.id) // Filter by current user's ID
        .order('status', { ascending: true }) // 'open' comes before 'closed' alphabetically
        .order('trading_date', { ascending: false }) // Most recent first within each status

      if (error) {

        throw error
      }

      setTrades(data || [])
    } catch (error) {

      setTrades([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  // Disabled for performance - stock price fetching causes major slowdowns
  // const fetchCurrentPrices = async () => {
  //   try {
  //     // Get unique tickers from all trades
  //     const uniqueTickers = Array.from(new Set(trades.map(trade => trade.ticker.toUpperCase())))
  //     
  //     // Fetch current prices for all unique tickers
  //     const pricePromises = uniqueTickers.map(async (ticker) => {
  //       try {
  //         const result = await getStockPrice(ticker)
  //         return { ticker, price: result.success ? result.data?.price || 0 : 0 }
  //       } catch (error) {
  //         return { ticker, price: 0 }
  //       }
  //     })

  //     const results = await Promise.all(pricePromises)
  //     const priceMap: Record<string, number> = {}
  //     results.forEach(({ ticker, price }) => {
  //       priceMap[ticker] = price
  //     })
  //     
  //     setCurrentPrices(priceMap)
  //   } catch (error) {
  //   }
  // }

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

      // Convert value based on field type
      if (field === 'contracts') {
        updateValue = parseInt(editValue) || 0
      } else if (['cost', 'strike_price', 'pmcc_calc', 'realized_pl', 'unrealized_pl', 'expected_return'].includes(field)) {
        updateValue = parseFloat(editValue) || 0
      } else if (field === 'audited' || field === 'exercised') {
        updateValue = editValue === 'true'
      }

      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {

        throw new Error(`Authentication failed: ${authError.message}`)
      }
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Get the current trade to check option type
      const currentTrade = trades.find(t => t.id === tradeId)
      let updateData: any = { [field]: updateValue }

      // If updating cost, strike_price, contracts, or option_type, recalculate PMCC for Call options
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

      // Auto-calculate Expected Return for covered strategies when relevant fields are updated
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

      if (error) {

        throw error
      }

      setEditingField(null)
      setEditValue('')
      fetchTrades()
      // Trigger dashboard refresh by calling onTradeAdded if it exists
      if (typeof window !== 'undefined' && (window as any).refreshDashboard) {
        (window as any).refreshDashboard()
      }
    } catch (error) {

      let errorMessage = 'Unknown error'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message)
      }
      
      alert(`Failed to update field: ${errorMessage}`)
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
      fetchTrades()
    } catch (error) {

      alert('Failed to delete trade. Please try again.')
    }
  }

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getGainLossColor = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'text-gray-500'
    if (amount === 0) return 'text-black'
    return amount > 0 ? 'text-green-600' : 'text-red-600'
  }

      const getGainLossIcon = (amount: number | undefined) => {
        if (amount === undefined || amount === null) return null
        return amount >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
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
      fetchTrades()
      // Trigger dashboard refresh
      if (typeof window !== 'undefined' && (window as any).refreshDashboard) {
        (window as any).refreshDashboard()
      }
    } catch (error) {

      alert(`Failed to update ${field}`)
    }
  }

  const handleCloseTrade = async (tradeId: string) => {
    try {

      const today = new Date().toISOString().split('T')[0] // Get today's date in YYYY-MM-DD format

      const { error } = await supabase
        .from('trades')
        .update({ 
          status: 'closed',
          closed_date: today
        })
        .eq('id', tradeId)

      if (error) {

        throw error
      }

      fetchTrades()
      // Trigger dashboard refresh
      if (typeof window !== 'undefined' && (window as any).refreshDashboard) {
        (window as any).refreshDashboard()
      }
    } catch (error) {

      alert(`Failed to close trade: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleReopenTrade = async (tradeId: string) => {
    try {

      const { error } = await supabase
        .from('trades')
        .update({ 
          status: 'open',
          closed_date: null // Clear the closed date
        })
        .eq('id', tradeId)

      if (error) {

        throw error
      }

      fetchTrades()
      // Trigger dashboard refresh
      if (typeof window !== 'undefined' && (window as any).refreshDashboard) {
        (window as any).refreshDashboard()
      }
    } catch (error) {

      alert(`Failed to reopen trade: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const renderTradeRow = (trade: Trade) => {
    const isEditing = editingField?.tradeId === trade.id
    const isEditingField = (field: string) => isEditing && editingField?.field === field

        return (
          <tr key={trade.id} className="border-b border-gray-100 hover:bg-gray-50 text-xs">
            {/* Account */}
            <td className="py-1 px-1 text-xs">
          {isEditingField('account') ? (
                <select
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleSaveEdit}
                  onKeyDown={handleKeyPress}
                  className="input-field-compact w-full"
                  autoFocus
                >
                  <option value="SAE">SAE</option>
                  <option value="ST">ST</option>
                  <option value="ST Operating">ST Operating</option>
                  <option value="Robinhood">Robinhood</option>
                </select>
          ) : (
            <span 
              className="cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
              onClick={() => handleStartEdit(trade.id, 'account', trade.account)}
            >
              {trade.account}
            </span>
          )}
        </td>
      
            {/* Date */}
            <td className="py-1 px-1 text-xs">
          {isEditingField('trading_date') ? (
            <input
              type="date"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyPress}
              className="input-field-compact w-full"
              autoFocus
            />
          ) : (
            <span 
              className="cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
              onClick={() => handleStartEdit(trade.id, 'trading_date', trade.trading_date)}
            >
              {format(new Date(trade.trading_date), 'MMM dd, yyyy')}
            </span>
          )}
        </td>
        
        {/* Ticker */}
        <td className="py-1 px-1 text-xs">
          {isEditingField('ticker') ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value.toUpperCase())}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyPress}
              className="input-field-compact w-full uppercase"
              maxLength={10}
              autoFocus
            />
          ) : (
            <span 
              className="cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded font-mono font-semibold text-blue-600"
              onClick={() => handleStartEdit(trade.id, 'ticker', trade.ticker)}
            >
              {trade.ticker}
            </span>
          )}
        </td>
        
        {/* Price @ Purchase */}
        <td className="py-1 px-1 text-xs">
          <span className="font-mono text-gray-600" title="Stock price at time of purchase">
            {formatCurrency(trade.price_at_purchase)}
          </span>
        </td>
        
        {/* Price Today */}
        <td className="py-1 px-1 text-xs">
          <span className="font-mono text-gray-600" title="Current stock price">
            {currentPrices[trade.ticker] ? formatCurrency(currentPrices[trade.ticker]) : 'Loading...'}
          </span>
        </td>
        
        {/* Option Type */}
        <td className="py-1 px-1 text-xs">
          {isEditingField('option_type') ? (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyPress}
              className="input-field-compact w-full"
              autoFocus
            >
              <option value="Call option">Call option</option>
              <option value="Put option">Put option</option>
              <option value="Covered call">Covered call</option>
              <option value="Cash covered call">Cash covered call</option>
              <option value="Cash secured put">Cash secured put</option>
              <option value="PMCC call option">PMCC call option</option>
              <option value="PMCC covered call">PMCC covered call</option>
            </select>
          ) : (
            <span 
              className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 ${
                trade.option_type === 'Call option' ? 'bg-blue-100 text-blue-800' : 
                trade.option_type === 'Put option' ? 'bg-red-100 text-red-800' :
                trade.option_type === 'Covered call' ? 'bg-yellow-100 text-yellow-800' :
                trade.option_type === 'Cash covered call' ? 'bg-yellow-100 text-yellow-800' :
                trade.option_type === 'Cash secured put' ? 'bg-green-100 text-green-800' :
                trade.option_type === 'PMCC call option' ? 'bg-purple-100 text-purple-800' :
                trade.option_type === 'PMCC covered call' ? 'bg-indigo-100 text-indigo-800' :
                'bg-gray-100 text-gray-800'
              }`}
              onClick={() => handleStartEdit(trade.id, 'option_type', trade.option_type)}
            >
              {trade.option_type}
            </span>
          )}
        </td>
        
        {/* Contracts */}
        <td className="py-1 px-1 text-xs">
          {isEditingField('contracts') ? (
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyPress}
              className="input-field-compact w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              autoFocus
            />
          ) : (
            <span 
              className="cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
              onClick={() => handleStartEdit(trade.id, 'contracts', trade.contracts)}
            >
              {trade.contracts}
            </span>
          )}
        </td>
        
        {/* Strike */}
        <td className="py-1 px-1 text-xs">
          {isEditingField('strike_price') ? (
            <input
              type="number"
              step="0.01"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyPress}
              className="input-field-compact w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              autoFocus
            />
          ) : (
            <span 
              className="cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
              onClick={() => handleStartEdit(trade.id, 'strike_price', trade.strike_price)}
            >
              {formatCurrency(trade.strike_price)}
            </span>
          )}
        </td>
        
        {/* Cost */}
        <td className="py-1 px-1 text-xs">
          {isEditingField('cost') ? (
            <input
              type="number"
              step="0.01"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyPress}
              className={`input-field-compact w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                !['Call option', 'Put option', 'PMCC call option'].includes(trade.option_type) 
                  ? 'bg-gray-100 cursor-not-allowed' 
                  : ''
              }`}
              readOnly={!['Call option', 'Put option', 'PMCC call option'].includes(trade.option_type)}
              title={!['Call option', 'Put option', 'PMCC call option'].includes(trade.option_type) 
                ? 'No cost for covered strategies (you receive premium)' 
                : ''}
              autoFocus
            />
          ) : (
            <span 
              className={`cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded ${
                !['Call option', 'Put option', 'PMCC call option'].includes(trade.option_type) 
                  ? 'text-gray-500' 
                  : ''
              }`}
              onClick={() => handleStartEdit(trade.id, 'cost', trade.cost)}
            >
              {formatCurrency(trade.cost)}
            </span>
          )}
        </td>
        
            {/* Expiration Date */}
            <td className="py-1 px-1 text-xs">
              {isEditingField('expiration_date') ? (
                <input
                  type="date"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleSaveEdit}
                  onKeyDown={handleKeyPress}
                  className="input-field-compact w-full"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-1">
                  <span 
                    className="cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                    onClick={() => handleStartEdit(trade.id, 'expiration_date', trade.expiration_date)}
                  >
                    {format(new Date(trade.expiration_date), 'MMM dd, yyyy')}
                  </span>
                  {isToday(trade.expiration_date) && (
                    <Flag 
                      className="w-4 h-4 text-orange-500"
                    />
                  )}
                </div>
              )}
            </td>
        
        {/* Status */}
        <td className="py-1 px-1 text-xs">
          {isEditingField('status') ? (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyPress}
              className="input-field-compact w-full"
              autoFocus
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          ) : (
            <span 
              className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 ${
                trade.status === 'open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}
              onClick={() => handleStartEdit(trade.id, 'status', trade.status)}
              title="Click to edit status"
            >
              {trade.status.toUpperCase()}
            </span>
          )}
        </td>
        
        {/* PMCC Calc */}
        <td className="py-1 px-1 text-xs">
          {trade.option_type === 'Call option' ? (
            <span 
              className="font-mono text-gray-600 bg-gray-50 px-1 py-0.5 rounded cursor-default"
              title="Auto-calculated for Call options: Strike + (Cost ÷ Contracts ÷ 100)"
            >
              {trade.pmcc_calc ? formatCurrency(trade.pmcc_calc) : 'N/A'}
            </span>
          ) : isEditingField('pmcc_calc') ? (
            <input
              type="number"
              step="0.01"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyPress}
              className="input-field-compact w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0.00"
              autoFocus
            />
          ) : (
            <span 
              className="cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded font-mono text-gray-600"
              onClick={() => handleStartEdit(trade.id, 'pmcc_calc', trade.pmcc_calc || 0)}
            >
              {trade.pmcc_calc ? formatCurrency(trade.pmcc_calc) : 'N/A'}
            </span>
          )}
        </td>
        
        {/* Realized P&L */}
        <td className="py-1 px-1 text-xs">
          {isEditingField('realized_pl') ? (
            <input
              type="number"
              step="0.01"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyPress}
              className="input-field-compact w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0.00"
              autoFocus
            />
          ) : (
            <span 
              className={`cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded font-mono ${getGainLossColor(trade.realized_pl)}`}
              onClick={() => handleStartEdit(trade.id, 'realized_pl', trade.realized_pl || 0)}
            >
              {trade.realized_pl ? formatCurrency(trade.realized_pl) : '$0.00'}
            </span>
          )}
        </td>
        
        {/* Unrealized P&L */}
        <td className="py-1 px-1 text-xs">
          {['Call option', 'Put option', 'PMCC call option'].includes(trade.option_type) ? (
            <span 
              className="font-mono text-gray-600 bg-gray-50 px-1 py-0.5 rounded cursor-default"
              title="Not required for basic options (calculated automatically)"
            >
              {trade.unrealized_pl ? formatCurrency(trade.unrealized_pl) : '$0.00'}
            </span>
          ) : isEditingField('unrealized_pl') ? (
            <input
              type="number"
              step="0.01"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyPress}
              className="input-field-compact w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0.00"
              autoFocus
            />
          ) : (
            <span 
              className={`cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded font-mono ${getGainLossColor(trade.unrealized_pl)}`}
              onClick={() => handleStartEdit(trade.id, 'unrealized_pl', trade.unrealized_pl || 0)}
            >
              {trade.unrealized_pl ? formatCurrency(trade.unrealized_pl) : '$0.00'}
            </span>
          )}
        </td>
        
        {/* Expected Return */}
        <td className="py-1 px-1 text-xs">
          {['Covered call', 'Cash covered call', 'Cash secured put', 'PMCC call option'].includes(trade.option_type) ? (
            <span 
              className="font-mono text-gray-600 bg-gray-50 px-1 py-0.5 rounded cursor-default"
              title="Auto-calculated: (Realized P&L + Unrealized P&L) / ((Strike × 100) × Contracts)"
            >
              {(() => {
                const realizedPl = trade.realized_pl || 0
                const unrealizedPl = trade.unrealized_pl || 0
                const strike = trade.strike_price || 0
                const contracts = trade.contracts || 1
                const denominator = (strike * 100) * contracts
                
                if (denominator === 0) return 'N/A'
                
                const expectedReturn = ((realizedPl + unrealizedPl) / denominator) * 100
                return `${expectedReturn.toFixed(2)}%`
              })()}
            </span>
          ) : isEditingField('expected_return') ? (
            <input
              type="number"
              step="0.01"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyPress}
              className="input-field-compact w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0.00"
              autoFocus
            />
          ) : (
            <span 
              className="cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded font-mono text-gray-600"
              onClick={() => handleStartEdit(trade.id, 'expected_return', trade.expected_return || 0)}
            >
              {trade.expected_return ? `${trade.expected_return}%` : 'N/A'}
            </span>
          )}
        </td>
        
        {/* Audited */}
        <td className="py-1 px-1 text-xs">
          <input
            type="checkbox"
            checked={trade.audited || false}
            onChange={(e) => handleToggleCheckbox(trade.id, 'audited', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
        </td>
        
        {/* Exercised */}
        <td className="py-1 px-1 text-xs">
          <input
            type="checkbox"
            checked={trade.exercised || false}
            onChange={(e) => handleToggleCheckbox(trade.id, 'exercised', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
        </td>
        
        {/* Closed Date */}
        <td className="py-1 px-1 text-xs">
          {isEditingField('closed_date') ? (
            <input
              type="date"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyPress}
              className="input-field-compact w-full"
              autoFocus
            />
          ) : (
            <span 
              className="cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded text-gray-600"
              onClick={() => handleStartEdit(trade.id, 'closed_date', trade.closed_date || '')}
            >
              {trade.closed_date ? format(new Date(trade.closed_date), 'MMM dd, yyyy') : 'N/A'}
            </span>
          )}
        </td>
        
        {/* Actions */}
        <td className="py-1 px-1 text-xs">
          <div className="flex items-center gap-1">
            {trade.status === 'open' && (
              <button
                onClick={() => handleCloseTrade(trade.id)}
                className="text-orange-600 hover:text-orange-800 p-1"
                title="Close Trade"
              >
                <Square className="w-4 h-4" />
              </button>
            )}
            {trade.status === 'closed' && (
              <button
                onClick={() => handleReopenTrade(trade.id)}
                className="text-green-600 hover:text-green-800 p-1"
                title="Reopen Trade"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
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
    )
  }

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2">Loading trades...</span>
        </div>
      </div>
    )
  }

  if (trades.length === 0) {
    return (
      <div className="card">
        
        <div className="text-center py-8">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No trades yet</h3>
          <p className="text-gray-500">Add your first trade using the form above.</p>
        </div>
      </div>
    )
  }

  const renderTable = (trades: Trade[], title: string) => (
    <div className="card mb-1 w-full">
      <h2 className="text-sm font-medium mb-1 text-gray-700">{title}</h2>
      
      <div className="overflow-x-auto w-full">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-gray-200">
                  <th className="text-left py-0.5 px-1 text-xs font-medium text-gray-600">Account</th>
                  <th className="text-left py-0.5 px-1 text-xs font-medium text-gray-600">Date</th>
                  <th className="text-left py-0.5 px-1 text-xs font-medium text-gray-600">Ticker</th>
                  <th className="text-left py-0.5 px-1 text-xs font-medium text-gray-600">Price @ Purchase</th>
                  <th className="text-left py-0.5 px-1 text-xs font-medium text-gray-600">Price Today</th>
                  <th className="text-left py-0.5 px-1 text-xs font-medium text-gray-600">Option Type</th>
                  <th className="text-left py-0.5 px-1 text-xs font-medium text-gray-600">Contracts</th>
                  <th className="text-left py-0.5 px-1 text-xs font-medium text-gray-600">Strike</th>
                  <th className="text-left py-0.5 px-1 text-xs font-medium text-gray-600">Cost</th>
                  <th className="text-left py-0.5 px-1 text-xs font-medium text-gray-600">Expiration Date</th>
                  <th className="text-left py-0.5 px-1 text-xs font-medium text-gray-600">Status</th>
                  <th className="text-left py-0.5 px-1 text-xs font-medium text-gray-600">PMCC Calc</th>
                  <th className="text-left py-0.5 px-1 text-xs font-medium text-gray-600">Realized P&L</th>
                  <th className="text-left py-0.5 px-1 text-xs font-medium text-gray-600">Unrealized P&L</th>
                  <th className="text-left py-0.5 px-1 text-xs font-medium text-gray-600">Expected Return</th>
                  <th className="text-left py-0.5 px-1 text-xs font-medium text-gray-600">Audited</th>
                  <th className="text-left py-0.5 px-1 text-xs font-medium text-gray-600">Exercised</th>
                  <th className="text-left py-0.5 px-1 text-xs font-medium text-gray-600">Closed Date</th>
                  <th className="text-left py-0.5 px-1 text-xs font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => renderTradeRow(trade))}
          </tbody>
        </table>
      </div>
    </div>
  )

      return (
        <div className="max-w-full mb-1">
          {/* All Open Trades organized by account in preferred order */}
          {(() => {
            const openTradesByAccount = getAccountOrder(tradesByAccount).filter(account => 
              tradesByAccount[account]?.open?.length > 0
            )
            
            if (openTradesByAccount.length > 0) {
              return (
                <div className="mb-4">
                  <div className="flex items-center justify-between -m-2 p-2 rounded-lg">
                    <h1 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-1">
                      Open Trades
                    </h1>
                    <button
                      onClick={() => setIsOpenTradesExpanded(!isOpenTradesExpanded)}
                      className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors"
                      title={isOpenTradesExpanded ? "Collapse section" : "Expand section"}
                    >
                      {isOpenTradesExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                  </div>
                  
                  {isOpenTradesExpanded && (
                    <div className="mt-2">
                      {openTradesByAccount.map(account => {
                        const { open } = tradesByAccount[account] || { open: [] }
                        const accountKey = `open-${account}`
                        const isExpanded = isAccountExpanded(accountKey)
                        
                        return (
                          <div key={`open-${account}`} className="mb-2 w-full">
                            <div className="flex items-center justify-between -m-1 p-1 rounded">
                              <h2 className="text-sm font-medium text-gray-700">
                                {account} ({open.length})
                              </h2>
                              <button
                                onClick={() => toggleAccountSection(accountKey)}
                                className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 transition-colors"
                                title={isExpanded ? "Collapse account" : "Expand account"}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                            </div>
                            {isExpanded && (
                              <div className="w-full mt-1">
                                {renderTable(open, '')}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }
            return null
          })()}
          
          {/* All Closed Trades organized by account in preferred order */}
          {(() => {
            const closedTradesByAccount = getAccountOrder(tradesByAccount).filter(account => 
              tradesByAccount[account]?.closed?.length > 0
            )
            
            if (closedTradesByAccount.length > 0) {
              return (
                <div className="mb-4">
                  <div className="flex items-center justify-between -m-2 p-2 rounded-lg">
                    <h1 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-1">
                      Closed Trades
                    </h1>
                    <button
                      onClick={() => setIsClosedTradesExpanded(!isClosedTradesExpanded)}
                      className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors"
                      title={isClosedTradesExpanded ? "Collapse section" : "Expand section"}
                    >
                      {isClosedTradesExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                  </div>
                  
                  {isClosedTradesExpanded && (
                    <div className="mt-2">
                      {closedTradesByAccount.map(account => {
                        const { closed } = tradesByAccount[account] || { closed: [] }
                        const accountKey = `closed-${account}`
                        const isExpanded = isAccountExpanded(accountKey)
                        
                        return (
                          <div key={`closed-${account}`} className="mb-2 w-full">
                            <div className="flex items-center justify-between -m-1 p-1 rounded">
                              <h2 className="text-sm font-medium text-gray-700">
                                {account} ({closed.length})
                              </h2>
                              <button
                                onClick={() => toggleAccountSection(accountKey)}
                                className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 transition-colors"
                                title={isExpanded ? "Collapse account" : "Expand account"}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                            </div>
                            {isExpanded && (
                              <div className="w-full mt-1">
                                {renderTable(closed, '')}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }
            return null
          })()}
      
          {/* Notes Section */}
          <div className="card mb-2 w-full">
            <h2 className="text-sm font-medium mb-1 text-gray-700">Notes</h2>
        <div className="space-y-1">
          <textarea
            placeholder="Add your trading notes, strategies, lessons learned, or any other observations here..."
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={3}
          />
          <div className="flex justify-end">
            <button className="btn-primary text-xs py-0.5 px-2">
              Save Notes
            </button>
          </div>
        </div>
      </div>
      
      {/* Delete All Trades Section */}
      {trades.length > 0 && (
        <div className="card mb-2 w-full">
          <h2 className="text-sm font-medium mb-1 text-gray-700">Danger Zone</h2>
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              Permanently delete all trades from the database. This action cannot be undone.
            </p>
            <button
              onClick={deleteAllTrades}
              disabled={isDeletingAll}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs py-1 px-3 rounded-md transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              {isDeletingAll ? 'Deleting...' : 'Delete All Trades'}
            </button>
          </div>
        </div>
      )}
      
          {/* No trades message */}
          {trades.length === 0 && (
            <div className="card w-full">
              <div className="text-center py-6">
                <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No trades yet</h3>
                <p className="text-xs text-gray-500">Add your first trade using the form above.</p>
              </div>
            </div>
          )}
          
          {/* Show message if no accounts have trades */}
          {Object.keys(tradesByAccount).length === 0 && trades.length > 0 && (
            <div className="card w-full">
              <div className="text-center py-6">
                <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No trades found</h3>
                <p className="text-xs text-gray-500">No trades match the current filters.</p>
              </div>
            </div>
          )}
    </div>
  )
}
