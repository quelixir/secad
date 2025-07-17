'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, Crown } from 'lucide-react'
import { useEntity } from '@/lib/entity-context'
import { DirectorsTab } from './directors-tab'
import { MembersTab } from './members-tab'

function ResolutionsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { selectedEntity } = useEntity()
  
  // Get initial tab from URL params or default to 'directors'
  const initialTab = searchParams.get('tab') || 'directors'
  const [activeTab, setActiveTab] = useState(initialTab)

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const newUrl = value === 'directors' ? '/resolutions' : `/resolutions?tab=${value}`
    router.replace(newUrl, { scroll: false })
  }

  useEffect(() => {
    const tab = searchParams.get('tab') || 'directors'
    if (tab !== activeTab) {
      setActiveTab(tab)
    }
  }, [searchParams, activeTab])

  if (!selectedEntity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resolutions
          </CardTitle>
          <CardDescription>
            Prepare directors' and members' resolutions for your entity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Please select an entity to prepare resolutions.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resolutions</h1>
          <p className="text-muted-foreground">
            Prepare resolutions for {selectedEntity.name}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="directors" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Directors
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="directors">
          <DirectorsTab entityId={selectedEntity.id} entityName={selectedEntity.name} />
        </TabsContent>
        
        <TabsContent value="members">
          <MembersTab entityId={selectedEntity.id} entityName={selectedEntity.name} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function ResolutionsPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <ResolutionsContent />
      </Suspense>
    </MainLayout>
  )
} 