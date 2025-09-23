import { Trade } from './supabase'

export interface ExportOptions {
  format: 'csv' | 'google-sheets'
  filename?: string
}

export function exportTradesToCSV(trades: Trade[], filename: string = 'trades-export.csv') {
  // Define CSV headers
  const headers = [
    'Account',
    'Trading Date',
    'Ticker',
    'Price @ Purchase',
    'Current Price',
    'Option Type',
    'Contracts',
    'Strike Price',
    'Cost',
    'Expiration Date',
    'Status',
    'Realized P&L',
    'Unrealized P&L',
    'Expected Return',
    'Audited',
    'Exercised',
    'Priority',
    'Closed Date'
  ]

  // Convert trades to CSV format
  const csvContent = [
    headers.join(','),
    ...trades.map(trade => [
      `"${trade.account || ''}"`,
      `"${trade.trading_date}"`,
      `"${trade.ticker}"`,
      trade.price_at_purchase || 0,
      trade.current_price || 0,
      `"${trade.option_type}"`,
      trade.contracts || 0,
      trade.strike_price || 0,
      trade.cost || 0,
      `"${trade.expiration_date}"`,
      `"${trade.status}"`,
      trade.realized_pl || 0,
      trade.unrealized_pl || 0,
      trade.expected_return || 0,
      trade.audited ? 'TRUE' : 'FALSE',
      trade.exercised ? 'TRUE' : 'FALSE',
      trade.priority ? 'TRUE' : 'FALSE',
      trade.closed_date ? `"${trade.closed_date}"` : ''
    ].join(','))
  ].join('\n')

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportTradesToGoogleSheets(trades: Trade[]) {
  // For now, we'll export as CSV which can be easily imported into Google Sheets
  // In a production environment, you would implement the Google Sheets API integration
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `trades-export-${timestamp}.csv`
  
  exportTradesToCSV(trades, filename)
  
  // Show instructions for importing to Google Sheets
  alert(`CSV file downloaded! To import into Google Sheets:\n\n1. Open Google Sheets\n2. Go to File > Import\n3. Upload the downloaded CSV file\n4. Choose "Replace current sheet" or "Create new sheet"\n5. Click "Import data"`)
}

export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
