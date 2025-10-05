'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email?: string
  username?: string
  start_trading_date?: string
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  signUp: (email: string, password: string, username: string, startTradingDate?: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any; success: boolean }>
  updateUsername: (username: string) => Promise<{ error: any; success: boolean }>
  updateStartTradingDate: (date: string) => Promise<{ error: any; success: boolean }>
  updatePassword: (newPassword: string) => Promise<{ error: any; success: boolean }>
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

  // Sign up function
  const signUp = async (email: string, password: string, username: string, startTradingDate?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) return { error }

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            username: username,
            start_trading_date: startTradingDate || null
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
          return { error: profileError }
        }
      }

      return { error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      return { error }
    }
  }

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      console.error('Sign in error:', error)
      return { error }
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error }
    }
  }

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      return { error, success: !error }
    } catch (error) {
      console.error('Reset password error:', error)
      return { error, success: false }
    }
  }

  // Update username function
  const updateUsername = async (username: string) => {
    if (!user) {
      return { error: 'User not authenticated', success: false }
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating username:', error)
        return { error, success: false }
      }

      // Update local profile state
      setProfile(prev => prev ? { ...prev, username } : null)
      return { error: null, success: true }
    } catch (error) {
      console.error('Error updating username:', error)
      return { error, success: false }
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
      return { success: true, error: null }
    } catch (error) {
      console.error('Error updating start trading date:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Update password function
  const updatePassword = async (newPassword: string) => {
    if (!user) {
      return { error: 'User not authenticated', success: false }
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        console.error('Error updating password:', error)
        return { error, success: false }
      }

      return { error: null, success: true }
    } catch (error) {
      console.error('Error updating password:', error)
      return { error, success: false }
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
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateUsername,
    updateStartTradingDate,
    updatePassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
