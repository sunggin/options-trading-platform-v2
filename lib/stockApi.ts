import axios from 'axios'

export interface StockQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  timestamp: string
  source: string
  // Additional fields for watch list
  week52High?: number
  week52Low?: number
  marketCap?: number
  peRatio?: number
  // Historical price fields
  price3DaysAgo?: number
  price5DaysAgo?: number
  price1MonthAgo?: number
  price200DaysAgo?: number
  price1YearAgo?: number
  // SMA fields
  sma1?: number
  sma3?: number
  sma5?: number
  sma10?: number
  sma20?: number
  sma30?: number
  sma50?: number
  sma90?: number
  sma100?: number
  sma200?: number
  sma365?: number
}

export interface StockApiResponse {
  success: boolean
  data?: StockQuote
  error?: string
}

// Stock API service with multiple reliable sources
class StockApiService {
  private readonly apis = [
    {
      name: 'Yahoo Finance Direct',
      url: 'https://query1.finance.yahoo.com/v8/finance/chart',
      method: 'GET'
    },
    {
      name: 'Yahoo Finance CORS Proxy',
      url: 'https://api.allorigins.win/raw',
      params: {
        url: 'https://query1.finance.yahoo.com/v8/finance/chart'
      }
    },
    {
      name: 'Polygon.io',
      url: 'https://api.polygon.io/v2/aggs/ticker',
      params: {
        apikey: 'demo' // Free tier available
      }
    },
    {
      name: 'Finnhub',
      url: 'https://finnhub.io/api/v1/quote',
      params: {
        token: process.env.NEXT_PUBLIC_FINNHUB_KEY || 'demo'
      }
    },
    {
      name: 'Alpha Vantage',
      url: 'https://www.alphavantage.co/query',
      params: {
        function: 'GLOBAL_QUOTE',
        apikey: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || 'demo'
      }
    }
  ]

  async getStockPrice(symbol: string): Promise<StockApiResponse> {
    console.log(`Fetching stock price for ${symbol}...`)
    
    // Try each API in order until one succeeds
    for (const api of this.apis) {
      try {
        console.log(`Trying ${api.name}...`)
        const result = await this.tryApi(api, symbol)
        if (result.success) {
          console.log(`✅ ${api.name} succeeded:`, result.data)
          return result
        } else {
          console.warn(`❌ ${api.name} failed:`, result.error)
        }
      } catch (error) {
        console.warn(`❌ ${api.name} error:`, error)
        continue
      }
    }

    // If all APIs fail, return mock data for development
    console.log('All APIs failed, using mock data')
    return this.getMockData(symbol)
  }

  private async tryApi(api: any, symbol: string): Promise<StockApiResponse> {
    let config: any = {
      method: 'GET',
      url: api.url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        ...api.headers
      },
      timeout: 10000
    }

