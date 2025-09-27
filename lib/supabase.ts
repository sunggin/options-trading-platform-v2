import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gfakirsbobtibgltoqjg.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmYWtpcnNib2J0aWJnbHRvcWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNDA5NDAsImV4cCI6MjA3MzgxNjk0MH0.nMmTODvKMBmn-DgPLH6sEUzhGEH3iAP6ZqipM9ed1Jk'

// Only create client if we have valid credentials
let supabase: any = null

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing')

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
  console.log('Supabase client created successfully with actual credentials')
} catch (error) {
  console.warn('Supabase client creation failed:', error)
}

export { supabase }

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  const isConfigured = supabase !== null && 
         supabaseUrl && 
         supabaseAnonKey && 
         supabaseAnonKey.startsWith('eyJ')
  
  console.log('isSupabaseConfigured:', isConfigured)
  console.log('supabase client:', supabase ? 'exists' : 'null')
  console.log('URL:', supabaseUrl)
  console.log('Key starts with eyJ:', supabaseAnonKey && supabaseAnonKey.startsWith('eyJ'))
  
  return isConfigured
}

// Database types
export interface Trade {
  id: string
  user_id: string // User isolation
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
  current_price?: number
  realized_gain?: number
  unrealized_gain?: number
  // New fields
  pmcc_calc?: number
  realized_pl?: number
  unrealized_pl?: number
  audited?: boolean
  exercised?: boolean
  priority?: boolean
  closed_date?: string
  expected_return?: number
  created_at: string
  updated_at: string
}

export interface Account {
  id: string
  user_id: string // User isolation
  name: string
  type: 'paper' | 'live'
  created_at: string
}
