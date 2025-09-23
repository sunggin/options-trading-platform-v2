// Market data API integration

export interface StockPrice {
  symbol: string
  price: number
  change: number
  changePercent: number
  timestamp: string
}

export interface MarketDataResponse {
  success: boolean
  data?: StockPrice
  error?: string
}

// Mock market data service (replace with real API)
export async function fetchStockPrice(symbol: string): Promise<MarketDataResponse> {
  try {
    // This is a mock implementation
    // In a real app, you would integrate with services like:
    // - Alpha Vantage API
    // - Polygon API
    // - Yahoo Finance API
    // - IEX Cloud
    
    const mockPrice = {
      symbol: symbol.toUpperCase(),
      price: Math.random() * 100 + 50, // Random price between $50-$150
      change: (Math.random() - 0.5) * 10, // Random change between -$5 to +$5
      changePercent: (Math.random() - 0.5) * 10, // Random percentage change
      timestamp: new Date().toISOString()
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      success: true,
      data: mockPrice
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Real API integration example (uncomment and configure when ready)
/*
export async function fetchStockPriceAlphaVantage(symbol: string): Promise<MarketDataResponse> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  
  if (!apiKey) {
    return {
      success: false,
      error: 'API key not configured'
    }
  }
  
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
    )
    
    const data = await response.json()
    
    if (data['Error Message']) {
      return {
        success: false,
        error: data['Error Message']
      }
    }
    
    const quote = data['Global Quote']
    if (!quote) {
      return {
        success: false,
        error: 'No data available for symbol'
      }
    }
    
    return {
      success: true,
      data: {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        timestamp: new Date().toISOString()
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}
*/

