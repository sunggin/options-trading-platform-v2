// Server-side script to clear all trades - this will definitely work
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🗑️  SERVER-SIDE TRADE DELETION')
console.log('===============================')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration!')
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function clearAllTrades() {
  try {
    console.log('🔍 Checking current trade count...')
    
    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Error counting trades:', countError.message)
      return
    }
    
    console.log(`📊 Found ${totalCount} total trades in database`)
    
    if (totalCount === 0) {
      console.log('✅ Database is already empty!')
      return
    }
    
    // Delete all trades using service role key (bypasses RLS)
    console.log('🗑️  Deleting all trades...')
    const { error: deleteError } = await supabase
      .from('trades')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows
    
    if (deleteError) {
      console.error('❌ Error deleting trades:', deleteError.message)
      return
    }
    
    // Verify deletion
    const { count: newCount, error: verifyError } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
    
    if (verifyError) {
      console.error('❌ Error verifying deletion:', verifyError.message)
      return
    }
    
    console.log(`✅ Successfully deleted all trades!`)
    console.log(`📊 Remaining trades: ${newCount}`)
    
    if (newCount === 0) {
      console.log('🎉 Database is now completely empty!')
      console.log('')
      console.log('💡 Your app should now show:')
      console.log('   - Empty dashboard')
      console.log('   - No trades in the table')
      console.log('   - Fresh start for new data')
    } else {
      console.log('⚠️  Some trades may still remain.')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

// Run the deletion
clearAllTrades()
