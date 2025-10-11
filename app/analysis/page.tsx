'use client'

import Analysis from '@/components/Analysis'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AnalysisPage() {
  return (
    <ProtectedRoute>
      <div className="max-w-full mx-auto">
        <Analysis />
      </div>
    </ProtectedRoute>
  )
}
