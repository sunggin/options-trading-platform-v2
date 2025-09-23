// Clear all trades from the database
// Run with: node scripts/clear-all-data.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function clearAllData() {
  console.log('🗑️  Starting to clear all trades from database...')
  
  try {
    // First, let's see how many trades we have
    const { count, error: countError } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Error counting trades:', countError)
      return
    }
    
    console.log(`📊 Found ${count} trades to delete`)
    
    if (count === 0) {
      console.log('✅ Database is already empty')
      return
    }
    
    // Delete all trades
    const { error } = await supabase
      .from('trades')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows
    
    if (error) {
      console.error('❌ Error deleting trades:', error)
      return
    }
    
    console.log('✅ Successfully cleared all trades from database')
    
    // Verify deletion
    const { count: newCount, error: verifyError } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
    
    if (verifyError) {
      console.error('❌ Error verifying deletion:', verifyError)
      return
    }
    
    console.log(`📊 Verification: ${newCount} trades remaining in database`)
    
    if (newCount === 0) {
      console.log('🎉 Database successfully cleared!')
      console.log('💡 You can now add new trades using the Options form')
    } else {
      console.log('⚠️  Some trades may still remain in the database')
    }
    
  } catch (error) {
    console.error('💥 Fatal error during deletion:', error)
  }
}

// Run the clear function
clearAllData()
