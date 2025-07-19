'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Users, Shield, ArrowRightLeft, Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useEntity } from '@/lib/entity-context'

interface DashboardStats {
  members: number
  securityClasses: number
  transactions: number
  totalHoldings: number
}

interface RecentTransaction {
  id: string
  type: string
  quantity: number
  entity: { name: string }
  securityClass: { name: string }
  fromMember?: { firstName?: string; lastName?: string; entityName?: string }
  toMember?: { firstName?: string; lastName?: string; entityName?: string }
  transactionDate: string
}

export default function Dashboard() {
  const { selectedEntity } = useEntity()
  const [stats, setStats] = useState<DashboardStats>({
    members: 0,
    securityClasses: 0,
    transactions: 0,
    totalHoldings: 0
  })
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedEntity) {
      setStats({ members: 0, securityClasses: 0, transactions: 0, totalHoldings: 0 })
      setRecentTransactions([])
      setLoading(false)
      return
    }

    // Fetch dashboard data for selected entity
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Fetch entity-specific data in parallel
        const [membersRes, securitiesRes, transactionsRes] = await Promise.all([
          fetch(`/api/registry/members?entityId=${selectedEntity.id}&include=holdings`),
          fetch(`/api/registry/securities?entityId=${selectedEntity.id}`),
          fetch(`/api/registry/transactions?entityId=${selectedEntity.id}`)
        ])

        const [members, securities, transactions] = await Promise.all([
          membersRes.json(),
          securitiesRes.json(),
          transactionsRes.json()
        ])

        // Calculate total holdings
        const totalHoldings = members.data?.reduce((total: number, member: any) => {
          return total + (member.allocations?.reduce((memberTotal: number, allocation: any) => {
            return memberTotal + allocation.quantity
          }, 0) || 0)
        }, 0) || 0

        setStats({
          members: members.data?.length || 0,
          securityClasses: securities.data?.length || 0,
          transactions: transactions.data?.length || 0,
          totalHoldings
        })

        // Set recent transactions (first 5)
        setRecentTransactions(transactions.data?.slice(0, 5) || [])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [selectedEntity])

  const formatMemberName = (member: any) => {
    if (member.entityName) return member.entityName
    return `${member.firstName || ''} ${member.lastName || ''}`.trim()
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'ISSUE': return 'bg-green-100 text-green-800'
      case 'TRANSFER': return 'bg-blue-100 text-blue-800'
      case 'REDEMPTION': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!selectedEntity) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-muted-foreground mb-2">No Entity Selected</h2>
            <p className="text-muted-foreground mb-6">
              Please select an entity from the dropdown in the navigation bar to view its dashboard.
            </p>
            <Button asChild>
              <Link href="/entities">
                <Plus className="mr-2 h-4 w-4" />
                Manage Entities
              </Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview and activity for {selectedEntity.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/registry">
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/registry?tab=transactions">
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                New Transaction
              </Link>
            </Button>
          </div>
        </div>

        {/* Entity Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedEntity.name}
            </CardTitle>
            <CardDescription>
              {selectedEntity.entityType}
              {selectedEntity.abn && ` • ABN: ${selectedEntity.abn}`}
              {selectedEntity.acn && ` • ACN: ${selectedEntity.acn}`}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.members}</div>
              <p className="text-xs text-muted-foreground">
                Shareholders and members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Classes</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.securityClasses}</div>
              <p className="text-xs text-muted-foreground">
                Types of securities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Holdings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalHoldings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Securities issued
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.transactions}</div>
              <p className="text-xs text-muted-foreground">
                Total transactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Latest securities transactions for {selectedEntity.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-6 text-muted-foreground">Loading...</div>
              ) : recentTransactions.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No transactions yet. Start by adding members and issuing securities!
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={getTransactionTypeColor(transaction.type)}>
                          {transaction.type}
                        </Badge>
                        <div>
                          <div className="font-medium">
                            {transaction.quantity} {transaction.securityClass.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.type === 'TRANSFER' && transaction.fromMember && transaction.toMember && (
                              <span>
                                {formatMemberName(transaction.fromMember)} → {formatMemberName(transaction.toMember)}
                              </span>
                            )}
                            {transaction.type === 'ISSUE' && transaction.toMember && (
                              <span>
                                Issued to {formatMemberName(transaction.toMember)}
                              </span>
                            )}
                            {transaction.type === 'REDEMPTION' && transaction.fromMember && (
                              <span>
                                Redeemed by {formatMemberName(transaction.fromMember)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-xs text-muted-foreground">
                          {new Date(transaction.transactionDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks for {selectedEntity.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/registry">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Members
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/registry?tab=securities">
                  <Shield className="mr-2 h-4 w-4" />
                  Security Classes
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/registry?tab=transactions">
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Issue Securities
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/entities">
                  <Building2 className="mr-2 h-4 w-4" />
                  Switch Entity
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
