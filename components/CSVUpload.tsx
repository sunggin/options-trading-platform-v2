'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Upload, FileText, AlertCircle, CheckCircle, Download, ChevronDown, ChevronRight } from 'lucide-react'

interface CSVUploadProps {
  onUploadComplete: () => void
}

interface ParsedTrade {
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
}

const CSVUpload = ({ onUploadComplete }: CSVUploadProps) => {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [successCount, setSuccessCount] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseDate = (dateStr: string): string => {
    if (!dateStr || dateStr.trim() === '') return ''
    
    // Handle MM/DD/YYYY format
    if (dateStr.includes('/')) {
      const [month, day, year] = dateStr.split('/')
      const fullYear = year.length === 2 ? `20${year}` : year
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    
    // Handle YYYY-MM-DD format
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        const [year, month, day] = parts
        // Handle 2-digit years
        const fullYear = year.length === 2 ? `20${year}` : year
        return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
      return dateStr
    }
    
    return dateStr
  }

  const parseCSV = (csvText: string): ParsedTrade[] => {
    try {
      const lines = csvText.trim().split('\n')
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row')
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const expectedHeaders = ['ticker', 'account', 'trading_date', 'option_type', 'expiration_date', 'status', 'contracts', 'cost', 'strike_price', 'price_at_purchase']
      
      // Check if required headers are present
      const missingHeaders = expectedHeaders.filter(header => !headers.includes(header))
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}. Expected headers: ${expectedHeaders.join(', ')}`)
      }
      
      const trades: ParsedTrade[] = []
      const errors: string[] = []
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue // Skip empty lines
        
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        
        if (values.length < expectedHeaders.length) {
          errors.push(`Row ${i + 1}: Not enough columns (expected ${expectedHeaders.length}, got ${values.length})`)
          continue
        }
        
        try {
          const trade: ParsedTrade = {
            ticker: values[0]?.toUpperCase() || '',
            account: values[1] || '',
            trading_date: parseDate(values[2] || ''),
            option_type: values[3] || '',
            expiration_date: parseDate(values[4] || ''),
            status: (values[5]?.toLowerCase() === 'closed' ? 'closed' : 'open') as 'open' | 'closed',
            contracts: parseInt(values[6]) || 1,
            cost: parseFloat(values[7]) || 0,
            strike_price: parseFloat(values[8]) || 0,
            price_at_purchase: parseFloat(values[9]) || 0,
            realized_pl: values[10] ? parseFloat(values[10]) : undefined,
            unrealized_pl: values[11] ? parseFloat(values[11]) : undefined,
            audited: values[12]?.toLowerCase() === 'true',
            exercised: values[13]?.toLowerCase() === 'true',
            closed_date: values[14] ? parseDate(values[14]) : undefined
          }
          
          trades.push(trade)
        } catch (parseError) {
          errors.push(`Row ${i + 1}: Error parsing data - ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
        }
      }
      
      if (errors.length > 0) {
        throw new Error(`CSV parsing errors:\n${errors.join('\n')}`)
      }
      
      return trades
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadStatus('idle')
    setErrorMessage('')
    setSuccessCount(0)

    try {
      const text = await file.text()
      
      if (!text || text.trim() === '') {
        throw new Error('CSV file is empty or could not be read')
      }
      
      const trades = parseCSV(text)
      
      if (trades.length === 0) {
        throw new Error('No valid trades found in CSV file. Please check the file format and ensure it has data rows.')
      }

      // Validate required fields
      const requiredFields = ['ticker', 'account', 'trading_date', 'option_type', 'expiration_date', 'contracts', 'cost', 'strike_price', 'price_at_purchase']
      const invalidTrades: { row: number; trade: ParsedTrade; missingFields: string[] }[] = []
      
      trades.forEach((trade, index) => {
        const missingFields = requiredFields.filter(field => {
          const value = trade[field as keyof ParsedTrade]
          // For numeric fields, 0 is a valid value
          if (field === 'cost' || field === 'price_at_purchase' || field === 'strike_price') {
            return value === undefined || value === null || value === ''
          }
          // For contracts, 0 is not valid (must be at least 1)
          if (field === 'contracts') {
            return !value || Number(value) < 1
          }
          // For other fields, check if they're falsy or empty string
          return !value || value === ''
        })
        if (missingFields.length > 0) {
          invalidTrades.push({
            row: index + 2, // +2 because index is 0-based and we skip header row
            trade,
            missingFields
          })
        }
      })

      if (invalidTrades.length > 0) {
        let detailedError = `Validation failed for ${invalidTrades.length} rows:\n\n`
        invalidTrades.forEach(({ row, trade, missingFields }) => {
          detailedError += `Row ${row}: Missing fields [${missingFields.join(', ')}]\n`
          detailedError += `  Data: ${JSON.stringify(trade, null, 2)}\n\n`
        })
        detailedError += `Please fix these issues and try again.`
        throw new Error(detailedError)
      }

      // Process trades for database insertion
      const processedTrades = trades.map(trade => ({
        user_id: user?.id, // Add user_id for data isolation
        ticker: trade.ticker,
        account: trade.account,
        trading_date: trade.trading_date,
        option_type: trade.option_type,
        expiration_date: trade.expiration_date,
        status: trade.status,
        contracts: trade.contracts,
        cost: trade.cost,
        strike_price: trade.strike_price,
        price_at_purchase: trade.price_at_purchase,
        pmcc_calc: null,
        unrealized_pl: trade.unrealized_pl || 0,
        audited: trade.audited,
        exercised: trade.exercised,
        closed_date: trade.closed_date || null,
        realized_pl: trade.realized_pl || null
      }))

      // Insert trades in batches
      const batchSize = 100
      let successCount = 0
      
      for (let i = 0; i < processedTrades.length; i += batchSize) {
        const batch = processedTrades.slice(i, i + batchSize)
        
        const { error } = await supabase
          .from('trades')
          .insert(batch)

        if (error) {
          console.error('Supabase batch insert error:', error)
          console.error('Failed batch data:', batch)
          
          // Create detailed error message
          let detailedError = `Failed to insert batch starting at row ${i + 2}:\n`
          detailedError += `Error: ${error.message}\n`
          detailedError += `Code: ${error.code || 'Unknown'}\n`
          detailedError += `Details: ${error.details || 'No additional details'}\n`
          detailedError += `Hint: ${error.hint || 'No hint provided'}\n`
          
          if (error.code === '23505') {
            detailedError += `\nThis appears to be a duplicate key error. Check for duplicate trades.`
          } else if (error.code === '23503') {
            detailedError += `\nThis appears to be a foreign key constraint error. Check if the account exists.`
          } else if (error.code === '23514') {
            detailedError += `\nThis appears to be a check constraint error. Check option_type values.`
          }
          
          throw new Error(detailedError)
        }
        
        successCount += batch.length
      }

      setSuccessCount(successCount)
      setUploadStatus('success')
      onUploadComplete()
      
    } catch (error) {
      console.error('CSV upload error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred')
      setUploadStatus('error')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const downloadTemplate = () => {
    const headers = [
      'ticker',
      'account', 
      'trading_date',
      'option_type',
      'expiration_date',
      'status',
      'contracts',
      'cost',
      'strike_price',
      'price_at_purchase',
      'realized_pl',
      'unrealized_pl',
      'audited',
      'exercised',
      'closed_date'
    ]

    const sampleData = [
      'AAPL',
      'SAE',
      '09/19/2025',
      'Call option',
      '10/18/2025',
      'open',
      '1',
      '2.50',
      '150.00',
      '148.50',
      '',
      '',
      'false',
      'false',
      ''
    ]

    const csvContent = [headers, sampleData].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'trades_template.csv'
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between -m-3 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">CSV Batch Upload</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors"
          title={isExpanded ? "Collapse section" : "Expand section"}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3 mt-3">
          <div className="flex gap-2">
            <button
              onClick={downloadTemplate}
              className="btn-secondary text-xs py-1.5 px-2 flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" />
              Download Template
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="csv-upload"
              className={`cursor-pointer flex flex-col items-center gap-2 hover:bg-gray-50 ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-600">
                {isUploading ? 'Uploading...' : 'Click to upload CSV file'}
              </span>
            </label>
          </div>

          {uploadStatus === 'success' && (
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-800">
                Successfully uploaded {successCount} trades!
              </span>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-red-800">
                  <div className="font-medium mb-1">Upload Failed</div>
                  <pre className="whitespace-pre-wrap text-xs bg-red-100 p-2 rounded border overflow-auto max-h-32">
                    {errorMessage}
                  </pre>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Required:</strong> ticker, account, trading_date, option_type, expiration_date, status, contracts, cost, strike_price, price_at_purchase</p>
            <p><strong>Optional:</strong> realized_pl, unrealized_pl, audited, exercised, closed_date</p>
            <p><strong>Dates:</strong> MM/DD/YYYY or YYYY-MM-DD | <strong>Booleans:</strong> true/false | <strong>Option types:</strong> Any value allowed</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CSVUpload
