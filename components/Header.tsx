'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { LogOut, User } from 'lucide-react'


export default function Header() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      console.log('Header: Starting sign out process...')
      const result = await signOut()
      if (result.error) {
        console.error('Header: Sign out error:', result.error)
        alert(`Failed to sign out: ${result.error.message || 'Unknown error'}`)
      } else {
        console.log('Header: Sign out successful')
      }
    } catch (error) {
      console.error('Header: Sign out failed:', error)
      alert(`Failed to sign out: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <header className="mb-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Options Trading Platform
            </h1>
            <p className="text-base text-gray-600">
              Buy the dip fagg*t - Warren Buffet
            </p>
          </div>
          
          <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2 text-base text-gray-600">
              <User className="w-4 h-4" />
              <span>{user.email?.split('@')[0] || 'User'}</span>
            </div>
          )}
          
          <nav className="flex gap-3">
            <Link 
              href="/"
              className="text-base text-gray-600 hover:text-gray-800 transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/watchlist"
              className="text-base text-gray-600 hover:text-gray-800 transition-colors"
            >
              Watch List
            </Link>
            <Link 
              href="/analysis"
              className="text-base text-gray-600 hover:text-gray-800 transition-colors"
            >
              Analysis
            </Link>
            <Link 
              href="/social"
              className="text-base text-gray-600 hover:text-gray-800 transition-colors"
            >
              Social
            </Link>
            <Link 
              href="/profile"
              className="text-base text-gray-600 hover:text-gray-800 transition-colors"
            >
              Profile
            </Link>
          </nav>
          
          {user && (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 text-base text-gray-600 hover:text-gray-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          )}
          </div>
        </div>
      </div>
    </header>
  )
}