    // Handle different API endpoints
    if (api.name === 'Yahoo Finance Direct') {
      config.url = `${api.url}/${symbol.toUpperCase()}`
      config.params = {
        interval: '1d',
        range: '1d',
        includePrePost: 'true',
        useYfid: 'true',
        corsDomain: 'finance.yahoo.com'
      }
    } else if (api.name === 'Yahoo Finance CORS Proxy') {
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?interval=1d&range=1d&includePrePost=true&useYfid=true&corsDomain=finance.yahoo.com`
      config.url = api.url
      config.params = {
        ...api.params,
        url: yahooUrl
      }
    } else if (api.name === 'Polygon.io') {
      config.url = `${api.url}/${symbol.toUpperCase()}/prev`
      config.params = {
        ...api.params
      }
    } else if (api.name === 'Alpha Vantage') {
      config.params = {
        ...api.params,
        symbol: symbol.toUpperCase()
      }
    } else if (api.name === 'Finnhub') {
      config.url = `${api.url}?symbol=${symbol.toUpperCase()}&token=${api.params.token}`
      config.params = undefined
    }

    const response = await axios(config)
    return this.parseResponse(api.name, response.data, symbol)
  }

  private parseResponse(apiName: string, data: any, symbol: string): StockApiResponse {
    try {
      switch (apiName) {
        case 'Yahoo Finance Direct':
        case 'Yahoo Finance CORS Proxy':
          return this.parseYahooFinanceChart(data, symbol)
        case 'Polygon.io':
          return this.parsePolygon(data, symbol)
        case 'Alpha Vantage':
          return this.parseAlphaVantage(data, symbol)
        case 'Finnhub':
          return this.parseFinnhub(data, symbol)
        default:
          throw new Error('Unknown API')
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse response from ${apiName}: ${error}`
      }
    }
  }

  private parseYahooFinanceChart(data: any, symbol: string): StockApiResponse {
    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0]
      const meta = result.meta
      const quote = result.indicators?.quote?.[0]
      
      if (meta && quote) {
        const currentPrice = meta.regularMarketPrice || meta.previousClose || 0
        const previousClose = meta.previousClose || 0
        const change = currentPrice - previousClose
        const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0

        return {
          success: true,
          data: {
            symbol: meta.symbol || symbol,
            price: parseFloat(currentPrice.toString()),
            change: parseFloat(change.toString()),
            changePercent: parseFloat(changePercent.toString()),
            timestamp: new Date().toISOString(),
            source: 'Yahoo Finance'
          }
        }
      }
    }
    throw new Error('Invalid Yahoo Finance chart response')
  }

  private parseYahooFinanceQuote(data: any, symbol: string): StockApiResponse {
    if (data.quoteSummary && data.quoteSummary.result && data.quoteSummary.result[0]) {
      const result = data.quoteSummary.result[0]
      const price = result.price
      const summaryDetail = result.summaryDetail

      if (price) {
        const currentPrice = price.regularMarketPrice?.raw || price.regularMarketPrice || 0
        const previousClose = summaryDetail?.previousClose?.raw || summaryDetail?.previousClose || currentPrice
        const change = currentPrice - previousClose
        const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0

        return {
          success: true,
          data: {
            symbol: price.symbol || symbol,
            price: parseFloat(currentPrice.toString()),
            change: parseFloat(change.toString()),
            changePercent: parseFloat(changePercent.toString()),
            timestamp: new Date().toISOString(),
            source: 'Yahoo Finance'
          }
        }
      }
    }
    throw new Error('Invalid Yahoo Finance quote response')
  }

  private parseAlphaVantage(data: any, symbol: string): StockApiResponse {
    if (data['Global Quote']) {
      const quote = data['Global Quote']
      return {
        success: true,
        data: {
          symbol: quote['01. symbol'] || symbol,
          price: parseFloat(quote['05. price'] || 0),
          change: parseFloat(quote['09. change'] || 0),
          changePercent: parseFloat(quote['10. change percent']?.replace('%', '') || 0),
          week52High: parseFloat(quote['03. high'] || 0),
          week52Low: parseFloat(quote['04. low'] || 0),
          timestamp: new Date().toISOString(),
          source: 'Alpha Vantage'
        }
      }
    }
    throw new Error('Invalid Alpha Vantage response')
  }

  private parseFinnhub(data: any, symbol: string): StockApiResponse {
    if (data.c && data.d !== undefined) {
      const currentPrice = data.c
      const change = data.d
      const changePercent = data.dp || 0
      const high = data.h || 0
      const low = data.l || 0
      const open = data.o || 0
      const previousClose = data.pc || currentPrice

      return {
        success: true,
        data: {
          symbol: symbol.toUpperCase(),
          price: parseFloat(currentPrice.toString()),
          change: parseFloat(change.toString()),
          changePercent: parseFloat(changePercent.toString()),
          week52High: parseFloat(high.toString()),
          week52Low: parseFloat(low.toString()),
          timestamp: new Date().toISOString(),
          source: 'Finnhub'
        }
      }
    }
    throw new Error('Invalid Finnhub response')
  }

  private parseIEXCloud(data: any, symbol: string): StockApiResponse {
    if (data.latestPrice !== undefined) {
      const currentPrice = data.latestPrice
      const change = data.change || 0
      const changePercent = data.changePercent || 0

      return {
        success: true,
        data: {
          symbol: data.symbol || symbol.toUpperCase(),
          price: parseFloat(currentPrice.toString()),
          change: parseFloat(change.toString()),
          changePercent: parseFloat((changePercent * 100).toString()),
          timestamp: new Date().toISOString(),
          source: 'IEX Cloud'
        }
      }
    }
    throw new Error('Invalid IEX Cloud response')
  }

  private parsePolygon(data: any, symbol: string): StockApiResponse {
    if (data.results && data.results.length > 0) {
      const result = data.results[0]
      const currentPrice = result.c || result.close
      const openPrice = result.o || result.open
      const change = currentPrice - openPrice
      const changePercent = openPrice ? (change / openPrice) * 100 : 0

      return {
        success: true,
        data: {
          symbol: symbol.toUpperCase(),
          price: parseFloat(currentPrice.toString()),
          change: parseFloat(change.toString()),
          changePercent: parseFloat(changePercent.toString()),
          week52High: parseFloat((result.h || currentPrice).toString()),
          week52Low: parseFloat((result.l || currentPrice).toString()),
          timestamp: new Date().toISOString(),
          source: 'Polygon.io'
        }
      }
    }
    throw new Error('Invalid Polygon.io response')
  }

  private getMockData(symbol: string): StockApiResponse {
    // Generate realistic mock data for development
    // Use symbol-based pricing for more realistic data
    const symbolHash = symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    const basePrice = 50 + (symbolHash % 200) // $50-$250 range based on symbol
    const change = (Math.random() - 0.5) * (basePrice * 0.05) // ±5% change
    const changePercent = (change / basePrice) * 100
    
    // Generate additional mock data
    const week52High = basePrice * (1.1 + Math.random() * 0.3) // 10-40% above current
    const week52Low = basePrice * (0.6 + Math.random() * 0.3) // 30-60% below current
    const marketCap = (basePrice * (1000000 + Math.random() * 9000000)) // 1M-10M shares
    const peRatio = 10 + Math.random() * 30 // P/E between 10-40
    
    // Generate SMA values (typically close to current price with some variation)
    const smaVariation = 0.02 // 2% variation for very short periods
    const sma1 = basePrice * (1 + (Math.random() - 0.5) * smaVariation)
    const sma3 = basePrice * (1 + (Math.random() - 0.5) * smaVariation * 1.2)
    const sma5 = basePrice * (1 + (Math.random() - 0.5) * smaVariation * 1.5)
    const sma10 = basePrice * (1 + (Math.random() - 0.5) * smaVariation * 2)
    const sma30 = basePrice * (1 + (Math.random() - 0.5) * smaVariation * 2.5)
    const sma90 = basePrice * (1 + (Math.random() - 0.5) * smaVariation * 3)
    const sma200 = basePrice * (1 + (Math.random() - 0.5) * smaVariation * 3.5)
    const sma365 = basePrice * (1 + (Math.random() - 0.5) * smaVariation * 4)

    return {
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        price: Math.round(basePrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        week52High: Math.round(week52High * 100) / 100,
        week52Low: Math.round(week52Low * 100) / 100,
        marketCap: Math.round(marketCap),
        peRatio: Math.round(peRatio * 10) / 10,
        sma1: Math.round(sma1 * 100) / 100,
        sma3: Math.round(sma3 * 100) / 100,
        sma5: Math.round(sma5 * 100) / 100,
        sma10: Math.round(sma10 * 100) / 100,
        sma30: Math.round(sma30 * 100) / 100,
        sma90: Math.round(sma90 * 100) / 100,
        sma200: Math.round(sma200 * 100) / 100,
        sma365: Math.round(sma365 * 100) / 100,
        timestamp: new Date().toISOString(),
        source: 'Mock Data (Development - Get API keys for real prices)'
      }
    }
  }
}

