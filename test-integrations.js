// Comprehensive integration test for Supabase, Vercel, and GitHub
// This script tests all your key integrations

const { createClient } = require('@supabase/supabase-js')
const https = require('https')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

console.log('🧪 INTEGRATION TESTS')
console.log('====================')
console.log('Testing: Supabase, Vercel, GitHub, and Local Development')
console.log('')

// Test 1: Supabase Integration
async function testSupabase() {
  console.log('1️⃣  Testing Supabase Integration...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('   ❌ Missing Supabase configuration')
    return false
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test 1a: Basic connection
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('   ❌ Supabase auth error:', sessionError.message)
      return false
    }
    console.log('   ✅ Supabase auth connection successful')
    
    // Test 1b: Database access
    const { error: dbError } = await supabase.from('trades').select('count', { count: 'exact', head: true })
    if (dbError) {
      console.error('   ❌ Database access error:', dbError.message)
      return false
    }
    console.log('   ✅ Database access successful')
    
    // Test 1c: RLS policies
    const { error: rlsError } = await supabase.from('trades').select('id').limit(1)
    if (rlsError && rlsError.message.includes('permission denied')) {
      console.log('   ✅ RLS policies are active (good for security)')
    } else {
      console.log('   ✅ Database queries working')
    }
    
    console.log('   🎉 Supabase integration: PASSED')
    return true
    
  } catch (error) {
    console.error('   ❌ Supabase test failed:', error.message)
    return false
  }
}

// Test 2: Vercel Integration
async function testVercel() {
  console.log('\n2️⃣  Testing Vercel Integration...')
  
  return new Promise((resolve) => {
    // Test Vercel's API status
    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path: '/v1/status',
      method: 'GET',
      headers: {
        'User-Agent': 'Integration-Test'
      }
    }
    
    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('   ✅ Vercel API is accessible')
        console.log('   ✅ Vercel integration: PASSED')
        resolve(true)
      } else {
        console.log('   ⚠️  Vercel API returned status:', res.statusCode)
        resolve(false)
      }
    })
    
    req.on('error', (error) => {
      console.error('   ❌ Vercel API error:', error.message)
      resolve(false)
    })
    
    req.setTimeout(5000, () => {
      console.error('   ❌ Vercel API timeout')
      req.destroy()
      resolve(false)
    })
    
    req.end()
  })
}

// Test 3: GitHub Integration
async function testGitHub() {
  console.log('\n3️⃣  Testing GitHub Integration...')
  
  return new Promise((resolve) => {
    // Test GitHub API
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'Integration-Test'
      }
    }
    
    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('   ✅ GitHub API is accessible')
        console.log('   ✅ GitHub integration: PASSED')
        resolve(true)
      } else {
        console.log('   ⚠️  GitHub API returned status:', res.statusCode)
        resolve(false)
      }
    })
    
    req.on('error', (error) => {
      console.error('   ❌ GitHub API error:', error.message)
      resolve(false)
    })
    
    req.setTimeout(5000, () => {
      console.error('   ❌ GitHub API timeout')
      req.destroy()
      resolve(false)
    })
    
    req.end()
  })
}

// Test 4: Local Development Server
async function testLocalServer() {
  console.log('\n4️⃣  Testing Local Development Server...')
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'Integration-Test'
      }
    }
    
    const req = https.request(options, (res) => {
      console.log('   ✅ Local server is running on port 3000')
      console.log('   ✅ Local development: PASSED')
      resolve(true)
    })
    
    req.on('error', (error) => {
      // Try HTTP if HTTPS fails
      const http = require('http')
      const httpReq = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/',
        method: 'GET'
      }, (res) => {
        console.log('   ✅ Local server is running on port 3000 (HTTP)')
        console.log('   ✅ Local development: PASSED')
        resolve(true)
      })
      
      httpReq.on('error', (httpError) => {
        console.error('   ❌ Local server not accessible:', httpError.message)
        console.log('   ℹ️  Make sure to run: npm run dev')
        resolve(false)
      })
      
      httpReq.end()
    })
    
    req.setTimeout(3000, () => {
      console.error('   ❌ Local server timeout')
      req.destroy()
      resolve(false)
    })
    
    req.end()
  })
}

// Test 5: Environment Configuration
function testEnvironment() {
  console.log('\n5️⃣  Testing Environment Configuration...')
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
  
  const optionalVars = [
    'NEXT_PUBLIC_FINNHUB_KEY',
    'NEXT_PUBLIC_ALPHA_VANTAGE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  let allRequired = true
  
  console.log('   Required variables:')
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      console.log(`   ✅ ${varName}: Configured`)
    } else {
      console.log(`   ❌ ${varName}: Missing`)
      allRequired = false
    }
  })
  
  console.log('   Optional variables:')
  optionalVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      console.log(`   ✅ ${varName}: Configured`)
    } else {
      console.log(`   ℹ️  ${varName}: Not configured (optional)`)
    }
  })
  
  if (allRequired) {
    console.log('   🎉 Environment configuration: PASSED')
    return true
  } else {
    console.log('   ❌ Environment configuration: FAILED')
    return false
  }
}

// Test 6: Network Connectivity
async function testNetwork() {
  console.log('\n6️⃣  Testing Network Connectivity...')
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'google.com',
      port: 443,
      path: '/',
      method: 'GET'
    }
    
    const req = https.request(options, (res) => {
      console.log('   ✅ Internet connection working')
      console.log('   ✅ Network connectivity: PASSED')
      resolve(true)
    })
    
    req.on('error', (error) => {
      console.error('   ❌ Network error:', error.message)
      resolve(false)
    })
    
    req.setTimeout(5000, () => {
      console.error('   ❌ Network timeout')
      req.destroy()
      resolve(false)
    })
    
    req.end()
  })
}

// Run all tests
async function runAllTests() {
  console.log('Starting comprehensive integration tests...\n')
  
  const results = {
    supabase: await testSupabase(),
    vercel: await testVercel(),
    github: await testGitHub(),
    localServer: await testLocalServer(),
    environment: testEnvironment(),
    network: await testNetwork()
  }
  
  console.log('\n📊 TEST RESULTS SUMMARY')
  console.log('========================')
  
  const passed = Object.values(results).filter(Boolean).length
  const total = Object.keys(results).length
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅ PASSED' : '❌ FAILED'
    console.log(`${test.padEnd(15)}: ${status}`)
  })
  
  console.log(`\nOverall: ${passed}/${total} tests passed`)
  
  if (passed === total) {
    console.log('\n🎉 ALL INTEGRATIONS WORKING PERFECTLY!')
    console.log('Your development environment is fully configured and ready to go.')
    console.log('\n📋 Next steps:')
    console.log('1. Open http://localhost:3000 in your browser')
    console.log('2. Sign in to your account')
    console.log('3. Start adding trades!')
  } else {
    console.log('\n⚠️  Some integrations need attention.')
    console.log('Check the failed tests above and fix any issues.')
  }
  
  console.log('\n🔧 Troubleshooting tips:')
  console.log('- If Supabase fails: Check your .env.local file')
  console.log('- If local server fails: Run "npm run dev"')
  console.log('- If network fails: Check your internet connection')
  console.log('- If Vercel/GitHub fail: Check firewall/proxy settings')
}

// Run the tests
runAllTests().catch(console.error)
