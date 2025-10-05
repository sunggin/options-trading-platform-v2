'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any; success: boolean }>
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
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  // Simplified sign up function - no profile creation needed
  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) return { error }

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
    }, 3000) // 3 second maximum timeout

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log('AuthContext: Auth state change:', event, session?.user?.email)
      
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        setSession(session)
      } else {
        setUser(null)
        setSession(null)
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
    loading: loading && !authChecked, // Only show loading if we haven't checked auth yet
    signUp,
    signIn,
    signOut,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
