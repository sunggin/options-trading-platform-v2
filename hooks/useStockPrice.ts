import { useState, useEffect } from 'react'
import { getStockPrice, StockQuote } from '@/lib/stockApi'

export interface UseStockPriceReturn {
  price: string
  change: string
  changePercent: string
  loading: boolean
  error: string | null
  lastUpdated: string | null
}

export function useStockPrice(ticker: string): UseStockPriceReturn {
  const [data, setData] = useState<StockQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    if (!ticker || ticker.length < 1) {
      setData(null)
      setError(null)
      return
    }

    const fetchPrice = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getStockPrice(ticker)
        
        if (response.success && response.data) {
          setData(response.data)
          setLastUpdated(new Date().toLocaleTimeString())
        } else {
          setError(response.error || 'Failed to fetch stock price')
        }
      } catch (err) {
        setError('Network error fetching stock price')
        console.error('Stock price fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    // Debounce the API call
    const timeoutId = setTimeout(fetchPrice, 500)
    return () => clearTimeout(timeoutId)
  }, [ticker])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  return {
    price: data ? formatCurrency(data.price) : '$0.00',
    change: data ? formatCurrency(data.change) : '$0.00',
    changePercent: data ? formatPercent(data.changePercent) : '+0.00%',
    loading,
    error,
    lastUpdated
  }
}

