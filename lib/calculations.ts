// Options trading calculations

export interface TradeCalculation {
  realizedGain: number
  unrealizedGain: number
  totalCost: number
  currentValue: number
  profitLossPercentage: number
}

export function calculateTradeMetrics(
  optionType: 'call' | 'put',
  contracts: number,
  strikePrice: number,
  costPerContract: number,
  currentPrice?: number,
  sellPrice?: number
): TradeCalculation {
  const totalCost = contracts * costPerContract
  
  // Calculate current value based on option type and current price
  let currentValue = 0
  let realizedGain = 0
  
  if (currentPrice !== undefined) {
    if (optionType === 'call') {
      currentValue = Math.max(currentPrice - strikePrice, 0) * contracts
    } else {
      currentValue = Math.max(strikePrice - currentPrice, 0) * contracts
    }
  }
  
  // Calculate realized gain if sold
  if (sellPrice !== undefined) {
    if (optionType === 'call') {
      realizedGain = (Math.max(sellPrice - strikePrice, 0) * contracts) - totalCost
    } else {
      realizedGain = (Math.max(strikePrice - sellPrice, 0) * contracts) - totalCost
    }
  }
  
  // Calculate unrealized gain
  const unrealizedGain = currentValue - totalCost
  
  // Calculate profit/loss percentage
  const profitLossPercentage = totalCost > 0 ? (unrealizedGain / totalCost) * 100 : 0
  
  return {
    realizedGain,
    unrealizedGain,
    totalCost,
    currentValue,
    profitLossPercentage
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export function formatPercentage(percentage: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(percentage / 100)
}

export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(2)}T`
  } else if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`
  } else if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`
  } else if (marketCap >= 1e3) {
    return `$${(marketCap / 1e3).toFixed(2)}K`
  } else {
    return `$${marketCap.toFixed(2)}`
  }
}
