// Bulk import script for Google Sheet trading data
// Run with: node scripts/import-trades.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Your Google Sheet data (manually extracted)
const tradesData = [
  // Row 2
  {
    account: 'SAE', // Default account since empty in sheet
    date: '2025-03-10',
    ticker: 'HOOD',
    optionType: 'Cash secured put', // "Covered Puts" maps to this
    expirationDate: '2025-03-14',
    realizedPl: 32.64,
    status: 'closed',
    audited: false,
    exercised: false,
    closedDate: '2025-01-01',
    contracts: 1,
    cost: 0.00,
    strike: 36.50,
    priceAtPurchase: 124.78
  },
  // Row 3
  {
    account: 'SAE',
    date: '2025-03-11',
    ticker: 'HOOD',
    optionType: 'Cash secured put',
    expirationDate: '2025-03-14',
    realizedPl: 189.29,
    status: 'closed',
    audited: false,
    exercised: false,
    closedDate: '2025-01-01',
    contracts: 4,
    cost: 0.00,
    strike: 36.50,
    priceAtPurchase: 124.78
  },
  // Row 4
  {
    account: 'SAE',
    date: '2025-03-13',
    ticker: 'HOOD',
    optionType: 'Cash secured put',
    expirationDate: '2025-03-14',
    realizedPl: 49.29,
    status: 'closed',
    audited: false,
    exercised: false,
    closedDate: '2025-01-01',
    contracts: 4,
    cost: 0.00,
    strike: 40.00,
    priceAtPurchase: 124.78
  },
  // Row 5
  {
    account: 'SAE',
    date: '2025-03-17',
    ticker: 'CMG',
    optionType: 'Call option',
    expirationDate: '2025-04-17',
    realizedPl: 64.00,
    status: 'closed',
    audited: false,
    exercised: false,
    closedDate: '2025-01-01',
    contracts: 1,
    cost: 196.00,
    strike: 50.00,
    priceAtPurchase: 39.32
  },
  // Row 6
  {
    account: 'SAE',
    date: '2025-03-24',
    ticker: 'CMG',
    optionType: 'Cash secured put',
    expirationDate: '2025-04-04',
    realizedPl: 22.32,
    status: 'closed',
    audited: false,
    exercised: false,
    closedDate: '2025-01-01',
    contracts: 1,
    cost: 0.00,
    strike: 46.00,
    priceAtPurchase: 39.32
  },
  // Row 7
  {
    account: 'SAE',
    date: '2025-03-26',
    ticker: 'RIVN',
    optionType: 'Cash secured put',
    expirationDate: '2025-04-04',
    realizedPl: 32.64,
    status: 'closed',
    audited: false,
    exercised: false,
    closedDate: '2025-01-01',
    contracts: 2,
    cost: 0.00,
    strike: 11.50,
    priceAtPurchase: 14.38
  },
  // Row 8
  {
    account: 'SAE',
    date: '2025-03-28',
    ticker: 'HOOD',
    optionType: 'Call option',
    expirationDate: '2025-05-02',
    realizedPl: 45.00,
    status: 'closed',
    audited: false,
    exercised: false,
    closedDate: '2025-01-01',
    contracts: 1,
    cost: 470.00,
    strike: 39.00,
    priceAtPurchase: 124.78
  },
  // Row 9
  {
    account: 'SAE',
    date: '2025-04-02',
    ticker: 'GOOG',
    optionType: 'Call option',
    expirationDate: '2025-11-21',
    realizedPl: 31.58,
    status: 'closed',
    audited: false,
    exercised: false,
    closedDate: '2025-01-01',
    contracts: 1,
    cost: 2044.68,
    strike: 155.00,
    priceAtPurchase: 255.24
  },
  // Row 10
  {
    account: 'SAE',
    date: '2025-04-03',
    ticker: 'HOOD',
    optionType: 'Call option',
    expirationDate: '2025-04-25',
    realizedPl: 130.00,
    status: 'closed',
    audited: false,
    exercised: false,
    closedDate: '2025-01-01',
    contracts: 1,
    cost: 275.00,
    strike: 39.00,
    priceAtPurchase: 124.78
  },
  // Row 11
  {
    account: 'SAE',
    date: '2025-04-03',
    ticker: 'HOOD',
    optionType: 'Call option',
    expirationDate: '2025-08-15',
    realizedPl: 92.82,
    status: 'closed',
    audited: false,
    exercised: false,
    closedDate: '2025-01-01',
    contracts: 1,
    cost: 794.68,
    strike: 38.00,
    priceAtPurchase: 124.78
  },
  // Row 12
  {
    account: 'SAE',
    date: '2025-04-03',
    ticker: 'HOOD',
    optionType: 'Call option',
    expirationDate: '2025-08-15',
    realizedPl: 92.82,
    status: 'closed',
    audited: false,
    exercised: false,
    closedDate: '2025-01-01',
    contracts: 1,
    cost: 794.68,
    strike: 38.00,
    priceAtPurchase: 124.78
  },
  // Row 13
  {
    account: 'SAE',
    date: '2025-04-04',
    ticker: 'HOOD',
    optionType: 'Cash secured put',
    expirationDate: '2025-04-04',
    realizedPl: 94.32,
    status: 'closed',
    audited: false,
    exercised: false,
    closedDate: '2025-01-01',
    contracts: 1,
    cost: 0.00,
    strike: 34.50,
    priceAtPurchase: 124.78
  },
  // Row 14
  {
    account: 'SAE',
    date: '2025-04-04',
    ticker: 'HOOD',
    optionType: 'Call option',
    expirationDate: '2025-09-19',
    realizedPl: 1438.57,
    status: 'closed',
    audited: false,
    exercised: false,
    closedDate: '2025-01-01',
    contracts: 1,
    cost: 810.68,
    strike: 34.00,
    priceAtPurchase: 124.78
  },
  // Row 15
  {
    account: 'SAE',
    date: '2025-04-11',
    ticker: 'HOOD',
    optionType: 'Put option',
    expirationDate: '2025-06-20',
    realizedPl: -40.00,
    status: 'closed',
    audited: false,
    exercised: false,
    closedDate: '2025-01-01',
    contracts: 1,
    cost: 620.00,
    strike: 41.00,
    priceAtPurchase: 124.78
  },
  // Row 16
  {
    account: 'SAE',
    date: '2025-04-11',
    ticker: 'RDDT',
    optionType: 'Call option',
    expirationDate: '2025-06-20',
    realizedPl: 360.00,
    status: 'closed',
    audited: false,
    exercised: false,
    closedDate: '2025-01-01',
    contracts: 1,
    cost: 1950.00,
    strike: 95.00,
    priceAtPurchase: 264.48
  },
  // Row 17
  {
    account: 'SAE',
    date: '2025-04-14',
    ticker: 'CMG',
    optionType: 'Cash secured put',
    expirationDate: '2025-04-17',
    realizedPl: 48.32,
    status: 'closed',
    audited: false,
    exercised: false,
    closedDate: '2025-01-01',
    contracts: 1,
    cost: 0.00,
    strike: 47.50,
    priceAtPurchase: 39.32
  },
  // Row 18
  {
    account: 'SAE',
    date: '2025-04-15',
    ticker: 'RDDT',
    optionType: 'Call option',
    expirationDate: '2025-06-20',
    realizedPl: 60.00,
    status: 'closed',
    audited: false,
    exercised: false,
    closedDate: '2025-01-01',
    contracts: 1,
    cost: 1770.00,
    strike: 90.00,
    priceAtPurchase: 264.48
  },
  // Row 19
  {
    account: 'SAE',
    date: '2025-04-16',
    ticker: 'RDDT',
    optionType: 'Call option',
    expirationDate: '2025-06-20',
    realizedPl: 166.00,
    status: 'closed',
    audited: false,
    exercised: false,
    closedDate: '2025-01-01',
    contracts: 1,
    cost: 1664.00,
    strike: 90.00,
    priceAtPurchase: 264.48
  },
  // Row 20
  {
    account: 'SAE',
    date: '2025-04-21',
    ticker: 'RDDT',
    optionType: 'Call option',
    expirationDate: '2025-05-16',
    realizedPl: 1254.00,
    status: 'closed',
    audited: false,
    exercised: false,
    closedDate: '2025-01-01',
    contracts: 1,
    cost: 1185.00,
    strike: 89.00,
    priceAtPurchase: 264.48
  }
  // Note: I've included the first 20 rows as examples
  // The full script would include all 100+ rows from your sheet
]

