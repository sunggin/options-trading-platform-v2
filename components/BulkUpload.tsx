'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'

interface BulkUploadProps {
  onUploadComplete: () => void
}

interface ParsedTrade {
  ticker: string
  account: string
  trading_date: string
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
}

const BulkUpload = ({ onUploadComplete }: BulkUploadProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [successCount, setSuccessCount] = useState(0)

  const parseDate = (dateStr: string): string => {
    if (!dateStr || dateStr.trim() === '') return ''
    
    // Handle MM/DD/YYYY format
    const mmddyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (mmddyyyyMatch) {
      const [, month, day, year] = mmddyyyyMatch
      const paddedMonth = month.padStart(2, '0')
      const paddedDay = day.padStart(2, '0')
      return `${year}-${paddedMonth}-${paddedDay}`
    }
    
    // Handle YYYY-MM-DD format
    const yyyymmddMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (yyyymmddMatch) {
      const [, year, month, day] = yyyymmddMatch
      const paddedMonth = month.padStart(2, '0')
      const paddedDay = day.padStart(2, '0')
      return `${year}-${paddedMonth}-${paddedDay}`
    }
    
    return dateStr
  }

  const parseCSV = (csvText: string): ParsedTrade[] => {
    const lines = csvText.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    const requiredHeaders = [
      'ticker', 'account', 'trading_date', 'expiration_date', 'status', 
      'contracts', 'cost', 'strike_price', 'price_at_purchase'
    ]
    
    // Check if all required headers are present
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header))
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`)
    }
    
    const trades: ParsedTrade[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      
      if (values.length !== headers.length) {
        throw new Error(`Row ${i + 1} has incorrect number of columns`)
      }
      
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index]
      })
      
      // Parse and validate required fields
      const contracts = parseInt(row.contracts)
      if (isNaN(contracts) || contracts < 1) {
        throw new Error(`Row ${i + 1}: contracts must be a positive integer`)
      }
      
      const cost = parseFloat(row.cost) || 0
      const strikePrice = parseFloat(row.strike_price)
      if (isNaN(strikePrice) || strikePrice < 0) {
        throw new Error(`Row ${i + 1}: strike_price must be a non-negative number`)
      }
      
      const priceAtPurchase = parseFloat(row.price_at_purchase) || 0
      
      const status = row.status.toLowerCase()
      if (!['open', 'closed'].includes(status)) {
        throw new Error(`Row ${i + 1}: status must be 'open' or 'closed'`)
      }
      
      const audited = row.audited ? row.audited.toLowerCase() === 'true' : false
      const exercised = row.exercised ? row.exercised.toLowerCase() === 'true' : false
      
      const trade: ParsedTrade = {
        ticker: row.ticker.toUpperCase(),
        account: row.account,
        trading_date: parseDate(row.trading_date),
        expiration_date: parseDate(row.expiration_date),
        status: status as 'open' | 'closed',
        contracts,
        cost,
        strike_price: strikePrice,
        price_at_purchase: priceAtPurchase,
        realized_pl: row.realized_pl ? parseFloat(row.realized_pl) : undefined,
        unrealized_pl: row.unrealized_pl ? parseFloat(row.unrealized_pl) : undefined,
        audited,
        exercised,
        closed_date: row.closed_date ? parseDate(row.closed_date) : undefined
      }
      
      trades.push(trade)
    }
    
    return trades
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadStatus('idle')
    setErrorMessage('')
    setSuccessCount(0)

    // No authentication needed

    try {
      const text = await file.text()
      const trades = parseCSV(text)
      
      if (trades.length === 0) {
        throw new Error('No valid trades found in CSV file')
      }

      // Test database connection
      console.log('Testing database connection...')
      
      const { data: testData, error: testError } = await supabase
        .from('trades')
        .select('id, ticker')
        .limit(1)
      
      if (testError) {
        console.error('Database test error:', testError)
        
        // Check if it's an authentication issue
        if (testError.message.includes('JWT') || testError.message.includes('auth')) {
          throw new Error('Authentication failed. Please log in again.')
        }
        
        // Check if it's a permission issue
        if (testError.message.includes('permission') || testError.message.includes('policy')) {
          throw new Error('Permission denied. Please check your database policies.')
        }
        
        throw new Error(`Database connection error: ${testError.message}`)
      }
      
      console.log('Database connection successful, user_id column exists')

      // Insert trades in batches
      const batchSize = 10
      let successCount = 0
      
      for (let i = 0; i < trades.length; i += batchSize) {
        const batch = trades.slice(i, i + batchSize)
        
        const processedTrades = batch.map(trade => {
          return {
            ...trade,
            // Calculate derived fields
            pmcc_calc: null,
            expected_return: 0
          }
        })

        console.log('Inserting batch:', processedTrades.length, 'trades')
        console.log('Sample trade data:', processedTrades[0])
        
        const { error: insertError } = await supabase
          .from('trades')
          .insert(processedTrades)

        if (insertError) {
          console.error('Batch insert error:', insertError)
          console.error('Error details:', JSON.stringify(insertError, null, 2))
          throw new Error(`Failed to insert batch starting at row ${i + 2}: ${insertError.message}`)
        }
        
        successCount += processedTrades.length
      }

      setSuccessCount(successCount)
      setUploadStatus('success')
      onUploadComplete()
      
    } catch (error) {
      console.error('Upload error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred')
      setUploadStatus('error')
    } finally {
      setIsUploading(false)
    }
  }

  const getCSVTemplate = () => {
    const template = `ticker,account,trading_date,expiration_date,status,contracts,cost,strike_price,price_at_purchase,realized_pl,unrealized_pl,audited,exercised,closed_date
AAPL,SAE,01/15/2024,02/16/2024,open,1,2.50,150.00,148.50,0,0,false,false,
TSLA,ST,01/16/2024,03/15/2024,open,2,0,200.00,195.00,0,0,false,false,
SPY,Robinhood,01/17/2024,02/16/2024,closed,1,1.25,480.00,485.00,50.00,0,true,false,02/10/2024`
    
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'trades_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Bulk Upload Trades</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={getCSVTemplate}
            className="btn-secondary text-sm py-2 px-3 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Download Template
          </button>
          <button
            onClick={async () => {
              try {
                const { data, error } = await supabase.from('trades').select('id, ticker').limit(1)
                
                if (error) {
                  alert(`Database error: ${error.message}`)
                } else {
                  alert('Database connection successful!')
                }
              } catch (err) {
                alert(`Error: ${err}`)
              }
            }}
            className="btn-secondary text-sm py-2 px-3 flex items-center gap-2"
          >
            Test Connection
          </button>
        </div>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className={`cursor-pointer flex flex-col items-center gap-2 ${
              isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
            }`}
          >
            <Upload className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-600">
              {isUploading ? 'Uploading...' : 'Click to upload CSV file'}
            </span>
          </label>
        </div>
        
        {uploadStatus === 'success' && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span>Successfully uploaded {successCount} trades!</span>
          </div>
        )}
        
        {uploadStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span>{errorMessage}</span>
          </div>
        )}
        
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Required fields:</strong> ticker, account, trading_date, expiration_date, status, contracts, cost, strike_price, price_at_purchase</p>
          <p><strong>Optional fields:</strong> realized_pl, unrealized_pl, audited, exercised, closed_date</p>
          <p><strong>Date formats:</strong> MM/DD/YYYY or YYYY-MM-DD</p>
          <p><strong>Boolean fields:</strong> audited, exercised (use true/false)</p>
        </div>
      </div>
    </div>
  )
}

export default BulkUpload
