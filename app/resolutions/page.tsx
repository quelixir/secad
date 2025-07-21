'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  FileText,
  Users,
  Crown,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { useEntity } from '@/lib/entity-context'
import { DirectorsTab } from './directors-tab'
import { MembersTab } from './members-tab'

// Sidebar navigation items
const sidebarItems = [
  {
    id: 'resolutions',
    label: 'Resolutions',
    icon: FileText,
    description: 'Resolutions dashboard'
  },
  {
    id: 'directors',
    label: 'Directors',
    icon: Crown,
    description: 'Directors\' resolutions'
  },
  {
    id: 'members',
    label: 'Members',
    icon: Users,
    description: 'Members\' resolutions'
  }
]

function ResolutionsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { selectedEntity } = useEntity()

  // Get initial section from URL params or default to 'resolutions'
  const initialSection = searchParams.get('section') || 'resolutions'
  const [activeSection, setActiveSection] = useState(initialSection)

  // Update URL when section changes
  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    const newUrl = section === 'resolutions' ? '/resolutions' : `/resolutions?section=${section}`
    router.replace(newUrl, { scroll: false })
  }

  useEffect(() => {
    const section = searchParams.get('section') || 'resolutions'
    if (section !== activeSection) {
      setActiveSection(section)
    }
  }, [searchParams, activeSection])

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

  // Render the appropriate content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'resolutions':
        return <ResolutionsDashboard />
      case 'directors':
        return <DirectorsTab entityId={selectedEntity.id} entityName={selectedEntity.name} />
      case 'members':
        return <MembersTab entityName={selectedEntity.name} />
      default:
        return <ResolutionsDashboard />
    }
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/30 min-h-screen">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Resolutions</h2>
            <p className="text-sm text-muted-foreground">
              {selectedEntity.name}
            </p>
          </div>

          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-auto py-3 px-3",
                    activeSection === item.id && "bg-secondary"
                  )}
                  onClick={() => handleSectionChange(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </Button>
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

// Resolutions Dashboard Component
function ResolutionsDashboard() {
  const { selectedEntity } = useEntity()
  const [stats, setStats] = useState({
    totalResolutions: 0,
    directorsResolutions: 0,
    membersResolutions: 0,
    approvedResolutions: 0,
    draftResolutions: 0,
    recentResolutions: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedEntity) return

      try {
        setLoading(true)

        // Fetch all resolutions
        const response = await fetch(`/api/resolutions?entityId=${selectedEntity.id}`)
        const data = await response.json()

        if (data.success) {
          const resolutions = data.data
          const directors = resolutions.filter((r: any) => r.category === 'directors')
          const members = resolutions.filter((r: any) => r.category === 'members')
          const approved = resolutions.filter((r: any) => r.status === 'Approved')
          const draft = resolutions.filter((r: any) => r.status === 'Draft')

          setStats({
            totalResolutions: resolutions.length,
            directorsResolutions: directors.length,
            membersResolutions: members.length,
            approvedResolutions: approved.length,
            draftResolutions: draft.length,
            recentResolutions: resolutions.slice(0, 5)
          })
        }
      } catch (error) {
        console.error('Error fetching resolution stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [selectedEntity])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'Draft':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'Rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800'
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'Rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!selectedEntity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resolutions Dashboard</CardTitle>
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
        <h1 className="text-3xl font-bold tracking-tight">Resolutions Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of resolutions for {selectedEntity.name}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resolutions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalResolutions}
            </div>
            <p className="text-xs text-muted-foreground">
              All resolutions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Directors' Resolutions</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.directorsResolutions}
            </div>
            <p className="text-xs text-muted-foreground">
              Board resolutions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.approvedResolutions}
            </div>
            <p className="text-xs text-muted-foreground">
              Approved resolutions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.draftResolutions}
            </div>
            <p className="text-xs text-muted-foreground">
              Draft resolutions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Resolutions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Resolutions</CardTitle>
          <CardDescription>
            Latest resolutions for {selectedEntity.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : stats.recentResolutions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No resolutions found
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentResolutions.map((resolution: any) => (
                <div key={resolution.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(resolution.status)}
                    <div>
                      <div className="font-medium">
                        {resolution.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {resolution.category === 'directors' ? 'Directors' : 'Members'} • {resolution.type}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {new Date(resolution.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(resolution.status)}`}>
                        {resolution.status}
                      </span>
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

export default function ResolutionsPage() {
  return (
    <MainLayout>
      <Suspense fallback={
        <Card>
          <CardHeader>
            <CardTitle>Resolutions</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      }>
        <ResolutionsContent />
      </Suspense>
    </MainLayout>
  )
} 