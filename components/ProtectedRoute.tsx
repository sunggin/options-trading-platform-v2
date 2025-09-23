'use client'

import { useAuth } from '@/contexts/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'
import AuthForm from './AuthForm'
import { Loader2, AlertTriangle } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const supabaseConfigured = isSupabaseConfigured()

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-racing-50 to-racing-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-racing-600 mx-auto mb-4" />
          <p className="text-racing-700">
            Loading...
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