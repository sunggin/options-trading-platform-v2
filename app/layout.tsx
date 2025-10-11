import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import { AuthProvider } from '@/contexts/AuthContext'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Options Trading Platform',
  description: 'Track your stock and options trades with real-time calculations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <AuthProvider>
          <div className="container mx-auto px-4 py-6">
            <Header />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
