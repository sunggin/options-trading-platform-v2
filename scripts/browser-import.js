// Browser console import script for Google Sheet data
// Run this in your browser console on the history page

const tradesData = [
  {
    account: 'ST Operating',
    trading_date: '2025-06-23',
    ticker: 'HIMS',
    price_at_purchase: 57.82,
    option_type: 'Call option',
    contracts: 1,
    strike_price: 45.00,
    cost: 1450.68,
    expiration_date: '2026-01-16',
    status: 'closed',
    realized_pl: 187.65,
    audited: true,
    exercised: false,
    priority: false,
    closed_date: '2025-06-23'
  },
  {
    account: 'ST Operating',
    trading_date: '2025-07-02',
    ticker: 'HIMS',
    price_at_purchase: 57.82,
    option_type: 'Call option',
    contracts: 1,
    strike_price: 45.00,
    cost: 1420.68,
    expiration_date: '2026-01-16',
    status: 'closed',
    realized_pl: 157.65,
    audited: true,
    exercised: false,
    priority: false,
    closed_date: '2025-07-02'
  },
  {
    account: 'ST Operating',
    trading_date: '2025-09-08',
    ticker: 'LULU',
    price_at_purchase: 169.62,
    option_type: 'Call option',
    contracts: 2,
    strike_price: 200.00,
    cost: 3271.35,
    expiration_date: '2026-06-18',
    status: 'closed',
    realized_pl: 167.30,
    audited: true,
    exercised: false,
    priority: false,
    closed_date: '2025-09-08'
  },
  {
    account: 'ST',
    trading_date: '2025-09-16',
    ticker: 'LULU',
    price_at_purchase: 169.62,
    option_type: 'Covered call',
    contracts: 1,
    strike_price: 165.00,
    cost: 0.00,
    expiration_date: '2025-09-19',
    status: 'closed',
    realized_pl: 3.66,
    unrealized_pl: 188.33,
    audited: true,
    exercised: false,
    priority: false,
    closed_date: '2025-09-16'
  },
  {
    account: 'ST Operating',
    trading_date: '2025-09-15',
    ticker: 'HOOD',
    price_at_purchase: 124.78,
    option_type: 'Cash secured put',
    contracts: 1,
    strike_price: 115.00,
    cost: 0.00,
    expiration_date: '2025-09-19',
    status: 'closed',
    realized_pl: 331.31,
    audited: true,
    exercised: false,
    priority: false,
    closed_date: '2025-09-15'
  },
  {
    account: 'ST Operating',
    trading_date: '2025-09-15',
    ticker: 'HOOD',
    price_at_purchase: 124.78,
    option_type: 'Cash secured put',
    contracts: 1,
    strike_price: 113.00,
    cost: 0.00,
    expiration_date: '2025-09-19',
    status: 'closed',
    realized_pl: 249.31,
    audited: true,
    exercised: false,
    priority: false,
    closed_date: '2025-09-15'
  },
  {
    account: 'ST Operating',
    trading_date: '2025-09-15',
    ticker: 'LULU',
    price_at_purchase: 169.62,
    option_type: 'Covered call',
    contracts: 1,
    strike_price: 165.00,
    cost: 0.00,
    expiration_date: '2025-09-19',
    status: 'closed',
    realized_pl: -301.34,
    audited: true,
    exercised: false,
    priority: false,
    closed_date: '2025-09-15'
  },
  {
    account: 'ST',
    trading_date: '2025-09-10',
    ticker: 'RBRK',
    price_at_purchase: 80.23,
    option_type: 'Cash secured put',
    contracts: 1,
    strike_price: 85.00,
    cost: 0.00,
    expiration_date: '2025-09-19',
    status: 'closed',
    realized_pl: -181.34,
    audited: true,
    exercised: false,
    priority: false,
    closed_date: '2025-09-10'
  },
  {
    account: 'SAE',
    trading_date: '2025-09-02',
    ticker: 'ATYR',
    price_at_purchase: 0.99,
    option_type: 'Cash secured put',
    contracts: 50,
    strike_price: 3.00,
    cost: 0.00,
    expiration_date: '2025-09-19',
    status: 'closed',
    realized_pl: -5767.34,
    audited: true,
    exercised: false,
    priority: false,
    closed_date: '2025-09-02'
  },
  {
    account: 'ST Operating',
    trading_date: '2025-09-03',
    ticker: 'ATYR',
    price_at_purchase: 0.99,
    option_type: 'Cash secured put',
    contracts: 25,
    strike_price: 2.00,
    cost: 0.00,
    expiration_date: '2025-09-19',
    status: 'closed',
    realized_pl: -1608.68,
    audited: true,
    exercised: false,
    priority: false,
    closed_date: '2025-09-03'
  },
  {
    account: 'ST Operating',
    trading_date: '2025-09-08',
    ticker: 'ATYR',
    price_at_purchase: 0.99,
    option_type: 'Cash secured put',
    contracts: 50,
    strike_price: 3.00,
    cost: 0.00,
    expiration_date: '2025-09-19',
    status: 'closed',
    realized_pl: -6067.34,
    audited: true,
    exercised: false,
    priority: false,
    closed_date: '2025-09-08'
  },
  {
    account: 'SAE',
    trading_date: '2025-09-15',
    ticker: 'ATYR',
    price_at_purchase: 0.99,
    option_type: 'Cash secured put',
    contracts: 22,
    strike_price: 1.00,
    cost: 0.00,
    expiration_date: '2025-09-19',
    status: 'closed',
    realized_pl: 97.96,
    audited: true,
    exercised: false,
    priority: false,
    closed_date: '2025-09-15'
  },
  {
    account: 'ST Operating',
    trading_date: '2025-08-21',
    ticker: 'CAVA',
    price_at_purchase: 63.53,
    option_type: 'Covered call',
    contracts: 1,
    strike_price: 82.00,
    cost: 0.00,
    expiration_date: '2025-09-19',
    status: 'closed',
    realized_pl: 32.33,
    audited: false,
    exercised: false,
    priority: false,
    closed_date: '2025-08-21'
  },
  {
    account: 'ST Operating',
    trading_date: '2025-08-21',
    ticker: 'CAVA',
    price_at_purchase: 63.53,
    option_type: 'Covered call',
    contracts: 1,
    strike_price: 80.00,
    cost: 0.00,
    expiration_date: '2025-09-19',
    status: 'closed',
    realized_pl: 41.33,
    audited: false,
    exercised: false,
    priority: false,
    closed_date: '2025-08-21'
  },
  {
    account: 'ST',
    trading_date: '2025-09-15',
    ticker: 'AMD',
    price_at_purchase: 157.39,
    option_type: 'Covered call',
    contracts: 1,
    strike_price: 160.00,
    cost: 0.00,
    expiration_date: '2025-09-19',
    status: 'closed',
    realized_pl: 314.33,
    audited: false,
    exercised: false,
    priority: false,
    closed_date: '2025-09-15'
  },
  {
    account: 'SAE',
    trading_date: '2025-09-15',
    ticker: 'HOOD',
    price_at_purchase: 124.78,
    option_type: 'Covered call',
    contracts: 2,
    strike_price: 120.00,
    cost: 0.00,
    expiration_date: '2025-09-19',
    status: 'closed',
    realized_pl: 0, // "Check" in the sheet - setting to 0
    audited: false,
    exercised: false,
    priority: false,
    closed_date: '2025-09-15'
  },
  {
    account: 'ST Operating',
    trading_date: '2025-09-15',
    ticker: 'RBRK',
    price_at_purchase: 80.23,
    option_type: 'Cash secured put',
    contracts: 2,
    strike_price: 77.50,
    cost: 0.00,
    expiration_date: '2025-09-19',
    status: 'closed',
    realized_pl: 478.60,
    audited: true,
    exercised: false,
    priority: false,
    closed_date: '2025-09-15'
  },
  {
    account: 'ST Operating',
    trading_date: '2025-09-15',
    ticker: 'FI',
    price_at_purchase: 131.80,
    option_type: 'Covered call',
    contracts: 2,
    strike_price: 137.00,
    cost: 0.00,
    expiration_date: '2025-09-19',
    status: 'closed',
    realized_pl: 198.66,
    audited: false,
    exercised: false,
    priority: false,
    closed_date: '2025-09-15'
  },
  {
    account: 'SAE',
    trading_date: '2025-09-15',
    ticker: 'OPEN',
    price_at_purchase: 9.57,
    option_type: 'Cash secured put',
    contracts: 5,
    strike_price: 8.00,
    cost: 0.00,
    expiration_date: '2025-09-19',
    status: 'closed',
    realized_pl: 141.51,
    audited: true,
    exercised: false,
    priority: false,
    closed_date: '2025-09-15'
  },
  {
    account: 'ST Operating',
    trading_date: '2025-09-15',
    ticker: 'FI',
    price_at_purchase: 131.80,
    option_type: 'Cash secured put',
    contracts: 1,
    strike_price: 135.00,
    cost: 0.00,
    expiration_date: '2025-09-19',
    status: 'closed',
    realized_pl: -120.34,
    audited: true,
    exercised: false,
    priority: false,
    closed_date: '2025-09-15'
  },
  {
    account: 'ST Operating',
    trading_date: '2025-09-15',
    ticker: 'ARM',
    price_at_purchase: 142.91,
    option_type: 'Cash secured put',
    contracts: 1,
    strike_price: 155.00,
    cost: 0.00,
    expiration_date: '2025-09-19',
    status: 'closed',
    realized_pl: 429.33,
    audited: false, // "Check" in the sheet - setting to false
    exercised: false,
    priority: false,
    closed_date: '2025-09-15'
  },
  {
    account: 'ST Operating',
    trading_date: '2025-09-16',
    ticker: 'RBRK',
    price_at_purchase: 80.23,
    option_type: 'Cash secured put',
    contracts: 1,
    strike_price: 75.00,
    cost: 0.00,
    expiration_date: '2025-09-19',
    status: 'closed',
    realized_pl: 404.60,
    audited: true,
    exercised: false,
    priority: false,
    closed_date: '2025-09-16'
  },
  {
    account: 'ST Operating',
    trading_date: '2025-09-16',
    ticker: 'FI',
    price_at_purchase: 131.80,
    option_type: 'Cash secured put',
    contracts: 1,
    strike_price: 132.00,
    cost: 0.00,
    expiration_date: '2025-09-19',
    status: 'closed',
    realized_pl: 169.33,
    audited: true,
    exercised: false,
    priority: false,
    closed_date: '2025-09-16'
  }
]

// Function to import trades (run this in browser console)
async function importGoogleSheetData() {
  try {
    console.log('Starting import of Google Sheet data...')
    
    // Get the supabase client from the page
    const { supabase } = await import('/lib/supabase.ts')
    
    // Insert new trades (add to existing data)
    console.log(`Importing ${tradesData.length} trades...`)
    
    const { data, error } = await supabase
      .from('trades')
      .insert(tradesData)
      .select()
    
    if (error) {
      console.error('Error importing trades:', error)
      return
    }
    
    console.log(`Successfully added ${data.length} trades to your existing data!`)
    console.log('Trades added:')
    data.forEach((trade, index) => {
      console.log(`${index + 1}. ${trade.account} - ${trade.ticker} - ${trade.option_type} - $${trade.realized_pl}`)
    })
    
    // Refresh the page to show the new data
    window.location.reload()
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Export the function for use
window.importGoogleSheetData = importGoogleSheetData

console.log('Google Sheet import script loaded!')
console.log('Run: importGoogleSheetData() to import the data')
