// Script to get current user information for debugging
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('👤 GETTING USER INFORMATION')
console.log('============================')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function getUserInfo() {
  try {
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message)
      return
    }
    
    if (!session) {
      console.log('ℹ️  No active session found')
      console.log('💡 You need to be logged in to get user information')
      return
    }
    
    console.log('✅ Active session found!')
    console.log(`📧 Email: ${session.user.email}`)
    console.log(`🆔 User ID: ${session.user.id}`)
    console.log(`📅 Created: ${new Date(session.user.created_at).toLocaleString()}`)
    console.log(`🔐 Email confirmed: ${session.user.email_confirmed_at ? 'Yes' : 'No'}`)
    
    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (profileError) {
      console.log('⚠️  No profile found or error:', profileError.message)
    } else {
      console.log('📋 Profile information:')
      console.log(`   Username: ${profile.username || 'Not set'}`)
      console.log(`   Start trading date: ${profile.start_trading_date || 'Not set'}`)
    }
    
    // Check trades count
    const { count, error: tradesError } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
    
    if (tradesError) {
      console.log('⚠️  Error checking trades:', tradesError.message)
    } else {
      console.log(`📊 Trades count: ${count}`)
    }
    
    console.log('\n💡 To clear all trades for this user, run:')
    console.log(`node clear-user-trades.js ${session.user.id}`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

getUserInfo()
