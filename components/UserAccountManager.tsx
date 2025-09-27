'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Plus, Trash2, Edit3, Save, X } from 'lucide-react'

interface UserAccount {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

export default function UserAccountManager() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<UserAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<string | null>(null)
  const [newAccount, setNewAccount] = useState({
    name: ''
  })

  useEffect(() => {
    if (user) {
      fetchUserAccounts()
    }
  }, [user])

  const fetchUserAccounts = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching user accounts:', error)
        return
      }

      setAccounts(data || [])
    } catch (error) {
      console.error('Error fetching user accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const addAccount = async () => {
    if (!user || !newAccount.name.trim()) return

    try {
      const { data, error } = await supabase
        .from('user_accounts')
        .insert([{
          user_id: user.id,
          name: newAccount.name.trim()
        }])
        .select()

      if (error) {
        console.error('Error adding account:', error)
        alert('Failed to add account. Please try again.')
        return
      }

      setAccounts(prev => [...prev, ...data])
      setNewAccount({ name: '' })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding account:', error)
      alert('Failed to add account. Please try again.')
    }
  }

  const updateAccount = async (accountId: string, updates: Partial<UserAccount>) => {
    try {
      const { data, error } = await supabase
        .from('user_accounts')
        .update(updates)
        .eq('id', accountId)
        .select()

      if (error) {
        console.error('Error updating account:', error)
        alert('Failed to update account. Please try again.')
        return
      }

      setAccounts(prev => 
        prev.map(account => 
          account.id === accountId ? { ...account, ...updates } : account
        )
      )
      setEditingAccount(null)
    } catch (error) {
      console.error('Error updating account:', error)
      alert('Failed to update account. Please try again.')
    }
  }

  const deleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return

    try {
      const { error } = await supabase
        .from('user_accounts')
        .delete()
        .eq('id', accountId)

      if (error) {
        console.error('Error deleting account:', error)
        alert('Failed to delete account. Please try again.')
        return
      }

      setAccounts(prev => prev.filter(account => account.id !== accountId))
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-racing-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">My Accounts</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-racing-600 hover:bg-racing-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {/* Add Account Form */}
      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4 border">
          <h4 className="font-medium text-gray-800 mb-3">Add New Account</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Name
            </label>
            <input
              type="text"
              value={newAccount.name}
              onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Main Trading Account, Roth IRA, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-racing-500 focus:border-racing-500"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={addAccount}
              disabled={!newAccount.name.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              Save Account
            </button>
            <button
              onClick={() => {
                setShowAddForm(false)
                setNewAccount({ name: '' })
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Accounts List */}
      <div className="space-y-2">
        {accounts.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p>No accounts yet. Add your first account to get started!</p>
          </div>
        ) : (
          accounts.map((account) => (
            <div
              key={account.id}
              className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between"
            >
              {editingAccount === account.id ? (
                <div className="flex-1">
                  <input
                    type="text"
                    defaultValue={account.name}
                    onBlur={(e) => {
                      if (e.target.value.trim() && e.target.value !== account.name) {
                        updateAccount(account.id, { name: e.target.value.trim() })
                      } else {
                        setEditingAccount(null)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (e.currentTarget.value.trim() && e.currentTarget.value !== account.name) {
                          updateAccount(account.id, { name: e.currentTarget.value.trim() })
                        } else {
                          setEditingAccount(null)
                        }
                      } else if (e.key === 'Escape') {
                        setEditingAccount(null)
                      }
                    }}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-racing-500 focus:border-racing-500"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="flex-1">
                  <span className="font-medium text-gray-800">{account.name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                {editingAccount === account.id ? (
                  <button
                    onClick={() => setEditingAccount(null)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setEditingAccount(account.id)}
                      className="p-1 text-gray-500 hover:text-blue-600"
                      title="Edit account"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteAccount(account.id)}
                      className="p-1 text-gray-500 hover:text-red-600"
                      title="Delete account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
