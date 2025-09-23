'use client'

import Analysis from '@/components/Analysis'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AnalysisPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-full mx-auto px-2 sm:px-4 py-8">
          <Analysis />
        </div>
      </div>
    </ProtectedRoute>
  )
}
