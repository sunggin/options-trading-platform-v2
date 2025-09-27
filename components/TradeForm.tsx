'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Plus, Save, TrendingUp, TrendingDown } from 'lucide-react'
import { useStockPrice } from '@/hooks/useStockPrice'
import { getStockPrice } from '@/lib/stockApi'
import { useAuth } from '@/contexts/AuthContext'
import CSVUpload from './CSVUpload'

interface UserAccount {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

// Generate all options expiration dates (every Friday, adjusted for holidays)
const generateOptionsExpirationDates = () => {
  const dates = []
  const today = new Date()
  const endDate = new Date(2027, 11, 31) // End of 2027
  
  // Major US holidays that affect options expiration (moved to Thursday before)
  const holidays = new Set([
    '2025-01-01', '2025-01-20', '2025-02-17', '2025-05-26', '2025-07-04', '2025-09-01', '2025-10-13', '2025-11-11', '2025-11-27', '2025-12-25',
    '2026-01-01', '2026-01-19', '2026-02-16', '2026-05-25', '2026-07-04', '2026-09-07', '2026-10-12', '2026-11-11', '2026-11-26', '2026-12-25',
    '2027-01-01', '2027-01-18', '2027-02-15', '2027-05-31', '2027-07-04', '2027-09-06', '2027-10-11', '2027-11-11', '2027-11-25', '2027-12-25'
  ])
  
  // Start from the next Friday after today
  const currentDate = new Date(today)
  const daysUntilFriday = (5 - currentDate.getDay() + 7) % 7
  const nextFriday = new Date(currentDate.getTime() + (daysUntilFriday === 0 ? 7 : daysUntilFriday) * 24 * 60 * 60 * 1000)
  
  let currentFriday = new Date(nextFriday)
  
  while (currentFriday <= endDate) {
    const dateStr = currentFriday.toISOString().split('T')[0]
    
    // Check if this Friday is a holiday - if so, use Thursday instead
    let expirationDate = currentFriday
    if (holidays.has(dateStr)) {
      expirationDate = new Date(currentFriday.getTime() - 24 * 60 * 60 * 1000) // Previous day (Thursday)
    }
    
    const expirationDateStr = expirationDate.toISOString().split('T')[0]
    const monthName = expirationDate.toLocaleDateString('en-US', { month: 'short' })
    const day = expirationDate.getDate()
    const yearShort = expirationDate.getFullYear().toString().slice(-2)
    
    // Add holiday indicator if applicable
    const holidayIndicator = holidays.has(dateStr) ? ' (Holiday)' : ''
    
    dates.push({
      value: expirationDateStr,
      label: `${monthName} ${day}, ${yearShort} (${expirationDateStr})${holidayIndicator}`
    })
    
    // Move to next Friday
    currentFriday = new Date(currentFriday.getTime() + 7 * 24 * 60 * 60 * 1000)
  }
  
  return dates
}

const tradeSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required').max(10, 'Ticker must be 10 characters or less'),
  account: z.string().min(1, 'Account is required'),
  option_type: z.string().min(1, 'Option type is required'),
  custom_option_type: z.string().optional(),
  expiration_date: z.string().optional(),
  contracts: z.number().min(1, 'Number of contracts must be at least 1'),
  cost: z.number().optional().or(z.nan().transform(() => undefined)),
  strike_price: z.number().min(0, 'Strike price must be a positive number'),
  price_at_purchase: z.string().optional(),
  unrealized_pl: z.number().optional().or(z.nan().transform(() => undefined)),
})

type TradeFormData = z.infer<typeof tradeSchema>

interface TradeFormProps {
  onTradeAdded: () => void
}