// Export singleton instance
export const stockApi = new StockApiService()

// Convenience function for easy use
export async function getStockPrice(symbol: string): Promise<StockApiResponse> {
  return stockApi.getStockPrice(symbol)
}

// Function to get historical prices for specific dates
export async function getHistoricalPrices(symbol: string): Promise<StockApiResponse> {
  console.log(`Fetching historical prices for ${symbol}...`)
  
  try {
    // For now, we'll use mock data since most free APIs don't provide historical data
    // In a real implementation, you would use APIs like Alpha Vantage, Yahoo Finance, or IEX Cloud
    const mockHistoricalData = generateMockHistoricalData(symbol)
    return {
      success: true,
      data: mockHistoricalData
    }
  } catch (error) {
    console.error('Error fetching historical prices:', error)
    return {
      success: false,
      error: 'Failed to fetch historical prices'
    }
  }
}

// Generate mock historical data for development
function generateMockHistoricalData(symbol: string): StockQuote {
  const symbolHash = symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  const basePrice = 50 + (symbolHash % 200) // $50-$250 range based on symbol
  const change = (Math.random() - 0.5) * (basePrice * 0.05) // ±5% change
  const changePercent = (change / basePrice) * 100
  
  // Generate historical prices with realistic variations
  const currentPrice = basePrice
  const price3DaysAgo = currentPrice * (0.95 + Math.random() * 0.1) // ±5% variation
  const price5DaysAgo = currentPrice * (0.90 + Math.random() * 0.2) // ±10% variation
  const price1MonthAgo = currentPrice * (0.80 + Math.random() * 0.4) // ±20% variation
  const price200DaysAgo = currentPrice * (0.70 + Math.random() * 0.6) // ±30% variation
  const price1YearAgo = currentPrice * (0.50 + Math.random() * 1.0) // ±50% variation
  
  const week52High = currentPrice * (1.1 + Math.random() * 0.3) // 10-40% above current
  const week52Low = currentPrice * (0.6 + Math.random() * 0.3) // 30-60% below current
  const marketCap = (currentPrice * (1000000 + Math.random() * 9000000)) // 1M-10M shares
  const peRatio = 10 + Math.random() * 30 // P/E between 10-40

  return {
    symbol: symbol.toUpperCase(),
    price: Math.round(currentPrice * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    week52High: Math.round(week52High * 100) / 100,
    week52Low: Math.round(week52Low * 100) / 100,
    marketCap: Math.round(marketCap),
    peRatio: Math.round(peRatio * 10) / 10,
    price3DaysAgo: Math.round(price3DaysAgo * 100) / 100,
    price5DaysAgo: Math.round(price5DaysAgo * 100) / 100,
    price1MonthAgo: Math.round(price1MonthAgo * 100) / 100,
    price200DaysAgo: Math.round(price200DaysAgo * 100) / 100,
    price1YearAgo: Math.round(price1YearAgo * 100) / 100,
    timestamp: new Date().toISOString(),
    source: 'Mock Historical Data (Development - Get API keys for real historical prices)'
  }
}
