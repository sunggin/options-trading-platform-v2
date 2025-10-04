# Fix Loading Issues - Dashboard and Trades

## 🚨 **Problem Identified**

Your dashboard and trades are stuck in infinite loading. This is likely caused by:

1. **Authentication timeout issues**
2. **Database connection problems**
3. **Supabase configuration issues**
4. **Missing user data or permissions**

## 🔧 **Quick Fixes to Try**

### **Fix 1: Clear Browser Cache and Data**

1. **Hard refresh** your browser: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear application data**:
   - Open Developer Tools (`F12`)
   - Go to Application tab
   - Clear Storage → Clear All
   - Refresh the page

### **Fix 2: Check Browser Console**

1. Open Developer Tools (`F12`)
2. Go to Console tab
3. Look for error messages
4. Share any red error messages you see

### **Fix 3: Test Authentication**

Try signing out and signing back in:
1. Click your email in the top right
2. Click "Sign Out"
3. Sign back in with your credentials

## 🛠️ **Advanced Fixes**

### **Fix 4: Update AuthContext with Better Error Handling**

Replace your `contexts/AuthContext.tsx` with this improved version:

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  start_trading_date?: string
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  updateStartTradingDate: (date: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  // Function to fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  // Function to create user profile if it doesn't exist
  const createUserProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          start_trading_date: null
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error creating profile:', error)
      return null
    }
  }

  // Update start trading date
  const updateStartTradingDate = async (date: string) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ start_trading_date: date })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating start trading date:', error)
        return { success: false, error: error.message }
      }

      // Update local profile state
      setProfile(prev => prev ? { ...prev, start_trading_date: date } : null)
      return { success: true }
    } catch (error) {
      console.error('Error updating start trading date:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('AuthContext: Starting auth initialization')
        
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          if (mounted) {
            setLoading(false)
            setAuthChecked(true)
          }
          return
        }

        if (initialSession?.user) {
          console.log('AuthContext: Found existing session for user:', initialSession.user.email)
          
          if (mounted) {
            setUser(initialSession.user)
            setSession(initialSession)
          }

          // Fetch or create profile
          let userProfile = await fetchUserProfile(initialSession.user.id)
          
          if (!userProfile) {
            console.log('AuthContext: Creating new profile for user')
            userProfile = await createUserProfile(initialSession.user.id, initialSession.user.email || '')
          }

          if (mounted) {
            setProfile(userProfile)
          }
        }

        if (mounted) {
          setLoading(false)
          setAuthChecked(true)
        }

      } catch (error) {
        console.error('AuthContext: Error during initialization:', error)
        if (mounted) {
          setLoading(false)
          setAuthChecked(true)
        }
      }
    }

    // Set a maximum timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('AuthContext: Maximum timeout reached, forcing loading to false')
      if (mounted) {
        setLoading(false)
        setAuthChecked(true)
      }
    }, 10000) // 10 second maximum timeout

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state change:', event, session?.user?.email)
      
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        setSession(session)

        // Fetch profile for new session
        const userProfile = await fetchUserProfile(session.user.id)
        setProfile(userProfile)
      } else {
        setUser(null)
        setSession(null)
        setProfile(null)
      }

      setLoading(false)
      setAuthChecked(true)
    })

    return () => {
      mounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    session,
    profile,
    loading: loading && !authChecked, // Only show loading if we haven't checked auth yet
    updateStartTradingDate
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
```

### **Fix 5: Update ProtectedRoute with Better Error Handling**

Replace your `components/ProtectedRoute.tsx` with this improved version:

```typescript
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'
import AuthForm from './AuthForm'
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const supabaseConfigured = isSupabaseConfigured()
  const [forceLoading, setForceLoading] = useState(true)
  const [showRetry, setShowRetry] = useState(false)

  // Add a safety timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('ProtectedRoute: Safety timeout reached')
      setForceLoading(false)
      
      // Show retry option if still loading after timeout
      if (loading) {
        setShowRetry(true)
      }
    }, 8000) // 8 second timeout

    return () => clearTimeout(timeout)
  }, [loading])

  // Reset retry state when loading changes
  useEffect(() => {
    if (!loading) {
      setShowRetry(false)
    }
  }, [loading])

  // Override loading if it's been too long
  const isLoading = loading && forceLoading

  const handleRetry = () => {
    window.location.reload()
  }

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-racing-50 to-racing-100">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-racing-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-racing-800 mb-2">
              Configuration Required
            </h2>
            <p className="text-racing-600 mb-6">
              Please configure your Supabase credentials to use this application.
            </p>
            <div className="bg-racing-50 border border-racing-200 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-racing-800 mb-2">Setup Instructions:</h3>
              <ol className="text-sm text-racing-600 space-y-1">
                <li>1. Get your Supabase credentials from your dashboard</li>
                <li>2. Update the .env.local file with your actual values</li>
                <li>3. Restart the development server</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-racing-50 to-racing-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-racing-600 mx-auto mb-4" />
          <p className="text-racing-700 mb-4">
            Loading...
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-racing-500 space-y-1">
              <p>Debug: loading={loading.toString()}</p>
              <p>forceLoading={forceLoading.toString()}</p>
              <p>supabaseConfigured={supabaseConfigured.toString()}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show retry option if loading failed
  if (showRetry) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-racing-50 to-racing-100">
        <div className="text-center max-w-md p-8">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Loading Timeout
          </h2>
          <p className="text-gray-600 mb-6">
            The application is taking longer than expected to load. This might be due to a slow connection or server issue.
          </p>
          <button
            onClick={handleRetry}
            className="bg-racing-600 hover:bg-racing-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Loading
          </button>
          <p className="text-xs text-gray-500 mt-4">
            If this continues, please check your internet connection and try again.
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return <>{children}</>
}
```

## 🔍 **Debugging Steps**

### **Step 1: Check Browser Console**

1. Open Developer Tools (`F12`)
2. Go to Console tab
3. Look for any error messages
4. Common errors to look for:
   - Supabase connection errors
   - Authentication errors
   - Database permission errors

### **Step 2: Check Network Tab**

1. Open Developer Tools (`F12`)
2. Go to Network tab
3. Refresh the page
4. Look for failed requests (red entries)
5. Check if Supabase requests are completing

### **Step 3: Test Database Connection**

Try this in your browser console:

```javascript
// Test Supabase connection
fetch('/api/test-supabase')
  .then(response => response.json())
  .then(data => console.log('Supabase test:', data))
  .catch(error => console.error('Supabase test error:', error))
```

## 🚨 **Emergency Fix**

If nothing else works, try this emergency reset:

1. **Clear all browser data**:
   - Clear cookies, localStorage, sessionStorage
   - Clear cache and application data

2. **Sign out completely**:
   - Go to your Supabase dashboard
   - Sign out from there too

3. **Restart your development server**:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   npm run dev
   ```

4. **Sign back in** with fresh credentials

## 📞 **Still Having Issues?**

If the loading issues persist after trying these fixes:

1. **Check your Supabase dashboard** - make sure your project is active
2. **Verify your environment variables** in `.env.local`
3. **Check your internet connection**
4. **Try in an incognito/private browser window**

Share any error messages you see in the browser console, and I can help you debug further!