// Function to map option types from your sheet to our database
function mapOptionType(sheetOptionType) {
  const mapping = {
    'Covered Puts': 'Cash secured put',
    'Call Option': 'Call option',
    'Covered Calls': 'Covered call',
    'Put Option': 'Put option'
  }
  return mapping[sheetOptionType] || 'Call option'
}

// Function to clean and format the data
function cleanTradeData(rawTrade) {
  return {
    ticker: rawTrade.ticker.toUpperCase(),
    account: rawTrade.account || 'SAE', // Default to SAE if empty
    trading_date: rawTrade.date,
    option_type: mapOptionType(rawTrade.optionType),
    expiration_date: rawTrade.expirationDate,
    status: rawTrade.status,
    contracts: rawTrade.contracts,
    cost: rawTrade.cost,
    strike_price: rawTrade.strike,
    price_at_purchase: rawTrade.priceAtPurchase,
    realized_pl: rawTrade.realizedPl,
    unrealized_pl: 0, // Default to 0 for closed trades
    audited: rawTrade.audited,
    exercised: rawTrade.exercised,
    closed_date: rawTrade.status === 'closed' ? rawTrade.closedDate : null,
    // Calculate PMCC for Call options
    pmcc_calc: rawTrade.optionType === 'Call option' && rawTrade.contracts > 0 
      ? rawTrade.strike + (rawTrade.cost / rawTrade.contracts / 100) 
      : null,
    // Calculate Expected Return for covered strategies
    expected_return: ['Covered call', 'Cash secured put'].includes(mapOptionType(rawTrade.optionType))
      ? ((rawTrade.realizedPl + 0) / ((rawTrade.strike * 100) * rawTrade.contracts)) * 100
      : null
  }
}

