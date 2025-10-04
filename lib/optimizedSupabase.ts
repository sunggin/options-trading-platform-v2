// Optimized Supabase client with caching and performance improvements
import { createClient } from '@supabase/supabase-js'
import { Trade } from './supabase'

// Define UserProfile interface locally since it's not exported from supabase.ts
interface UserProfile {
  id: string
  email?: string
  start_trading_date?: string
  created_at?: string
  updated_at?: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create Supabase client with optimized configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Optimize auth settings for faster loading
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Reduce auth timeout for faster initial load
    flowType: 'pkce'
  },
  realtime: {
    // Optimize realtime settings
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-application-name': 'options-trading-platform'
    }
  }
})

// ==============================================
// CACHE MANAGEMENT
// ==============================================

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now()
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }

    const keys = Array.from(this.cache.keys())
    for (const key of keys) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  // Get cache stats for debugging
  getStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    const entries = Array.from(this.cache.values())
    for (const entry of entries) {
      if (now > entry.expiresAt) {
        expiredEntries++
      } else {
        validEntries++
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries
    }
  }
}

export const cacheManager = new CacheManager()

// ==============================================
// OPTIMIZED QUERY FUNCTIONS
// ==============================================

// Optimized function to get user dashboard stats
export async function getUserDashboardStats(userId: string) {
  const cacheKey = `dashboard_stats_${userId}`
  
  // Try cache first
  const cached = cacheManager.get(cacheKey)
  if (cached) {
    console.log('Dashboard stats loaded from cache')
    return { data: cached, error: null }
  }

  try {
    // Use the optimized database function
    const { data, error } = await supabase.rpc('get_user_dashboard_stats', {
      p_user_id: userId
    })

    if (error) throw error

    // Cache the result for 2 minutes (dashboard stats don't change frequently)
    if (data && data.length > 0) {
      cacheManager.set(cacheKey, data[0], 2 * 60 * 1000)
    }

    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return { data: null, error }
  }
}

