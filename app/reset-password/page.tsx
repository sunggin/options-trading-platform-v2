'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsValidSession(true)
      } else {
        setError('Invalid or expired reset link. Please request a new password reset.')
      }
    }
    
    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-racing-50 to-racing-100">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-racing-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-racing-800 mb-2">
              Password Updated Successfully!
            </h2>
            <p className="text-racing-600">
              Your password has been updated. You will be redirected to the dashboard shortly.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-racing-50 to-racing-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-racing-800">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-racing-600">
            Enter your new password below
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-racing-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-racing-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none relative block w-full px-10 py-3 border border-racing-300 placeholder-racing-500 text-racing-900 rounded-md focus:outline-none focus:ring-racing-500 focus:border-racing-500 focus:z-10 sm:text-sm"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-racing-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-racing-400" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-racing-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-racing-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="appearance-none relative block w-full px-10 py-3 border border-racing-300 placeholder-racing-500 text-racing-900 rounded-md focus:outline-none focus:ring-racing-500 focus:border-racing-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-racing-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-racing-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !isValidSession}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-racing-600 hover:bg-racing-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-racing-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-racing-600 hover:text-racing-500 text-sm"
            >
              Back to Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
