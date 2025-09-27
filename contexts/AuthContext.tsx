'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface UserProfile {
  id: string
  username: string
  start_trading_date: string | null
  created_at: string
  updated_at: string
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabaseConfigured, setSupabaseConfigured] = useState(false)

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

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 2000) // 2 second timeout
    
    // Check if Supabase is available
    if (!supabase) {
      console.warn('Supabase not configured, skipping auth initialization')
      clearTimeout(timeout)
      setLoading(false)
      return
    }
    
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }: any) => {
      clearTimeout(timeout)
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id)
        setProfile(userProfile)
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    }).catch((error: any) => {
      console.error('AuthContext: Error getting session:', error)
      clearTimeout(timeout)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      clearTimeout(timeout)
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id)
        setProfile(userProfile)
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, username: string, startTradingDate?: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } }
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          start_trading_date: startTradingDate || ''
        }
      }
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } }
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } }
    }
    const { error } = await supabase.auth.signOut()
    setProfile(null)
    return { error }
  }

  const resetPassword = async (email: string) => {
    try {
      console.log('Attempting to send password reset email to:', email)
      console.log('Redirect URL:', `${window.location.origin}/reset-password`)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) {
        console.error('Password reset error:', error)
        return { error, success: false }
      }
      
      console.log('Password reset email sent successfully')
      return { error: null, success: true }
    } catch (error) {
      console.error('Password reset catch error:', error)
      return { error, success: false }
    }
  }

  const updateUsername = async (username: string) => {
    try {
      const { data, error } = await supabase.rpc('update_username', {
        new_username: username
      })

      if (error) {
        return { error, success: false }
      }

      if (data) {
        // Refresh the profile
        if (user) {
          const updatedProfile = await fetchUserProfile(user.id)
          setProfile(updatedProfile)
        }
        return { error: null, success: true }
      } else {
        return { error: { message: 'Username already taken' }, success: false }
      }
    } catch (error) {
      return { error, success: false }
    }
  }

  const updateStartTradingDate = async (date: string) => {
    try {
      const { data, error } = await supabase.rpc('update_start_trading_date', {
        new_date: date
      })

      if (error) {
        return { error, success: false }
      }

      if (data) {
        // Refresh the profile
        if (user) {
          const updatedProfile = await fetchUserProfile(user.id)
          setProfile(updatedProfile)
        }
        return { error: null, success: true }
      } else {
        return { error: { message: 'Failed to update start trading date' }, success: false }
      }
    } catch (error) {
      return { error, success: false }
    }
  }

  const updatePassword = async (newPassword: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' }, success: false }
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        return { error, success: false }
      }

      return { error: null, success: true }
    } catch (error) {
      return { error, success: false }
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateUsername,
    updateStartTradingDate,
    updatePassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
