'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, Trade } from '@/lib/supabase'
import { getHistoricalPrices, StockQuote } from '@/lib/stockApi'
import { formatCurrency, formatMarketCap } from '@/lib/calculations'
import { RefreshCw, TrendingUp, TrendingDown, Loader2, ArrowLeft, Plus, X } from 'lucide-react'
import Link from 'next/link'

export default function WatchListPage() {
  const [watchList, setWatchList] = useState<StockQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newTicker, setNewTicker] = useState('')
  const [addingTicker, setAddingTicker] = useState(false)

  // Sorting state
  const [sortField, setSortField] = useState<string>('symbol')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const fetchWatchListData = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      // Get all unique tickers from both trades and manual watch list
      const tickers = new Set<string>()
      
      // Get tickers from trades
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('ticker')
      
      if (tradesError) throw tradesError
      
      trades?.forEach((trade: any) => {
        tickers.add(trade.ticker.toUpperCase())
      })
      
      // Get manually added tickers from localStorage (simple approach)
      const manualTickers = JSON.parse(localStorage.getItem('watchlist_tickers') || '[]')
      manualTickers.forEach((ticker: string) => {
        tickers.add(ticker.toUpperCase())
      })
      
      const uniqueTickers = Array.from(tickers)
      
      if (uniqueTickers.length === 0) {
        setWatchList([])
        setLoading(false)
        setRefreshing(false)
        return
      }

      const stockDataPromises = uniqueTickers.map(ticker => getHistoricalPrices(ticker))
      const results = await Promise.all(stockDataPromises)

      const newWatchList: StockQuote[] = results.map(result => result.data).filter(Boolean) as StockQuote[]
      setWatchList(newWatchList)

    } catch (err) {
      console.error('Error fetching watch list data:', err)
      setError('Failed to fetch watch list data. Please try again.')
      setWatchList([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchWatchListData()
  }, [fetchWatchListData])

  const addTicker = async (ticker: string) => {
    if (!ticker.trim()) return
    
    setAddingTicker(true)
    try {
      // Get current manual tickers
      const manualTickers = JSON.parse(localStorage.getItem('watchlist_tickers') || '[]')
      
      // Check if ticker already exists
      if (manualTickers.includes(ticker.toUpperCase())) {
        alert('Ticker already in watch list!')
        return
      }
      
      // Add new ticker
      manualTickers.push(ticker.toUpperCase())
      localStorage.setItem('watchlist_tickers', JSON.stringify(manualTickers))
      
      // Refresh the watch list
      await fetchWatchListData()
      setNewTicker('')
    } catch (error) {
      console.error('Error adding ticker:', error)
      alert('Failed to add ticker. Please try again.')
    } finally {
      setAddingTicker(false)
    }
  }

  const removeTicker = async (ticker: string) => {
    try {
      // Get current manual tickers
      const manualTickers = JSON.parse(localStorage.getItem('watchlist_tickers') || '[]')
      
      // Remove ticker
      const updatedTickers = manualTickers.filter((t: string) => t !== ticker.toUpperCase())
      localStorage.setItem('watchlist_tickers', JSON.stringify(updatedTickers))
      
      // Refresh the watch list
      await fetchWatchListData()
    } catch (error) {
      console.error('Error removing ticker:', error)
      alert('Failed to remove ticker. Please try again.')
    }
  }

  const handleAddTicker = (e: React.FormEvent) => {
    e.preventDefault()
    addTicker(newTicker)
  }

  const getChangeColor = (change: number | undefined) => {
    if (change === undefined || change === null) return 'text-gray-600'
    return change >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const isManuallyAdded = (ticker: string) => {
    const manualTickers = JSON.parse(localStorage.getItem('watchlist_tickers') || '[]')
    return manualTickers.includes(ticker.toUpperCase())
  }

  const getHistoricalPriceColor = (currentPrice: number, historicalPrice: number | undefined) => {
    if (!historicalPrice) return 'text-gray-600'
    return currentPrice >= historicalPrice ? 'text-green-600' : 'text-red-600'
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

  const getSortedWatchList = (stocksToSort: StockQuote[]) => {
    return [...stocksToSort].sort((a, b) => {
      let aValue: any = a[sortField as keyof StockQuote]
      let bValue: any = b[sortField as keyof StockQuote]

      // Handle different data types
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      } else if (typeof aValue === 'number') {
        aValue = aValue || 0
        bValue = bValue || 0
      } else {
        // Handle undefined/null values
        if (aValue === undefined || aValue === null) aValue = 0
        if (bValue === undefined || bValue === null) bValue = 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <span className="text-gray-400">↕</span>
    }
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="max-w-full mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Link 
            href="/"
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Watch List
          </h1>
        </div>
        <p className="text-gray-600">
          Track current prices and market data for all your traded stocks
        </p>
      </div>

      {/* Add Ticker Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add to Watch List</h2>
          <form onSubmit={handleAddTicker} className="flex gap-2">
            <input
              type="text"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
              placeholder="Enter ticker symbol (e.g., AAPL)"
              className="input-field text-xs py-1 flex-1"
              maxLength={10}
              disabled={addingTicker}
            />
            <button
              type="submit"
              disabled={addingTicker || !newTicker.trim()}
              className="btn-primary text-xs py-1 px-2 flex items-center gap-1"
            >
              {addingTicker ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
              {addingTicker ? 'Adding...' : 'Add'}
            </button>
          </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Market Data ({watchList.length} stocks)</h2>
            <button
              onClick={fetchWatchListData}
              disabled={refreshing}
              className="btn-secondary text-xs py-1 px-2 flex items-center gap-1"
            >
              {refreshing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
              <span className="ml-2 text-sm text-gray-600">Loading watch list...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500 text-sm">
              {error}
            </div>
          ) : watchList.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No tickers in watch list. Add tickers above or create some trades to see them here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th 
                      className="text-left py-1 px-1 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('symbol')}
                    >
                      <div className="flex items-center gap-1">
                        Ticker {getSortIcon('symbol')}
                      </div>
                    </th>
                    <th 
                      className="text-left py-1 px-1 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('price')}
                    >
                      <div className="flex items-center gap-1">
                        Current Price {getSortIcon('price')}
                      </div>
                    </th>
                    <th 
                      className="text-left py-1 px-1 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('change')}
                    >
                      <div className="flex items-center gap-1">
                        Change {getSortIcon('change')}
                      </div>
                    </th>
                    <th 
                      className="text-left py-1 px-1 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('week52Low')}
                    >
                      <div className="flex items-center gap-1">
                        52W Low {getSortIcon('week52Low')}
                      </div>
                    </th>
                    <th 
                      className="text-left py-1 px-1 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('week52High')}
                    >
                      <div className="flex items-center gap-1">
                        52W High {getSortIcon('week52High')}
                      </div>
                    </th>
                    <th 
                      className="text-left py-1 px-1 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('price3DaysAgo')}
                    >
                      <div className="flex items-center gap-1">
                        3 Days Ago {getSortIcon('price3DaysAgo')}
                      </div>
                    </th>
                    <th 
                      className="text-left py-1 px-1 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('price5DaysAgo')}
                    >
                      <div className="flex items-center gap-1">
                        5 Days Ago {getSortIcon('price5DaysAgo')}
                      </div>
                    </th>
                    <th 
                      className="text-left py-1 px-1 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('price1MonthAgo')}
                    >
                      <div className="flex items-center gap-1">
                        1 Month Ago {getSortIcon('price1MonthAgo')}
                      </div>
                    </th>
                    <th 
                      className="text-left py-1 px-1 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('price200DaysAgo')}
                    >
                      <div className="flex items-center gap-1">
                        200 Days Ago {getSortIcon('price200DaysAgo')}
                      </div>
                    </th>
                    <th 
                      className="text-left py-1 px-1 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('price1YearAgo')}
                    >
                      <div className="flex items-center gap-1">
                        1 Year Ago {getSortIcon('price1YearAgo')}
                      </div>
                    </th>
                    <th 
                      className="text-left py-1 px-1 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('marketCap')}
                    >
                      <div className="flex items-center gap-1">
                        Market Cap {getSortIcon('marketCap')}
                      </div>
                    </th>
                    <th 
                      className="text-left py-1 px-1 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('peRatio')}
                    >
                      <div className="flex items-center gap-1">
                        P/E Ratio {getSortIcon('peRatio')}
                      </div>
                    </th>
                    <th className="text-left py-1 px-1 text-xs font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedWatchList(watchList).map((stock) => (
                    <tr key={stock.symbol} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-2 text-sm font-semibold text-blue-600">{stock.symbol}</td>
                      <td className="py-2 px-2 text-sm">{formatCurrency(stock.price)}</td>
                      <td className={`py-2 px-2 text-sm ${getChangeColor(stock.change)}`}>
                        <div className="flex items-center gap-1">
                          {stock.change !== undefined && stock.change !== null && (
                            stock.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                          )}
                          {stock.change ? formatCurrency(stock.change) : 'N/A'} ({stock.changePercent ? `${stock.changePercent.toFixed(2)}%` : 'N/A'})
                        </div>
                      </td>
                      <td className="py-2 px-2 text-sm">{stock.week52Low ? formatCurrency(stock.week52Low) : 'N/A'}</td>
                      <td className="py-2 px-2 text-sm">{stock.week52High ? formatCurrency(stock.week52High) : 'N/A'}</td>
                      <td className={`py-2 px-2 text-sm ${getHistoricalPriceColor(stock.price, stock.price3DaysAgo)}`}>
                        {stock.price3DaysAgo ? formatCurrency(stock.price3DaysAgo) : 'N/A'}
                      </td>
                      <td className={`py-2 px-2 text-sm ${getHistoricalPriceColor(stock.price, stock.price5DaysAgo)}`}>
                        {stock.price5DaysAgo ? formatCurrency(stock.price5DaysAgo) : 'N/A'}
                      </td>
                      <td className={`py-2 px-2 text-sm ${getHistoricalPriceColor(stock.price, stock.price1MonthAgo)}`}>
                        {stock.price1MonthAgo ? formatCurrency(stock.price1MonthAgo) : 'N/A'}
                      </td>
                      <td className={`py-2 px-2 text-sm ${getHistoricalPriceColor(stock.price, stock.price200DaysAgo)}`}>
                        {stock.price200DaysAgo ? formatCurrency(stock.price200DaysAgo) : 'N/A'}
                      </td>
                      <td className={`py-2 px-2 text-sm ${getHistoricalPriceColor(stock.price, stock.price1YearAgo)}`}>
                        {stock.price1YearAgo ? formatCurrency(stock.price1YearAgo) : 'N/A'}
                      </td>
                      <td className="py-2 px-2 text-sm">{stock.marketCap ? formatMarketCap(stock.marketCap) : 'N/A'}</td>
                      <td className="py-2 px-2 text-sm">{stock.peRatio ? stock.peRatio.toFixed(2) : 'N/A'}</td>
                      <td className="py-2 px-2 text-sm">
                        {isManuallyAdded(stock.symbol) ? (
                          <button
                            onClick={() => removeTicker(stock.symbol)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Remove from watch list"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">From trades</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  )
}

