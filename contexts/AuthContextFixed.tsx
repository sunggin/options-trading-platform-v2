'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email?: string
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
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
