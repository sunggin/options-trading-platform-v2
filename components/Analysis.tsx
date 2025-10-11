'use client'

import { useState, useEffect } from 'react'
import { supabase, Trade } from '@/lib/supabase'
import { Edit2, Trash2, Save, X, DollarSign, TrendingUp, TrendingDown, Square, RotateCcw, Flag, BarChart3, Download, Share2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { getStockPrice } from '@/lib/stockApi'

export default function Analysis() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [editingField, setEditingField] = useState<{ tradeId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({})
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all')
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
  const [filterClosedDateFrom, setFilterClosedDateFrom] = useState<string>('')
  const [filterClosedDateTo, setFilterClosedDateTo] = useState<string>('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false)

  // Sorting state
  const [sortField, setSortField] = useState<string>('trading_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
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

  // Filter trades based on current filters
  const getFilteredTrades = () => {
    let filtered = trades

    // Basic filters
    if (filterStatus !== 'all') {
      filtered = filtered.filter(trade => trade.status === filterStatus)
    }

    if (filterAccount !== 'all') {
      filtered = filtered.filter(trade => trade.account === filterAccount)
    }

    // Text filters
    if (filterTicker) {
      filtered = filtered.filter(trade => 
        trade.ticker.toLowerCase().includes(filterTicker.toLowerCase())
      )
    }

    if (filterOptionType !== 'all') {
      filtered = filtered.filter(trade => trade.option_type === filterOptionType)
    }

    // Date range filters
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

    // Numeric range filters
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

    // Boolean filters
    if (filterAudited !== 'all') {
      const auditedValue = filterAudited === 'true'
      filtered = filtered.filter(trade => (trade.audited || false) === auditedValue)
    }

    if (filterExercised !== 'all') {
      const exercisedValue = filterExercised === 'true'
      filtered = filtered.filter(trade => (trade.exercised || false) === exercisedValue)
    }

    // Closed date range filters
    if (filterClosedDateFrom) {
      filtered = filtered.filter(trade => trade.closed_date && trade.closed_date >= filterClosedDateFrom)
    }

    if (filterClosedDateTo) {
      filtered = filtered.filter(trade => trade.closed_date && trade.closed_date <= filterClosedDateTo)
    }

    return filtered
  }

  // Sorting functions
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortedTrades = (tradesToSort: any[]) => {
    return [...tradesToSort].sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      // Handle different data types
      if (sortField === 'trading_date' || sortField === 'expiration_date' || sortField === 'closed_date') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      } else if (typeof aValue === 'number') {
        aValue = aValue || 0
        bValue = bValue || 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  const tradesByAccount = getTradesByAccount()
  const filteredTrades = getSortedTrades(getFilteredTrades())

  // Helper functions
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
    setFilterClosedDateFrom('')
    setFilterClosedDateTo('')
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
    if (filterClosedDateFrom || filterClosedDateTo) count++
    return count
  }

  // Get unique values for dropdowns
  const uniqueAccounts = Array.from(new Set(trades.map(trade => trade.account)))
  const uniqueOptionTypes = Array.from(new Set(trades.map(trade => trade.option_type)))

  useEffect(() => {
    fetchTrades()
  }, [])

  useEffect(() => {
    if (trades.length > 0) {
      fetchCurrentPrices()
    }
  }, [trades])


  const fetchTrades = async () => {
    setLoading(true)
    try {
      console.log('Analysis: Starting to fetch trades...')
      
      // Get current user from auth context
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('Analysis: No user found')
        setTrades([])
        setLoading(false)
        return
      }

      console.log('Analysis: User found:', user.id)

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id) // Filter by current user's ID
        .order('status', { ascending: true }) // 'open' comes before 'closed' alphabetically
        .order('trading_date', { ascending: false }) // Most recent first within each status

      if (error) {
        console.error('Analysis: Supabase error:', error)
        throw error
      }

      console.log('Analysis: Trades fetched successfully:', data?.length || 0, 'trades')
      setTrades(data || [])
    } catch (error) {
      console.error('Analysis: Error fetching trades:', error)
      setTrades([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentPrices = async () => {
    try {
      // Get unique tickers from all trades
      const uniqueTickers = Array.from(new Set(trades.map(trade => trade.ticker.toUpperCase())))
      
      // Fetch current prices for all unique tickers
      const pricePromises = uniqueTickers.map(async (ticker) => {
        try {
          const result = await getStockPrice(ticker)
          return { ticker, price: result.success ? result.data?.price || 0 : 0 }
        } catch (error) {
          console.error(`Error fetching price for ${ticker}:`, error)
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
      console.error('Error fetching current prices:', error)
    }
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

      // Convert value based on field type
      if (field === 'contracts') {
        updateValue = parseInt(editValue) || 0
      } else if (['cost', 'strike_price', 'pmcc_calc', 'realized_pl', 'unrealized_pl', 'expected_return'].includes(field)) {
        updateValue = parseFloat(editValue) || 0
      } else if (field === 'audited' || field === 'exercised') {
        updateValue = editValue === 'true'
      }

      console.log('Updating field:', field, 'to:', updateValue, 'for trade:', tradeId)

      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Authentication error:', authError)
        throw new Error(`Authentication failed: ${authError.message}`)
      }
      if (!user) {
        throw new Error('User not authenticated')
      }
      console.log('User authenticated:', user.id)

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
          console.log('Auto-calculated PMCC:', pmccCalc, 'for Call option - strike:', strikePrice, 'cost:', cost, 'contracts:', contracts)
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
            console.log('Auto-calculated Expected Return:', expectedReturn.toFixed(2) + '%', 'for', optionType, '- realized:', realizedPl, 'unrealized:', unrealizedPl, 'strike:', strikePrice, 'contracts:', contracts)
          }
        }
      }

      console.log('Sending update to Supabase:', {
        table: 'trades',
        data: updateData,
        tradeId: tradeId,
        user: user.id
      })

      const { error } = await supabase
        .from('trades')
        .update(updateData)
        .eq('id', tradeId)

      if (error) {
        console.error('Supabase error:', error)
        console.error('Supabase error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      console.log('Field updated successfully')
      setEditingField(null)
      setEditValue('')
      fetchTrades()
    } catch (error) {
      console.error('Error updating field:', error)
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        field: editingField?.field,
        value: editValue,
        tradeId: editingField?.tradeId
      })
      
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

  const handleShareTrade = async (trade: Trade) => {
    try {
      // Get existing shared trades from localStorage
      const existingShares = JSON.parse(localStorage.getItem('shared_trades') || '[]')
      
      // Create share object with trade details and metadata
      const sharedTrade = {
        id: `share_${Date.now()}`,
        tradeId: trade.id,
        ticker: trade.ticker,
        account: trade.account,
        optionType: trade.option_type,
        contracts: trade.contracts,
        cost: trade.cost,
        strikePrice: trade.strike_price,
        expirationDate: trade.expiration_date,
        tradingDate: trade.trading_date,
        status: trade.status,
        realizedPl: trade.realized_pl,
        unrealizedPl: trade.unrealized_pl,
        currentPrice: currentPrices[trade.ticker],
        sharedAt: new Date().toISOString(),
        sharedBy: 'You'
      }
      
      // Add to shared trades
      existingShares.unshift(sharedTrade) // Add to beginning
      
      // Keep only last 50 shares to avoid localStorage limits
      const limitedShares = existingShares.slice(0, 50)
      
      // Save to localStorage
      localStorage.setItem('shared_trades', JSON.stringify(limitedShares))
      
      alert(`Trade shared successfully! Check the Social page to see it.`)
    } catch (error) {
      console.error('Error sharing trade:', error)
      alert('Failed to share trade. Please try again.')
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
      console.error('Error deleting trade:', error)
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

  // Helper function to parse date strings without timezone issues
  const formatDate = (dateString: string) => {
    try {
      // parseISO handles ISO date strings properly without timezone conversion
      return format(parseISO(dateString), 'MMM dd, yyyy')
    } catch (error) {
      console.error('Error parsing date:', dateString, error)
      return dateString
    }
  }

  // Export filtered trades to CSV
  const exportToCSV = () => {
    const filteredTrades = getSortedTrades(getFilteredTrades())
    
    if (filteredTrades.length === 0) {
      alert('No trades to export. Please adjust your filters.')
      return
    }

    // Define CSV headers
    const headers = [
      'Account',
      'Trading Date',
      'Ticker',
      'Price @ Purchase',
      'Price Today',
      'Strike Price',
      'Option Type',
      'Contracts',
      'Cost',
      'Expiration Date',
      'Status',
      'Realized P&L',
      'Unrealized P&L',
      'PMCC Calc',
      'Expected Return',
      'Audited',
      'Exercised',
      'Priority',
      'Closed Date'
    ]

    // Convert trades to CSV rows
    const rows = filteredTrades.map(trade => [
      trade.account || '',
      trade.trading_date || '',
      trade.ticker || '',
      trade.price_at_purchase || '',
      currentPrices[trade.ticker] || '',
      trade.strike_price || '',
      trade.option_type || '',
      trade.contracts || '',
      trade.cost || '',
      trade.expiration_date || '',
      trade.status || '',
      trade.realized_pl || '',
      trade.unrealized_pl || '',
      trade.pmcc_calc || '',
      trade.expected_return || '',
      trade.audited ? 'Yes' : 'No',
      trade.exercised ? 'Yes' : 'No',
      trade.priority ? 'Yes' : 'No',
      trade.closed_date || ''
    ])

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape cells that contain commas, quotes, or newlines
        const cellStr = String(cell)
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      }).join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `trades_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleToggleCheckbox = async (tradeId: string, field: 'audited' | 'exercised', value: boolean) => {
    try {
      const { error } = await supabase
        .from('trades')
        .update({ [field]: value })
        .eq('id', tradeId)

      if (error) throw error
      fetchTrades()
    } catch (error) {
      console.error(`Error updating ${field}:`, error)
      alert(`Failed to update ${field}`)
    }
  }

  const handleCloseTrade = async (tradeId: string) => {
    try {
      console.log('Closing trade:', tradeId)
      const today = new Date().toISOString().split('T')[0] // Get today's date in YYYY-MM-DD format
      console.log('Setting closed date to:', today)
      
      const { error } = await supabase
        .from('trades')
        .update({ 
          status: 'closed',
          closed_date: today
        })
        .eq('id', tradeId)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Trade closed successfully')
      fetchTrades()
    } catch (error) {
      console.error('Error closing trade:', error)
      alert(`Failed to close trade: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleReopenTrade = async (tradeId: string) => {
    try {
      console.log('Reopening trade:', tradeId)
      
      const { error } = await supabase
        .from('trades')
        .update({ 
          status: 'open',
          closed_date: null // Clear the closed date
        })
        .eq('id', tradeId)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Trade reopened successfully')
      fetchTrades()
    } catch (error) {
      console.error('Error reopening trade:', error)
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
              {formatDate(trade.trading_date)}
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
                {formatDate(trade.expiration_date)}
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
              {trade.closed_date ? formatDate(trade.closed_date) : 'N/A'}
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
              onClick={() => handleShareTrade(trade)}
              className="text-blue-600 hover:text-blue-800 p-1"
              title="Share to Social Feed"
            >
              <Share2 className="w-4 h-4" />
            </button>
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
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No trades found</h3>
          <p className="text-gray-500">Add your first trade using the form on the dashboard.</p>
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
              <th 
                className="text-left py-0.5 px-1 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('account')}
              >
                <div className="flex items-center gap-1">
                  Account
                  {sortField === 'account' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="text-left py-0.5 px-1 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('trading_date')}
              >
                <div className="flex items-center gap-1">
                  Date
                  {sortField === 'trading_date' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="text-left py-0.5 px-1 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('ticker')}
              >
                <div className="flex items-center gap-1">
                  Ticker
                  {sortField === 'ticker' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="text-left py-0.5 px-1 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('price_at_purchase')}
              >
                <div className="flex items-center gap-1">
                  Price @ Purchase
                  {sortField === 'price_at_purchase' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className="text-left py-0.5 px-1 text-xs font-medium text-gray-600">Price Today</th>
              <th 
                className="text-left py-0.5 px-1 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('strike_price')}
              >
                <div className="flex items-center gap-1">
                  Strike
                  {sortField === 'strike_price' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="text-left py-0.5 px-1 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('option_type')}
              >
                <div className="flex items-center gap-1">
                  Option Type
                  {sortField === 'option_type' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="text-left py-0.5 px-1 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('contracts')}
              >
                <div className="flex items-center gap-1">
                  Contracts
                  {sortField === 'contracts' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="text-left py-0.5 px-1 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('cost')}
              >
                <div className="flex items-center gap-1">
                  Cost
                  {sortField === 'cost' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="text-left py-0.5 px-1 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('expiration_date')}
              >
                <div className="flex items-center gap-1">
                  Expiration Date
                  {sortField === 'expiration_date' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="text-left py-0.5 px-1 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  {sortField === 'status' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className="text-left py-0.5 px-1 text-xs font-medium text-gray-600">PMCC Calc</th>
              <th 
                className="text-left py-0.5 px-1 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('realized_pl')}
              >
                <div className="flex items-center gap-1">
                  Realized P&L
                  {sortField === 'realized_pl' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="text-left py-0.5 px-1 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('unrealized_pl')}
              >
                <div className="flex items-center gap-1">
                  Unrealized P&L
                  {sortField === 'unrealized_pl' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="text-left py-0.5 px-1 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('expected_return')}
              >
                <div className="flex items-center gap-1">
                  Expected Return
                  {sortField === 'expected_return' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="text-left py-0.5 px-1 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('audited')}
              >
                <div className="flex items-center gap-1">
                  Audited
                  {sortField === 'audited' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="text-left py-0.5 px-1 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('exercised')}
              >
                <div className="flex items-center gap-1">
                  Exercised
                  {sortField === 'exercised' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="text-left py-0.5 px-1 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('closed_date')}
              >
                <div className="flex items-center gap-1">
                  Closed Date
                  {sortField === 'closed_date' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h1 className="text-lg font-semibold text-gray-900">Trade Analysis</h1>
        </div>
        <div className="text-sm text-gray-600">
          Total: {trades.length} trades
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
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
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'open' | 'closed')}
              className="input-field text-sm py-1"
            >
              <option value="all">All ({trades.length})</option>
              <option value="open">Open ({trades.filter(t => t.status === 'open').length})</option>
              <option value="closed">Closed ({trades.filter(t => t.status === 'closed').length})</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Account</label>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="input-field text-sm py-1"
            >
              <option value="all">All Accounts</option>
              {uniqueAccounts.map(account => (
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
              className="input-field text-sm py-1 uppercase"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Option Type</label>
            <select
              value={filterOptionType}
              onChange={(e) => setFilterOptionType(e.target.value)}
              className="input-field text-sm py-1"
            >
              <option value="all">All Types</option>
              {uniqueOptionTypes.map(type => (
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
                    className="input-field text-sm py-1"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={filterTradingDateTo}
                    onChange={(e) => setFilterTradingDateTo(e.target.value)}
                    className="input-field text-sm py-1"
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
                    className="input-field text-sm py-1"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={filterExpirationDateTo}
                    onChange={(e) => setFilterExpirationDateTo(e.target.value)}
                    className="input-field text-sm py-1"
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
                    className="input-field text-sm py-1"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={filterStrikePriceMax}
                    onChange={(e) => setFilterStrikePriceMax(e.target.value)}
                    className="input-field text-sm py-1"
                    placeholder="Max"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-700">Cost Range</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={filterCostMin}
                    onChange={(e) => setFilterCostMin(e.target.value)}
                    className="input-field text-sm py-1"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={filterCostMax}
                    onChange={(e) => setFilterCostMax(e.target.value)}
                    className="input-field text-sm py-1"
                    placeholder="Max"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-700">Realized P&L Range</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={filterRealizedPlMin}
                    onChange={(e) => setFilterRealizedPlMin(e.target.value)}
                    className="input-field text-sm py-1"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={filterRealizedPlMax}
                    onChange={(e) => setFilterRealizedPlMax(e.target.value)}
                    className="input-field text-sm py-1"
                    placeholder="Max"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-700">Unrealized P&L Range</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={filterUnrealizedPlMin}
                    onChange={(e) => setFilterUnrealizedPlMin(e.target.value)}
                    className="input-field text-sm py-1"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={filterUnrealizedPlMax}
                    onChange={(e) => setFilterUnrealizedPlMax(e.target.value)}
                    className="input-field text-sm py-1"
                    placeholder="Max"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-700">Audited</h4>
                <select
                  value={filterAudited}
                  onChange={(e) => setFilterAudited(e.target.value)}
                  className="input-field text-sm py-1"
                >
                  <option value="all">All</option>
                  <option value="true">Yes ({trades.filter(t => t.audited).length})</option>
                  <option value="false">No ({trades.filter(t => !t.audited).length})</option>
                </select>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-700">Exercised</h4>
                <select
                  value={filterExercised}
                  onChange={(e) => setFilterExercised(e.target.value)}
                  className="input-field text-sm py-1"
                >
                  <option value="all">All</option>
                  <option value="true">Yes ({trades.filter(t => t.exercised).length})</option>
                  <option value="false">No ({trades.filter(t => !t.exercised).length})</option>
                </select>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-700">Closed Date Range</h4>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={filterClosedDateFrom}
                    onChange={(e) => setFilterClosedDateFrom(e.target.value)}
                    className="input-field text-sm py-1"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={filterClosedDateTo}
                    onChange={(e) => setFilterClosedDateTo(e.target.value)}
                    className="input-field text-sm py-1"
                    placeholder="To"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-600">
            Showing {filteredTrades.length} of {trades.length} trades
            {getActiveFilterCount() > 0 && (
              <span className="ml-2 text-blue-600">
                ({getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} applied)
              </span>
            )}
          </div>
          
          {filteredTrades.length > 0 && (
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              title="Export filtered trades to CSV"
            >
              <Download className="w-3 h-3" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* P&L Totals for Filtered Trades */}
      {(() => {
        const allFilteredTrades = filteredTrades
        
        if (allFilteredTrades.length > 0) {
          // Calculate totals for filtered trades
          const totalRealizedPl = allFilteredTrades.reduce((sum, trade) => sum + (trade.realized_pl || 0), 0)
          const totalUnrealizedPl = allFilteredTrades.reduce((sum, trade) => sum + (trade.unrealized_pl || 0), 0)
          const totalOverallPl = totalRealizedPl + totalUnrealizedPl
          const totalCost = allFilteredTrades.reduce((sum, trade) => sum + (trade.cost || 0), 0)
          
          return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Filtered Trade Analysis Totals</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {formatCurrency(totalCost)}
                  </div>
                  <div className="text-xs text-gray-600">Total Cost</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${totalRealizedPl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totalRealizedPl)}
                  </div>
                  <div className="text-xs text-gray-600">Total Realized P&L</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${totalUnrealizedPl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totalUnrealizedPl)}
                  </div>
                  <div className="text-xs text-gray-600">Total Unrealized P&L</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${totalOverallPl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totalOverallPl)}
                  </div>
                  <div className="text-xs text-gray-600">Total Overall P&L</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 text-center">
                Based on {allFilteredTrades.length} filtered trade{allFilteredTrades.length !== 1 ? 's' : ''}
              </div>
            </div>
          )
        }
        return null
      })()}

      {/* All Trades in one continuous table */}
      {(() => {
        // Use the sorted filtered trades
        const allFilteredTrades = filteredTrades
        
        if (allFilteredTrades.length > 0) {
          return (
            <div className="w-full">
              {renderTable(allFilteredTrades, '')}
            </div>
          )
        }
        return null
      })()}

      {/* Show message if no trades match filters */}
      {filteredTrades.length === 0 && trades.length > 0 && (
        <div className="card w-full">
          <div className="text-center py-6">
            <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No trades match filters</h3>
            <p className="text-xs text-gray-500">Try adjusting your filter criteria.</p>
          </div>
        </div>
      )}
    </div>
  )
}
