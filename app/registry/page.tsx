'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Shield, ArrowRightLeft } from 'lucide-react'
import { useEntity } from '@/lib/entity-context'
import { MembersTab } from './members-tab'
import { SecuritiesTab } from './securities-tab'
import { TransactionsTab } from './transactions-tab'

function RegistryContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { selectedEntity } = useEntity()
  
  // Get initial tab from URL params or default to 'members'
  const initialTab = searchParams.get('tab') || 'members'
  const [activeTab, setActiveTab] = useState(initialTab)

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const newUrl = value === 'members' ? '/registry' : `/registry?tab=${value}`
    router.replace(newUrl, { scroll: false })
  }

  useEffect(() => {
    const tab = searchParams.get('tab') || 'members'
    if (tab !== activeTab) {
      setActiveTab(tab)
    }
  }, [searchParams, activeTab])

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Registry</h1>
        <p className="text-muted-foreground">
          Manage members, securities, and transactions for {selectedEntity.name}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="securities" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Securities
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <MembersTab />
        </TabsContent>

        <TabsContent value="securities">
          <SecuritiesTab />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionsTab />
        </TabsContent>
      </Tabs>
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