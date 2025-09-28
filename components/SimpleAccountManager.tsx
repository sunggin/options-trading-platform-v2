'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Plus, Trash2 } from 'lucide-react'

export default function SimpleAccountManager() {
  const { user } = useAuth()
  const [savedAccounts, setSavedAccounts] = useState<string[]>([])
  const [newAccount, setNewAccount] = useState('')

  useEffect(() => {
    loadSavedAccounts()
  }, [user])

  const loadSavedAccounts = () => {
    if (!user?.id) {
      // If no user, try to load from a generic key or show empty
      setSavedAccounts([])
      return
    }
    
    const key = `saved_accounts_${user.id}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        setSavedAccounts(JSON.parse(saved))
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error parsing saved accounts:', error)
        }
        setSavedAccounts([])
      }
    }
  }

  const addAccount = () => {
    if (!user || !newAccount.trim()) return
    
    const trimmedName = newAccount.trim()
    const key = `saved_accounts_${user.id}`
    
    // Add to saved accounts if not already present
    setSavedAccounts(prev => {
      if (!prev.includes(trimmedName)) {
        const updated = [...prev, trimmedName]
        localStorage.setItem(key, JSON.stringify(updated))
        return updated
      }
      return prev
    })
    
    setNewAccount('')
  }

  const removeAccount = (accountName: string) => {
    if (!user) return
    
    const key = `saved_accounts_${user.id}`
    setSavedAccounts(prev => {
      const updated = prev.filter(name => name !== accountName)
      localStorage.setItem(key, JSON.stringify(updated))
      return updated
    })
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <Plus className="w-6 h-6 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Trading Accounts</h3>
        </div>
        
        <div className="text-center py-6 text-gray-500">
          <p>Please sign in to manage your trading accounts.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <Plus className="w-6 h-6 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">Trading Accounts</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Manage your trading account names. These will appear as suggestions when adding trades.
      </p>

      {/* Add New Account */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newAccount}
          onChange={(e) => setNewAccount(e.target.value)}
          placeholder="Enter account name (e.g., Main Trading, Roth IRA)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-racing-500 focus:border-racing-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addAccount()
            }
          }}
        />
        <button
          onClick={addAccount}
          disabled={!newAccount.trim()}
          className="bg-racing-600 hover:bg-racing-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Saved Accounts List */}
      <div className="space-y-2">
        {savedAccounts.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p>No saved accounts yet. Add your first account above!</p>
          </div>
        ) : (
          savedAccounts.map((account) => (
            <div
              key={account}
              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border"
            >
              <span className="text-gray-800 font-medium">{account}</span>
              <button
                onClick={() => removeAccount(account)}
                className="text-red-600 hover:text-red-800 p-1"
                title="Remove account"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
