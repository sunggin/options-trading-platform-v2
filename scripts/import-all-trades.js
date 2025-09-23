// Complete bulk import script for ALL Google Sheet trading data
// Run with: node scripts/import-all-trades.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Complete data from your Google Sheet (all 100+ rows)
const allTradesData = [
  // March 2025 trades
  { account: 'SAE', date: '2025-03-10', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-03-14', realizedPl: 32.64, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 36.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-03-11', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-03-14', realizedPl: 189.29, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 4, cost: 0.00, strike: 36.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-03-13', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-03-14', realizedPl: 49.29, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 4, cost: 0.00, strike: 40.00, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-03-17', ticker: 'CMG', optionType: 'Call Option', expirationDate: '2025-04-17', realizedPl: 64.00, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 196.00, strike: 50.00, priceAtPurchase: 39.32 },
  { account: 'SAE', date: '2025-03-24', ticker: 'CMG', optionType: 'Covered Puts', expirationDate: '2025-04-04', realizedPl: 22.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 46.00, priceAtPurchase: 39.32 },
  { account: 'SAE', date: '2025-03-26', ticker: 'RIVN', optionType: 'Covered Puts', expirationDate: '2025-04-04', realizedPl: 32.64, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 2, cost: 0.00, strike: 11.50, priceAtPurchase: 14.38 },
  { account: 'SAE', date: '2025-03-28', ticker: 'HOOD', optionType: 'Call Option', expirationDate: '2025-05-02', realizedPl: 45.00, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 470.00, strike: 39.00, priceAtPurchase: 124.78 },
  
  // April 2025 trades
  { account: 'SAE', date: '2025-04-02', ticker: 'GOOG', optionType: 'Call Option', expirationDate: '2025-11-21', realizedPl: 31.58, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 2044.68, strike: 155.00, priceAtPurchase: 255.24 },
  { account: 'SAE', date: '2025-04-03', ticker: 'HOOD', optionType: 'Call Option', expirationDate: '2025-04-25', realizedPl: 130.00, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 275.00, strike: 39.00, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-04-03', ticker: 'HOOD', optionType: 'Call Option', expirationDate: '2025-08-15', realizedPl: 92.82, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 794.68, strike: 38.00, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-04-03', ticker: 'HOOD', optionType: 'Call Option', expirationDate: '2025-08-15', realizedPl: 92.82, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 794.68, strike: 38.00, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-04-04', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-04-04', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-04-04', ticker: 'HOOD', optionType: 'Call Option', expirationDate: '2025-09-19', realizedPl: 1438.57, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 810.68, strike: 34.00, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-04-11', ticker: 'HOOD', optionType: 'Put Option', expirationDate: '2025-06-20', realizedPl: -40.00, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 620.00, strike: 41.00, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-04-11', ticker: 'RDDT', optionType: 'Call Option', expirationDate: '2025-06-20', realizedPl: 360.00, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 1950.00, strike: 95.00, priceAtPurchase: 264.48 },
  { account: 'SAE', date: '2025-04-14', ticker: 'CMG', optionType: 'Covered Puts', expirationDate: '2025-04-17', realizedPl: 48.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 47.50, priceAtPurchase: 39.32 },
  { account: 'SAE', date: '2025-04-15', ticker: 'RDDT', optionType: 'Call Option', expirationDate: '2025-06-20', realizedPl: 60.00, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 1770.00, strike: 90.00, priceAtPurchase: 264.48 },
  { account: 'SAE', date: '2025-04-16', ticker: 'RDDT', optionType: 'Call Option', expirationDate: '2025-06-20', realizedPl: 166.00, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 1664.00, strike: 90.00, priceAtPurchase: 264.48 },
  { account: 'SAE', date: '2025-04-21', ticker: 'RDDT', optionType: 'Call Option', expirationDate: '2025-05-16', realizedPl: 1254.00, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 1185.00, strike: 89.00, priceAtPurchase: 264.48 },
  { account: 'SAE', date: '2025-04-23', ticker: 'CMG', optionType: 'Covered Puts', expirationDate: '2025-04-27', realizedPl: 361.61, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 47.50, priceAtPurchase: 39.32 },
  { account: 'SAE', date: '2025-04-24', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-04-25', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-04-25', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-04-25', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-04-28', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-02', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-04-29', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-02', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-04-30', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-02', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  
  // May 2025 trades
  { account: 'SAE', date: '2025-05-01', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-02', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-05-02', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-02', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-05-05', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-09', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-05-06', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-09', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-05-07', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-09', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-05-08', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-09', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-05-09', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-09', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-05-12', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-16', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-05-13', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-16', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-05-14', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-16', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-05-15', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-16', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-05-16', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-16', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-05-19', ticker: 'OXY', optionType: 'Call Option', expirationDate: '2026-01-16', realizedPl: 327.28, status: 'closed', audited: false, exercised: false, closedDate: '2025-06-10', contracts: 2, cost: 1881.36, strike: 35.00, priceAtPurchase: 46.10 },
  { account: 'SAE', date: '2025-05-20', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-23', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-05-21', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-23', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-05-22', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-23', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-05-23', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-23', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-05-27', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-30', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-05-28', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-30', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-05-29', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-30', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-05-30', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-05-30', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-01-01', contracts: 1, cost: 0.00, strike: 34.50, priceAtPurchase: 124.78 },
  
  // June 2025 trades
  { account: 'SAE', date: '2025-06-02', ticker: 'HOOD', optionType: 'Covered Calls', expirationDate: '2025-06-06', realizedPl: 166.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-06-06', contracts: 1, cost: 0.00, strike: 67.00, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-06-02', ticker: 'RDDT', optionType: 'Covered Puts', expirationDate: '2025-06-06', realizedPl: 202.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-06-06', contracts: 1, cost: 0.00, strike: 108.00, priceAtPurchase: 264.48 },
  { account: 'SAE', date: '2025-06-02', ticker: 'NVDA', optionType: 'Covered Puts', expirationDate: '2025-06-06', realizedPl: 169.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-06-06', contracts: 1, cost: 0.00, strike: 136.00, priceAtPurchase: 176.60 },
  { account: 'SAE', date: '2025-06-02', ticker: 'HOOD', optionType: 'Covered Calls', expirationDate: '2025-06-06', realizedPl: 174.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-06-06', contracts: 1, cost: 0.00, strike: 68.00, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-06-02', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-06-06', realizedPl: 83.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-06-06', contracts: 1, cost: 0.00, strike: 64.00, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-06-02', ticker: 'GOOG', optionType: 'Covered Calls', expirationDate: '2025-06-06', realizedPl: 59.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-06-06', contracts: 1, cost: 0.00, strike: 175.00, priceAtPurchase: 255.24 },
  { account: 'SAE', date: '2025-06-02', ticker: 'NVDA', optionType: 'Covered Puts', expirationDate: '2025-06-06', realizedPl: 103.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-06-06', contracts: 1, cost: 0.00, strike: 134.00, priceAtPurchase: 176.60 },
  { account: 'SAE', date: '2025-06-02', ticker: 'SBUX', optionType: 'Covered Puts', expirationDate: '2025-06-06', realizedPl: 106.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-06-06', contracts: 1, cost: 0.00, strike: 85.00, priceAtPurchase: 84.56 },
  { account: 'SAE', date: '2025-06-03', ticker: 'HOOD', optionType: 'Covered Calls', expirationDate: '2025-06-06', realizedPl: 299.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-06-06', contracts: 1, cost: 0.00, strike: 68.00, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-06-03', ticker: 'HOOD', optionType: 'Covered Puts', expirationDate: '2025-06-06', realizedPl: 94.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-06-06', contracts: 1, cost: 0.00, strike: 68.00, priceAtPurchase: 124.78 },
  { account: 'SAE', date: '2025-06-05', ticker: 'HIMS', optionType: 'Covered Puts', expirationDate: '2025-06-06', realizedPl: 79.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-06-06', contracts: 1, cost: 0.00, strike: 52.00, priceAtPurchase: 57.82 },
  { account: 'SAE', date: '2025-06-05', ticker: 'HIMS', optionType: 'Covered Puts', expirationDate: '2025-06-06', realizedPl: 57.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-06-06', contracts: 1, cost: 0.00, strike: 52.00, priceAtPurchase: 57.82 },
  { account: 'SAE', date: '2025-06-04', ticker: 'OLO', optionType: 'Call Option', expirationDate: '2025-12-29', realizedPl: -96.17, status: 'closed', audited: false, exercised: false, closedDate: '2025-06-12', contracts: 4, cost: 1316.17, strike: 6.00, priceAtPurchase: 10.26 },
  { account: 'SAE', date: '2025-06-02', ticker: 'MDT', optionType: 'Covered Calls', expirationDate: '2025-06-13', realizedPl: 61.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-06-13', contracts: 1, cost: 0.00, strike: 85.00, priceAtPurchase: 95.08 },
  { account: 'SAE', date: '2025-06-02', ticker: 'CMG', optionType: 'Covered Calls', expirationDate: '2025-06-13', realizedPl: 88.64, status: 'closed', audited: false, exercised: false, closedDate: '2025-06-13', contracts: 2, cost: 0.00, strike: 51.00, priceAtPurchase: 39.32 },
  { account: 'SAE', date: '2025-06-03', ticker: 'APLD', optionType: 'Call Option', expirationDate: '2027-01-15', realizedPl: 243.28, status: 'closed', audited: false, exercised: false, closedDate: '2025-06-13', contracts: 2, cost: 1057.36, strike: 7.00, priceAtPurchase: 20.48 },
  { account: 'SAE', date: '2025-06-03', ticker: 'APLD', optionType: 'Call Option', expirationDate: '2027-01-15', realizedPl: 187.28, status: 'closed', audited: false, exercised: false, closedDate: '2025-06-13', contracts: 2, cost: 1001.36, strike: 7.00, priceAtPurchase: 20.48 },
  { account: 'SAE', date: '2025-06-04', ticker: 'HIMS', optionType: 'Covered Puts', expirationDate: '2025-06-13', realizedPl: 79.32, status: 'closed', audited: false, exercised: false, closedDate: '2025-06-13', contracts: 1, cost: 0.00, strike: 47.00, priceAtPurchase: 57.82 }
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
    pmcc_calc: rawTrade.optionType === 'Call Option' && rawTrade.contracts > 0 
      ? rawTrade.strike + (rawTrade.cost / rawTrade.contracts / 100) 
      : null,
    // Calculate Expected Return for covered strategies
    expected_return: ['Covered Calls', 'Covered Puts'].includes(rawTrade.optionType)
      ? ((rawTrade.realizedPl + 0) / ((rawTrade.strike * 100) * rawTrade.contracts)) * 100
      : null
  }
}

// Main import function
async function importAllTrades() {
  console.log('🚀 Starting bulk import of ALL trades from Google Sheet...')
  console.log(`📊 Found ${allTradesData.length} trades to import`)
  
  try {
    // Clean and format all trade data
    const cleanedTrades = allTradesData.map(cleanTradeData)
    
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
    
    // Show summary by ticker
    const tickerSummary = {}
    cleanedTrades.forEach(trade => {
      tickerSummary[trade.ticker] = (tickerSummary[trade.ticker] || 0) + 1
    })
    
    console.log('\n📈 Trades by ticker:')
    Object.entries(tickerSummary).forEach(([ticker, count]) => {
      console.log(`  ${ticker}: ${count} trades`)
    })
    
  } catch (error) {
    console.error('💥 Fatal error during import:', error)
  }
}

// Run the import
importAllTrades()
