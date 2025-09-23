import { supabase } from './supabase'

export interface SampleTrade {
  ticker: string
  account: string
  trading_date: string
  option_type: string
  expiration_date: string
  status: 'open' | 'closed'
  contracts: number
  cost: number
  strike_price: number
  price_at_purchase: number
  realized_pl?: number
  unrealized_pl?: number
  audited: boolean
  exercised: boolean
  closed_date?: string
  pmcc_calc?: number
}

export const sampleTrades: SampleTrade[] = [
  {
    ticker: 'AAPL',
    account: 'SAE',
    trading_date: '2025-09-15',
    option_type: 'Call option',
    expiration_date: '2025-10-17',
    status: 'open',
    contracts: 2,
    cost: 2.50,
    strike_price: 150.00,
    price_at_purchase: 148.50,
    unrealized_pl: 45.00,
    audited: false,
    exercised: false,
    pmcc_calc: 151.25
  },
  {
    ticker: 'TSLA',
    account: 'ST',
    trading_date: '2025-09-10',
    option_type: 'Put option',
    expiration_date: '2025-10-10',
    status: 'closed',
    contracts: 1,
    cost: 3.20,
    strike_price: 240.00,
    price_at_purchase: 245.00,
    realized_pl: 180.00,
    audited: true,
    exercised: false,
    closed_date: '2025-09-20'
  },
  {
    ticker: 'SPY',
    account: 'Robinhood',
    trading_date: '2025-09-05',
    option_type: 'Covered call',
    expiration_date: '2025-10-03',
    status: 'open',
    contracts: 5,
    cost: 0,
    strike_price: 520.00,
    price_at_purchase: 515.00,
    unrealized_pl: 125.00,
    audited: false,
    exercised: false
  },
  {
    ticker: 'NVDA',
    account: 'ST Operating',
    trading_date: '2025-09-01',
    option_type: 'Cash secured put',
    expiration_date: '2025-10-01',
    status: 'closed',
    contracts: 3,
    cost: 0,
    strike_price: 800.00,
    price_at_purchase: 820.00,
    realized_pl: 600.00,
    audited: true,
    exercised: true,
    closed_date: '2025-09-18'
  },
  {
    ticker: 'MSFT',
    account: 'N/A',
    trading_date: '2025-08-28',
    option_type: 'PMCC call option',
    expiration_date: '2025-10-24',
    status: 'open',
    contracts: 1,
    cost: 1.80,
    strike_price: 400.00,
    price_at_purchase: 395.00,
    unrealized_pl: 25.00,
    audited: false,
    exercised: false,
    pmcc_calc: 401.80
  }
]

export async function createSampleDataForUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Insert sample trades for the user
    const tradesWithUserId = sampleTrades.map(trade => ({
      ...trade,
      user_id: userId
    }))

    const { error: tradesError } = await supabase
      .from('trades')
      .insert(tradesWithUserId)

    if (tradesError) {
      console.error('Error inserting sample trades:', tradesError)
      return { success: false, error: tradesError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error creating sample data:', error)
    return { success: false, error: 'Failed to create sample data' }
  }
}

export async function hasUserData(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('trades')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (error) {
      console.error('Error checking user data:', error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.error('Error checking user data:', error)
    return false
  }
}

