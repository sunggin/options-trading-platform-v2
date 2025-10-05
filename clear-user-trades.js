// Server-side script to clear all trades for a specific user
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin operations

console.log('🗑️  CLEARING ALL TRADES FOR USER')
console.log('==================================')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function clearUserTrades(userId) {
  if (!userId) {
    console.error('❌ Please provide a user ID')
    console.log('Usage: node clear-user-trades.js <user-id>')
    process.exit(1)
  }

  try {
    console.log(`🔍 Checking trades for user: ${userId}`)
    
    // First, get the count of trades for this user
    const { count, error: countError } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    if (countError) {
      console.error('❌ Error counting trades:', countError.message)
      return
    }
    
    console.log(`📊 Found ${count} trades for user ${userId}`)
    
    if (count === 0) {
      console.log('✅ User has no trades to delete!')
      return
    }
    
    // Delete all trades for this user
    console.log('🗑️  Deleting all trades for user...')
    const { error: deleteError } = await supabase
      .from('trades')
      .delete()
      .eq('user_id', userId)
    
    if (deleteError) {
      console.error('❌ Error deleting trades:', deleteError.message)
      return
    }
    
    // Verify deletion
    const { count: newCount, error: verifyError } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    if (verifyError) {
      console.error('❌ Error verifying deletion:', verifyError.message)
      return
    }
    
    console.log(`✅ Successfully deleted all trades for user!`)
    console.log(`📊 Remaining trades for user: ${newCount}`)
    
    if (newCount === 0) {
      console.log('🎉 User database is now completely empty!')
    } else {
      console.log('⚠️  Some trades may still remain.')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

// Get user ID from command line arguments
const userId = process.argv[2]
clearUserTrades(userId)
