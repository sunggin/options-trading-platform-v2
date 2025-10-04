// Diagnostic script to identify loading issues
// Run this in your browser console to diagnose the problem

console.log('🔍 DIAGNOSTIC: Starting loading issue diagnosis...')

// Check 1: Supabase Configuration
console.log('\n1. Checking Supabase Configuration:')
try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not found'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Found' : 'Not found'
  
  console.log('   Supabase URL:', supabaseUrl)
  console.log('   Supabase Key:', supabaseKey)
  
  if (supabaseUrl === 'Not found' || supabaseKey === 'Not found') {
    console.error('   ❌ Supabase not properly configured!')
  } else {
    console.log('   ✅ Supabase configuration looks good')
  }
} catch (error) {
  console.error('   ❌ Error checking Supabase config:', error)
}

// Check 2: Browser Storage
console.log('\n2. Checking Browser Storage:')
try {
  const localStorageKeys = Object.keys(localStorage)
  const sessionStorageKeys = Object.keys(sessionStorage)
  
  console.log('   localStorage items:', localStorageKeys.length)
  console.log('   sessionStorage items:', sessionStorageKeys.length)
  
  // Check for auth-related items
  const authItems = localStorageKeys.filter(key => 
    key.includes('supabase') || key.includes('auth') || key.includes('user')
  )
  
  console.log('   Auth-related items:', authItems)
  
  if (authItems.length === 0) {
    console.log('   ℹ️  No auth data in localStorage (this is normal for new users)')
  } else {
    console.log('   ℹ️  Found auth data in localStorage')
  }
} catch (error) {
  console.error('   ❌ Error checking storage:', error)
}

// Check 3: Network Connectivity
console.log('\n3. Checking Network Connectivity:')
try {
  fetch('https://api.github.com', { method: 'HEAD' })
    .then(() => {
      console.log('   ✅ Internet connection is working')
    })
    .catch((error) => {
      console.error('   ❌ Network connectivity issue:', error)
    })
} catch (error) {
  console.error('   ❌ Error testing network:', error)
}

// Check 4: Supabase Connection Test
console.log('\n4. Testing Supabase Connection:')
try {
  // This will only work if Supabase is properly configured
  if (typeof window !== 'undefined' && window.supabase) {
    window.supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error('   ❌ Supabase auth error:', error)
        } else {
          console.log('   ✅ Supabase connection working')
          console.log('   Session:', data.session ? 'Found' : 'None')
        }
      })
      .catch((error) => {
        console.error('   ❌ Supabase connection failed:', error)
      })
  } else {
    console.log('   ℹ️  Supabase client not available in window object')
  }
} catch (error) {
  console.error('   ❌ Error testing Supabase:', error)
}

// Check 5: React Components State
console.log('\n5. Checking React Component States:')
try {
  // Check if React DevTools are available
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('   ✅ React DevTools detected')
    console.log('   ℹ️  Use React DevTools to inspect component states')
  } else {
    console.log('   ℹ️  React DevTools not detected')
  }
} catch (error) {
  console.log('   ℹ️  Cannot check React state')
}

// Check 6: Console Errors
console.log('\n6. Checking for Console Errors:')
try {
  // Override console.error to track errors
  const originalError = console.error
  const errors = []
  
  console.error = function(...args) {
    errors.push(args)
    originalError.apply(console, args)
  }
  
  setTimeout(() => {
    console.error = originalError
    if (errors.length > 0) {
      console.log('   ❌ Found', errors.length, 'errors:')
      errors.forEach((error, index) => {
        console.log(`   Error ${index + 1}:`, error)
      })
    } else {
      console.log('   ✅ No errors detected')
    }
  }, 2000)
} catch (error) {
  console.log('   ℹ️  Cannot track console errors')
}

// Check 7: Performance
console.log('\n7. Checking Performance:')
try {
  const perfData = performance.getEntriesByType('navigation')[0]
  if (perfData) {
    console.log('   Page load time:', Math.round(perfData.loadEventEnd - perfData.loadEventStart), 'ms')
    console.log('   DOM ready time:', Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart), 'ms')
  }
} catch (error) {
  console.log('   ℹ️  Cannot get performance data')
}

// Summary and Recommendations
console.log('\n🎯 DIAGNOSTIC SUMMARY:')
console.log('If you see ❌ errors above, those are likely causing the loading issues.')
console.log('\n📋 RECOMMENDED FIXES:')
console.log('1. If Supabase config is missing: Check your .env.local file')
console.log('2. If network issues: Check your internet connection')
console.log('3. If auth errors: Try signing out and back in')
console.log('4. If React errors: Check the component code for issues')
console.log('5. If all else fails: Clear browser data and restart the app')

console.log('\n🔧 QUICK FIXES TO TRY:')
console.log('1. Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)')
console.log('2. Clear browser cache and localStorage')
console.log('3. Try in incognito/private mode')
console.log('4. Restart your development server')
console.log('5. Check browser console for any red error messages')

console.log('\n✅ Diagnosis complete! Check the results above.')
