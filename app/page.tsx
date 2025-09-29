'use client'

import { useState, useEffect } from 'react'
import TradeForm from '@/components/TradeForm'
import TradesTable from '@/components/TradesTable'
import Dashboard from '@/components/Dashboard'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleTradeAdded = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Expose refresh function globally for TradesTable to use
  useEffect(() => {
    (window as any).refreshDashboard = handleTradeAdded
    return () => {
      delete (window as any).refreshDashboard
    }
  }, [])

  return (
    <ProtectedRoute>
      <main className="space-y-2">
        <Dashboard refreshTrigger={refreshTrigger} />
        <TradeForm onTradeAdded={handleTradeAdded} />
        <TradesTable refreshTrigger={refreshTrigger} />
      </main>
    </ProtectedRoute>
  )
}
