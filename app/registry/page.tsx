'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Users,
  Shield,
  ArrowRightLeft,
  Building2,
  TrendingUp,
  TrendingDown,
  Repeat,
  Plus
} from 'lucide-react'
import { useEntity } from '@/lib/entity-context'
import { MembersTab } from './members/members-tab'
import { SecuritiesTab } from './securities/securities-tab'
import { TransactionsTab } from './transactions/transactions-tab'

// Sidebar navigation items
const sidebarItems = [
  {
    id: 'issuer',
    label: 'Issuer',
    icon: Building2,
    description: 'Registry dashboard'
  },
  {
    id: 'securities',
    label: 'Securities',
    icon: Shield,
    description: 'Manage security classes'
  },
  {
    id: 'members',
    label: 'Members',
    icon: Users,
    description: 'Manage shareholders'
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: ArrowRightLeft,
    description: 'View all transactions'
  }
]

function RegistryContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { selectedEntity } = useEntity()

  // Get initial section from URL params or default to 'issuer'
  const initialSection = searchParams.get('section') || 'issuer'
  const [activeSection, setActiveSection] = useState(initialSection)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  // Update URL when section changes
  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    const newUrl = section === 'issuer' ? '/registry' : `/registry?section=${section}`
    router.replace(newUrl, { scroll: false })
  }

  // Handle new transaction action
  const handleNewTransaction = () => {
    // Navigate to the new transaction page
    router.push('/registrytransactions/new')
    setHoveredItem(null) // Close sub-menu
  }

  useEffect(() => {
    const section = searchParams.get('section') || 'issuer'
    if (section !== activeSection) {
      setActiveSection(section)
    }
  }, [searchParams, activeSection])

  if (!selectedEntity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registry</CardTitle>
          <CardDescription>
            Manage members, securities, and transactions for your entity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Please select an entity to view the registry.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render the appropriate content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'issuer':
        return <IssuerDashboard />
      case 'securities':
        return <SecuritiesTab />
      case 'members':
        return <MembersTab />
      case 'transactions':
        return <TransactionsTab />
      default:
        return <IssuerDashboard />
    }
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/30 min-h-screen">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Registry</h2>
            <p className="text-sm text-muted-foreground">
              {selectedEntity.name}
            </p>
          </div>

          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isTransactions = item.id === 'transactions'

              return (
                <div key={item.id} className="relative">
                  <Button
                    variant={activeSection === item.id ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-auto py-3 px-3",
                      activeSection === item.id && "bg-secondary"
                    )}
                    onClick={() => handleSectionChange(item.id)}
                    onMouseEnter={() => isTransactions ? setHoveredItem(item.id) : null}
                    onMouseLeave={() => isTransactions ? setHoveredItem(null) : null}
                  >
                    <Icon className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                  </Button>

                  {/* New Transaction Link */}
                  {isTransactions && hoveredItem === 'transactions' && (
                    <div
                      className="absolute left-full top-0 ml-2 bg-background border rounded-md shadow-lg z-50 min-w-[200px]"
                      onMouseEnter={() => setHoveredItem('transactions')}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <div className="p-1">
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-auto py-2 px-3 text-sm"
                          onClick={handleNewTransaction}
                        >
                          <Plus className="h-4 w-4 text-green-600" />
                          <div className="text-left">
                            <div className="font-medium">New Transaction</div>
                            <div className="text-xs text-muted-foreground">Record a new transaction</div>
                          </div>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {renderContent()}
      </div>


    </div>
  )
}

// Issuer Dashboard Component
function IssuerDashboard() {
  const { selectedEntity } = useEntity()
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalSecurities: 0,
    totalTransactions: 0,
    recentTransactions: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedEntity) return

      try {
        setLoading(true)

        // Fetch members count
        const membersResponse = await fetch(`/api/registry/members?entityId=${selectedEntity.id}`)
        const membersData = await membersResponse.json()

        // Fetch securities count
        const securitiesResponse = await fetch(`/api/registry/securities?entityId=${selectedEntity.id}`)
        const securitiesData = await securitiesResponse.json()

        // Fetch recent transactions
        const transactionsResponse = await fetch(`/api/registry/transactions?entityId=${selectedEntity.id}`)
        const transactionsData = await transactionsResponse.json()

        setStats({
          totalMembers: membersData.success ? membersData.data.length : 0,
          totalSecurities: securitiesData.success ? securitiesData.data.length : 0,
          totalTransactions: transactionsData.success ? transactionsData.data.length : 0,
          recentTransactions: transactionsData.success ? transactionsData.data.slice(0, 5) : []
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [selectedEntity])

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'ISSUE':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'CANCELLATION':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'TRANSFER':
        return <Repeat className="h-4 w-4 text-blue-500" />
      default:
        return <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (!selectedEntity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Issuer Dashboard</CardTitle>
          <CardDescription>
            Please select an entity to view the dashboard.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Issuer Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of {selectedEntity.name}'s registry
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalMembers}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered shareholders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Classes</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalSecurities}
            </div>
            <p className="text-xs text-muted-foreground">
              Types of securities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalTransactions}
            </div>
            <p className="text-xs text-muted-foreground">
              All time transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Latest securities transactions for {selectedEntity.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : stats.recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentTransactions.map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.transactionType)}
                    <div>
                      <div className="font-medium">
                        {transaction.transactionType} - {transaction.securityClass.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.quantity.toLocaleString()} securities
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {new Date(transaction.transactionDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {transaction.reference || 'No reference'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function RegistryPage() {
  return (
    <MainLayout>
      <Suspense fallback={
        <Card>
          <CardHeader>
            <CardTitle>Registry</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      }>
        <RegistryContent />
      </Suspense>
    </MainLayout>
  )
} 