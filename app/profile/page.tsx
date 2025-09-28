'use client'

import { useAuth } from '@/contexts/AuthContext'
import { User, Copy, Check, Mail, Calendar, Shield, Lock, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import SimpleAccountManager from '@/components/SimpleAccountManager'

export default function ProfilePage() {
  const { user, profile, signOut, updatePassword } = useAuth()
  const [copied, setCopied] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))
    setPasswordError('')
    setPasswordSuccess('')
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    // Validation
    if (!passwordData.currentPassword) {
      setPasswordError('Current password is required')
      return
    }

    if (!passwordData.newPassword) {
      setPasswordError('New password is required')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    const passwordValidation = validatePassword(passwordData.newPassword)
    if (passwordValidation) {
      setPasswordError(passwordValidation)
      return
    }

    setIsUpdatingPassword(true)

    try {
      const result = await updatePassword(passwordData.newPassword)
      
      if (result.success) {
        setPasswordSuccess('Password updated successfully!')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setShowPasswordForm(false)
      } else {
        setPasswordError(result.error?.message || 'Failed to update password')
      }
    } catch (error) {
      setPasswordError('An unexpected error occurred')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const resetPasswordForm = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setPasswordError('')
    setPasswordSuccess('')
    setShowPasswordForm(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-racing-50 to-racing-100">
        <div className="text-center">
          <Shield className="w-16 h-16 text-racing-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-racing-800 mb-2">
            Authentication Required
          </h2>
          <p className="text-racing-600">
            Please log in to view your profile.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-racing-50 to-racing-100 py-6">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-racing-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-racing-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-racing-800">Profile</h1>
              <p className="text-racing-600 text-sm">Manage your account information</p>
            </div>
          </div>

          {/* User Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* User ID Card */}
            <div className="bg-gradient-to-r from-racing-50 to-racing-100 rounded-lg p-4 border border-racing-200">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-racing-600" />
                <h3 className="text-lg font-semibold text-racing-800">User ID</h3>
              </div>
              <div className="bg-white rounded-md p-3 border border-racing-200">
                <code className="text-sm text-racing-700 break-all">
                  {user.id}
                </code>
              </div>
              <button
                onClick={() => copyToClipboard(user.id)}
                className="mt-3 flex items-center gap-2 text-sm text-racing-600 hover:text-racing-800 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy User ID
                  </>
                )}
              </button>
              <p className="text-xs text-racing-500 mt-2">
                This is your unique identifier. Use this for CSV uploads or support.
              </p>
            </div>

            {/* Email Card */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-800">Email</h3>
              </div>
              <div className="bg-white rounded-md p-3 border border-blue-200">
                <span className="text-sm text-blue-700">
                  {user.email}
                </span>
              </div>
              <p className="text-xs text-blue-500 mt-2">
                Your login email address
              </p>
            </div>

            {/* Account Created Card */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">Member Since</h3>
              </div>
              <div className="bg-white rounded-md p-3 border border-green-200">
                <span className="text-sm text-green-700">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <p className="text-xs text-green-500 mt-2">
                Account creation date
              </p>
            </div>

          </div>

          {/* Account Statistics */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-racing-600">
                  {user.email_confirmed_at ? '✓' : '○'}
                </div>
                <div className="text-sm text-gray-600">Email Verified</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-racing-600">
                  {profile?.username || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Username</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-racing-600">
                  {user.last_sign_in_at ? 
                    new Date(user.last_sign_in_at).toLocaleDateString() : 
                    'N/A'
                  }
                </div>
                <div className="text-sm text-gray-600">Last Sign In</div>
              </div>
            </div>
          </div>

          {/* Password Update Section */}
          <div className="bg-white rounded-lg p-6 mb-8 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-800">Password & Security</h3>
              </div>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="bg-racing-600 hover:bg-racing-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {showPasswordForm ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {showPasswordForm && (
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-racing-500 focus:border-racing-500 pr-10"
                      placeholder="Enter your current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-racing-500 focus:border-racing-500 pr-10"
                      placeholder="Enter your new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 8 characters with uppercase, lowercase, and number
                  </p>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-racing-500 focus:border-racing-500 pr-10"
                      placeholder="Confirm your new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error/Success Messages */}
                {passwordError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{passwordError}</p>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-600">{passwordSuccess}</p>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="flex-1 bg-racing-600 hover:bg-racing-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={resetPasswordForm}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Trading Accounts Management */}
          <SimpleAccountManager />

          {/* Data Isolation Verification */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">Data Privacy & Security</h3>
            </div>
            <div className="space-y-3 text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>✅ Your trades are completely private to your account</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>✅ Your saved account names are private to your account</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>✅ Dashboard statistics show only your data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>✅ Row Level Security prevents cross-user access</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>✅ All users have identical functionality with private data</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={async () => {
                try {
                  console.log('Profile: Starting sign out process...')
                  const result = await signOut()
                  if (result.error) {
                    console.error('Profile: Sign out error:', result.error)
                    alert(`Failed to sign out: ${result.error.message || 'Unknown error'}`)
                  } else {
                    console.log('Profile: Sign out successful')
                  }
                } catch (error) {
                  console.error('Profile: Sign out failed:', error)
                  alert(`Failed to sign out: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Sign Out
            </button>
            <button
              onClick={() => window.history.back()}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