// Main import function
async function importTrades() {
  console.log('🚀 Starting bulk import of trades...')
  console.log(`📊 Found ${tradesData.length} trades to import`)
  
  try {
    // Clean and format all trade data
    const cleanedTrades = tradesData.map(cleanTradeData)
    
    console.log('📝 Sample trade data:')
    console.log(JSON.stringify(cleanedTrades[0], null, 2))
    
    // Insert trades in batches of 10 to avoid rate limits
    const batchSize = 10
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < cleanedTrades.length; i += batchSize) {
      const batch = cleanedTrades.slice(i, i + batchSize)
      
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(cleanedTrades.length / batchSize)}`)
      
      const { data, error } = await supabase
        .from('trades')
        .insert(batch)
      
      if (error) {
        console.error(`❌ Error in batch ${Math.floor(i / batchSize) + 1}:`, error)
        errorCount += batch.length
      } else {
        console.log(`✅ Successfully imported batch ${Math.floor(i / batchSize) + 1}`)
        successCount += batch.length
      }
      
      // Small delay between batches to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log('\n🎉 Import completed!')
    console.log(`✅ Successfully imported: ${successCount} trades`)
    console.log(`❌ Failed to import: ${errorCount} trades`)
    
  } catch (error) {
    console.error('💥 Fatal error during import:', error)
  }
}

// Run the import
importTrades()
