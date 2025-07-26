import { Navbar } from './navbar'
import { ProtectedRoute } from '@/components/auth/protected-route'

interface MainLayoutProps {
  children: React.ReactNode
  requireEntity?: boolean
}

export function MainLayout({ children, requireEntity = true }: MainLayoutProps) {
  return (
    <ProtectedRoute requireEntity={requireEntity}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
} 