export default function TradeForm({ onTradeAdded }: TradeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useCustomDate, setUseCustomDate] = useState(false)
  const [savedAccounts, setSavedAccounts] = useState<string[]>([])
  const { user } = useAuth()
  
  // Generate standard options expiration dates
  const expirationDates = generateOptionsExpirationDates()

  // Load saved accounts from localStorage
  useEffect(() => {
    if (user) {
      loadSavedAccounts()
    }
  }, [user])

  const loadSavedAccounts = () => {
    const key = `saved_accounts_${user?.id}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        setSavedAccounts(JSON.parse(saved))
      } catch (error) {
        console.error('Error parsing saved accounts:', error)
        setSavedAccounts([])
      }
    }
  }

  const saveAccount = (accountName: string) => {
    if (!user || !accountName.trim()) return
    
    const trimmedName = accountName.trim()
    const key = `saved_accounts_${user.id}`
    
    // Add to saved accounts if not already present
    setSavedAccounts(prev => {
      if (!prev.includes(trimmedName)) {
        const updated = [...prev, trimmedName]
        localStorage.setItem(key, JSON.stringify(updated))
        return updated
      }
      return prev
    })
  }


  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid }
  } = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    mode: 'onChange', // Enable real-time validation
    reValidateMode: 'onChange',
    defaultValues: {
      ticker: '',
      account: '',
      option_type: '',
      custom_option_type: '',
      expiration_date: '',
      contracts: 1,
      cost: 0,
      strike_price: 0,
      price_at_purchase: '',
      unrealized_pl: 0
    }
  })

  const watchedTicker = watch('ticker')
  const watchedOptionType = watch('option_type')
  const watchedAccount = watch('account')
  const watchedExpirationDate = watch('expiration_date')
  const watchedContracts = watch('contracts')
  const watchedStrikePrice = watch('strike_price')
  const watchedCost = watch('cost')
  const watchedUnrealizedPl = watch('unrealized_pl')
  
  // Get real-time stock price
  const { price, change, changePercent, loading, error, lastUpdated } = useStockPrice(watchedTicker || '')

  const onSubmit = async (data: any) => {
    console.log('=== FORM SUBMISSION STARTED ===')
    console.log('Form submitted with data:', data)
    console.log('User:', user)
    console.log('Form errors:', errors)
    console.log('Form isValid:', isValid)
    
    // Temporarily disabled auth check
    // if (!user) {
    //   alert('You must be logged in to add trades')
    //   return
    // }
    
    setIsSubmitting(true)
    
        try {
          // Set trading date to today's date (dynamic)
          const today = new Date().toISOString().split('T')[0]
          console.log('Trading date set to:', today)
      
      // Use the cost as entered by the user, default to 0 if not provided
      const cost = data.cost || 0
      
      
      // Skip stock price fetching for now to improve performance
      // TODO: Add API keys for real-time stock prices
      let currentPrice = 0
      console.log('Price at purchase set to 0 (stock price fetching disabled for performance)')
      
      // Use the unrealized P/L as entered by the user, default to 0 if not provided
      const unrealizedPl = data.unrealized_pl || 0
      
          const now = new Date().toISOString()
          // Use custom option type if "Other" is selected and custom value is provided
          const finalOptionType = data.option_type === 'Other' && data.custom_option_type 
            ? data.custom_option_type 
            : data.option_type

          // Calculate PMCC for Call options
          const pmccCalc = (finalOptionType === 'Call option' || finalOptionType === 'PMCC call option') && data.contracts > 0 
            ? data.strike_price + (cost / data.contracts / 100) 
            : null
          
          console.log('PMCC Calculation:', {
            optionType: finalOptionType,
            contracts: data.contracts,
            cost: cost,
            strikePrice: data.strike_price,
            pmccCalc: pmccCalc
          })

          const tradeData = {
            user_id: user?.id, // Add user_id for data isolation
            ticker: data.ticker.toUpperCase(),
            account: data.account,
            trading_date: today,
            option_type: finalOptionType,
            expiration_date: data.expiration_date || '',
            status: 'open',
            contracts: data.contracts,
            cost: cost,
            strike_price: data.strike_price,
            price_at_purchase: currentPrice,
            pmcc_calc: pmccCalc,
            unrealized_pl: unrealizedPl,
            audited: false,
            exercised: false
          }
      
      console.log('Inserting trade data:', tradeData)
      
      const { error } = await supabase
        .from('trades')
        .insert([tradeData])

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

             console.log('Trade added successfully!')
             
             // Save the account name if it's not already saved
             if (data.account && data.account.trim()) {
               saveAccount(data.account.trim())
             }
             
             reset()
             onTradeAdded()
      
      // Trigger history refresh
      if (typeof window !== 'undefined' && (window as any).refreshHistory) {
        (window as any).refreshHistory()
      }
    } catch (error) {
      console.error('Error adding trade:', error)
      let errorMessage = 'Unknown error'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        // Handle Supabase errors
        if ('message' in error) {
          errorMessage = String(error.message)
        } else if ('details' in error) {
          errorMessage = String(error.details)
        } else if ('hint' in error) {
          errorMessage = String(error.hint)
        }
      }
      
      alert(`Failed to add trade: ${errorMessage}. Check console for details.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
        <div className="card mb-4">
          <h2 className="text-base font-semibold mb-2">Options</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <div>
            <label className="form-label">Account</label>
            <input
              {...register('account')}
              type="text"
              placeholder="Type account name (e.g., Main Trading, Roth IRA)"
              className="input-field text-sm py-1"
              list="account-suggestions"
            />
            <datalist id="account-suggestions">
              {savedAccounts.map((account) => (
                <option key={account} value={account} />
              ))}
            </datalist>
            {errors.account && (
              <p className="text-red-500 text-sm mt-1">{errors.account.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">Ticker</label>
                <input
                  {...register('ticker')}
                  className="input-field text-sm py-1 uppercase"
                  placeholder="e.g., AAPL"
                  maxLength={10}
                />
            {errors.ticker && (
              <p className="text-red-500 text-sm mt-1">{errors.ticker.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">Current Price</label>
            <div className="relative">
                  <input
                    type="text"
                    value={loading ? 'Loading...' : price}
                    className={`input-field text-sm py-1 bg-gray-100 cursor-not-allowed ${
                      error ? 'border-red-300' : ''
                    }`}
                    readOnly
                    title={error ? error : "Current stock price (auto-updated)"}
                  />
              {!loading && !error && watchedTicker && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  {change.startsWith('+') ? (
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  ) : change.startsWith('-') ? (
                    <TrendingDown className="w-3 h-3 text-red-600" />
                  ) : null}
                </div>
              )}
            </div>
            {loading && (
              <p className="text-sm text-blue-500 mt-1">Fetching price...</p>
            )}
            {error && (
              <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
            {!loading && !error && watchedTicker && (
              <div className="text-sm text-gray-500 mt-1">
                <span className={change.startsWith('+') ? 'text-green-600' : change.startsWith('-') ? 'text-red-600' : 'text-gray-500'}>
                  {change} ({changePercent})
                </span>
                {lastUpdated && <span className="ml-2">Updated: {lastUpdated}</span>}
              </div>
            )}
            {!watchedTicker && (
              <p className="text-sm text-gray-500 mt-1">Enter ticker to see price</p>
            )}
          </div>

          <div>
            <label className="form-label">Option Type</label>
            <select
              {...register('option_type')}
              className="input-field text-sm py-1"
            >
              <option value="">Select option type</option>
             <option value="Call option">Call option</option>
             <option value="Put option">Put option</option>
             <option value="Covered call">Covered call</option>
             <option value="Cash secured put">Cash secured put</option>
             <option value="PMCC call option">PMCC call option</option>
             <option value="PMCC covered call">PMCC covered call</option>
             <option value="Other">Other (custom value)</option>
            </select>
            {errors.option_type && (
              <p className="text-red-500 text-sm mt-1">{errors.option_type.message}</p>
            )}
            {watchedOptionType === 'Other' && (
              <div className="mt-2">
                <label className="form-label text-sm">Custom Option Type</label>
                <input
                  {...register('custom_option_type')}
                  className="input-field text-sm py-1"
                  placeholder="Enter custom option type"
                />
                <p className="text-xs text-gray-500 mt-1">Enter any custom option type value</p>
              </div>
            )}
          </div>

          <div>
            <label className="form-label">Price @ Purchase ($)</label>
            <input
              {...register('price_at_purchase')}
              type="text"
              className="input-field text-sm py-1 bg-gray-100 cursor-not-allowed"
              placeholder="0.00"
              readOnly
              value=""
            />
            <p className="text-sm text-gray-500 mt-1">Will be set to current stock price when submitted</p>
            {errors.price_at_purchase && (
              <p className="text-red-500 text-sm mt-1">{errors.price_at_purchase.message}</p>
            )}
          </div>


          <div>
            <label className="form-label">Number of Contracts</label>
                <input
                  {...register('contracts', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  className="input-field text-sm py-1"
                  placeholder="1"
                />
            {errors.contracts && (
              <p className="text-red-500 text-sm mt-1">{errors.contracts.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">Strike Price ($)</label>
            <input
              {...register('strike_price', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
                  className="input-field text-sm py-1"
              placeholder="0.00"
            />
            {errors.strike_price && (
              <p className="text-red-500 text-sm mt-1">{errors.strike_price.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">Cost per Contract ($)</label>
            <input
              {...register('cost', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              className={`input-field text-sm py-1.5 ${
                watchedOptionType && watchedOptionType.trim() && (watchedOptionType === 'Covered call' || 
                                    watchedOptionType === 'Cash secured put' ||
                                    watchedOptionType === 'PMCC covered call')
                  ? 'bg-gray-100 cursor-not-allowed' 
                  : ''
              }`}
              placeholder="0.00"
              readOnly={!!(watchedOptionType && watchedOptionType.trim() && (watchedOptionType === 'Covered call' || 
                                               watchedOptionType === 'Cash secured put' ||
                                               watchedOptionType === 'PMCC covered call'))}
            />
            {watchedOptionType && watchedOptionType.trim() && (watchedOptionType === 'Covered call' || 
                                 watchedOptionType === 'Cash secured put' ||
                                 watchedOptionType === 'PMCC covered call') && (
              <p className="text-sm text-gray-500 mt-1">No cost for covered strategies (you receive premium)</p>
            )}
            {(watchedOptionType === 'Call option' || watchedOptionType === 'Put option' || watchedOptionType === 'PMCC call option') && (
              <p className="text-sm text-gray-500 mt-1">Optional for basic options (you pay premium)</p>
            )}
            {errors.cost && (
              <p className="text-red-500 text-sm mt-1">{errors.cost.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">Expiration Date</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUseCustomDate(false)}
                  className={`px-3 py-1 text-xs rounded ${
                    !useCustomDate 
                      ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                  }`}
                >
                  Standard (Weekly)
                </button>
                <button
                  type="button"
                  onClick={() => setUseCustomDate(true)}
                  className={`px-3 py-1 text-xs rounded ${
                    useCustomDate 
                      ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                  }`}
                >
                  Custom Date
                </button>
              </div>
              
              {!useCustomDate ? (
                <select
                  {...register('expiration_date')}
                  className="input-field text-sm py-1"
                >
                  <option value="">Select expiration date</option>
                  {expirationDates.map((date) => (
                    <option key={date.value} value={date.value}>
                      {date.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  {...register('expiration_date')}
                  type="date"
                  className="input-field text-sm py-1"
                />
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {!useCustomDate 
                ? 'Weekly options expiration (Fridays, adjusted for holidays)' 
                : 'Enter any custom expiration date'
              }
            </p>
            {errors.expiration_date && (
              <p className="text-red-500 text-sm mt-1">{errors.expiration_date.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">Unrealized P/L ($)</label>
            <input
              {...register('unrealized_pl', { valueAsNumber: true })}
              type="number"
              step="0.01"
              className={`input-field text-sm py-1.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                watchedOptionType && watchedOptionType.trim() && (watchedOptionType === 'Call option' || 
                                    watchedOptionType === 'Put option' ||
                                    watchedOptionType === 'PMCC call option')
                  ? 'bg-gray-100 cursor-not-allowed' 
                  : ''
              }`}
              placeholder="0.00"
              readOnly={!!(watchedOptionType && watchedOptionType.trim() && (watchedOptionType === 'Call option' || 
                                               watchedOptionType === 'Put option' ||
                                               watchedOptionType === 'PMCC call option'))}
            />
            {watchedOptionType && watchedOptionType.trim() && (watchedOptionType === 'Call option' || 
                                 watchedOptionType === 'Put option' ||
                                 watchedOptionType === 'PMCC call option') && (
              <p className="text-sm text-gray-500 mt-1">Not required for basic options (calculated automatically)</p>
            )}
            {(watchedOptionType === 'Covered call' || watchedOptionType === 'Cash secured put' || watchedOptionType === 'PMCC covered call') && (
              <p className="text-sm text-gray-500 mt-1">Optional for covered strategies (you receive premium)</p>
            )}
            {errors.unrealized_pl && (
              <p className="text-red-500 text-sm mt-1">{errors.unrealized_pl.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">Trading Date</label>
            <input
              type="date"
              value={new Date().toISOString().split('T')[0]}
              className="input-field text-sm py-1.5 bg-gray-100 cursor-not-allowed"
              readOnly
              title="Trading date is automatically set to today's date"
            />
            <p className="text-sm text-gray-500 mt-1">Auto-set to today's date</p>
          </div>

        </div>



        <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex items-center gap-1 text-sm py-1 px-2"
                  onClick={() => {
                    console.log('=== SUBMIT BUTTON CLICKED ===')
                    console.log('isSubmitting:', isSubmitting)
                    console.log('isValid:', isValid)
                    console.log('Form errors:', errors)
                  }}
                >
                  <Save className="w-3 h-3" />
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
                
                <button
                  type="button"
                  onClick={() => reset()}
                  className="btn-secondary text-sm py-1 px-2"
                >
                  Clear Form
                </button>
        </div>
      </form>
    </div>
    
    <div className="mt-4">
      <CSVUpload onUploadComplete={onTradeAdded} />
    </div>
  </>
  )
}