// Optimized function to get user trades with pagination
export async function getUserTradesOptimized(
  userId: string,
  limit: number = 100,
  offset: number = 0
) {
  const cacheKey = `trades_${userId}_${limit}_${offset}`
  
  // Try cache first
  const cached = cacheManager.get(cacheKey)
  if (cached) {
    console.log('Trades loaded from cache')
    return { data: cached, error: null }
  }

  try {
    // Use the optimized database function
    const { data, error } = await supabase.rpc('get_user_trades_optimized', {
      p_user_id: userId,
      p_limit: limit,
      p_offset: offset
    })

    if (error) throw error

    // Cache the result for 1 minute (trades change more frequently)
    if (data) {
      cacheManager.set(cacheKey, data, 60 * 1000)
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching trades:', error)
    return { data: [], error }
  }
}

// Optimized function to get user trades (fallback to direct query)
export async function getUserTrades(userId: string) {
  const cacheKey = `all_trades_${userId}`
  
  // Try cache first
  const cached = cacheManager.get(cacheKey)
  if (cached) {
    console.log('All trades loaded from cache')
    return { data: cached, error: null }
  }

  try {
    // Optimized query with specific fields only
    const { data, error } = await supabase
      .from('trades')
      .select(`
        id, ticker, account, trading_date, option_type, expiration_date, 
        status, contracts, cost, strike_price, price_at_purchase, 
        pmcc_calc, realized_pl, unrealized_pl, audited, exercised, 
        share, created_at, updated_at
      `)
      .eq('user_id', userId)
      .order('status', { ascending: true })
      .order('trading_date', { ascending: false })

    if (error) throw error

    // Cache the result for 1 minute
    if (data) {
      cacheManager.set(cacheKey, data, 60 * 1000)
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching trades:', error)
    return { data: [], error }
  }
}

// Optimized function to get user accounts
export async function getUserAccounts(userId: string) {
  const cacheKey = `accounts_${userId}`
  
  // Try cache first
  const cached = cacheManager.get(cacheKey)
  if (cached) {
    console.log('Accounts loaded from cache')
    return { data: cached, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('id, name, type, created_at')
      .eq('user_id', userId)
      .order('name')

    if (error) throw error

    // Cache the result for 5 minutes (accounts don't change often)
    if (data) {
      cacheManager.set(cacheKey, data, 5 * 60 * 1000)
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return { data: [], error }
  }
}

// ==============================================
// CACHE INVALIDATION HELPERS
// ==============================================

// Invalidate cache when trades are modified
export function invalidateTradesCache(userId: string) {
  cacheManager.invalidate(`trades_${userId}`)
  cacheManager.invalidate(`dashboard_stats_${userId}`)
  cacheManager.invalidate(`all_trades_${userId}`)
  console.log('Trades cache invalidated for user:', userId)
}

// Invalidate cache when accounts are modified
export function invalidateAccountsCache(userId: string) {
  cacheManager.invalidate(`accounts_${userId}`)
  console.log('Accounts cache invalidated for user:', userId)
}

// Invalidate all cache for a user
export function invalidateUserCache(userId: string) {
  cacheManager.invalidate(userId)
  console.log('All cache invalidated for user:', userId)
}

// ==============================================
// LOCAL STORAGE PERSISTENCE
// ==============================================

// Save critical data to localStorage for instant loading
export function saveToLocalStorage(key: string, data: any, ttl: number = 24 * 60 * 60 * 1000) {
  try {
    const entry = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch (error) {
    console.warn('Failed to save to localStorage:', error)
  }
}

// Load critical data from localStorage
export function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return null

    const entry = JSON.parse(stored)
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(key)
      return null
    }

    return entry.data
  } catch (error) {
    console.warn('Failed to load from localStorage:', error)
    return null
  }
}

// ==============================================
// HYBRID LOADING STRATEGY
// ==============================================

// Load trades with hybrid strategy: localStorage -> cache -> database
export async function loadTradesHybrid(userId: string): Promise<{ data: Trade[], error: any }> {
  // 1. Try localStorage first (instant)
  const localStorageKey = `trades_${userId}`
  const cachedTrades = loadFromLocalStorage<Trade[]>(localStorageKey)
  if (cachedTrades) {
    console.log('Trades loaded from localStorage (instant)')
    return { data: cachedTrades, error: null }
  }

  // 2. Try memory cache (very fast)
  const cacheKey = `all_trades_${userId}`
  const memoryCached = cacheManager.get<Trade[]>(cacheKey)
  if (memoryCached) {
    console.log('Trades loaded from memory cache (fast)')
    // Also save to localStorage for next time
    saveToLocalStorage(localStorageKey, memoryCached, 30 * 60 * 1000) // 30 minutes
    return { data: memoryCached, error: null }
  }

  // 3. Load from database (slow)
  console.log('Trades loaded from database (slow)')
  const { data, error } = await getUserTrades(userId)
  
  // Save to both caches for next time
  if (data) {
    saveToLocalStorage(localStorageKey, data, 30 * 60 * 1000) // 30 minutes
    cacheManager.set(cacheKey, data, 60 * 1000) // 1 minute
  }

  return { data: Array.isArray(data) ? data : [], error }
}

// Load dashboard stats with hybrid strategy
export async function loadDashboardStatsHybrid(userId: string) {
  // 1. Try localStorage first (instant)
  const localStorageKey = `dashboard_stats_${userId}`
  const cachedStats = loadFromLocalStorage(localStorageKey)
  if (cachedStats) {
    console.log('Dashboard stats loaded from localStorage (instant)')
    return { data: cachedStats, error: null }
  }

  // 2. Try memory cache (very fast)
  const cacheKey = `dashboard_stats_${userId}`
  const memoryCached = cacheManager.get(cacheKey)
  if (memoryCached) {
    console.log('Dashboard stats loaded from memory cache (fast)')
    // Also save to localStorage for next time
    saveToLocalStorage(localStorageKey, memoryCached, 60 * 60 * 1000) // 1 hour
    return { data: memoryCached, error: null }
  }

  // 3. Load from database (slow)
  console.log('Dashboard stats loaded from database (slow)')
  const result = await getUserDashboardStats(userId)
  
  // Save to both caches for next time
  if (result.data) {
    saveToLocalStorage(localStorageKey, result.data, 60 * 60 * 1000) // 1 hour
    cacheManager.set(cacheKey, result.data, 2 * 60 * 1000) // 2 minutes
  }

  return result
}

// ==============================================
// PERFORMANCE MONITORING
// ==============================================

export function getCacheStats() {
  return cacheManager.getStats()
}

export function clearAllCaches() {
  cacheManager.invalidate()
  
  // Clear localStorage for this app
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('trades_') || key.startsWith('dashboard_stats_') || key.startsWith('accounts_')) {
        localStorage.removeItem(key)
      }
    })
    console.log('All caches cleared')
  } catch (error) {
    console.warn('Failed to clear localStorage:', error)
  }
}

// Export the original supabase client for backward compatibility
export { supabase as default }
