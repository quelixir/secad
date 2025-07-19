'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Search, Edit, Trash2, Building2, Users, Shield } from 'lucide-react'
import Link from 'next/link'
import { useEntities, useDeleteEntity } from '@/lib/hooks/use-trpc'

interface Entity {
  id: string
  name: string
  abn?: string | null
  acn?: string | null
  entityType: string
  status: string
  email?: string | null
  phone?: string | null
  city?: string | null
  state?: string | null
  createdAt: string
  _count?: {
    members: number
    securityClasses: number
    transactions: number
  }
}

export default function EntitiesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: entitiesData, isLoading, refetch, error } = useEntities()
  const deleteEntityMutation = useDeleteEntity()

  const entities = entitiesData?.data || []

  if (error) {
    console.error('Error fetching entities:', error)
  }

  // Log API errors (when data.success === false)
  if (entitiesData && !entitiesData.success) {
    console.error('Error fetching entities:', entitiesData.error || 'Unknown API error')
  }

  const handleDelete = async (entity: Entity) => {
    try {
      await deleteEntityMutation.mutateAsync({ id: entity.id })
      await refetch() // Refresh the list
    } catch (error) {
      console.error('Error deleting entity:', error)
    }
  }



  const filteredEntities = entities.filter((entity: Entity) =>
    entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.abn?.includes(searchTerm) ||
    entity.acn?.includes(searchTerm) ||
    entity.entityType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Inactive': return 'bg-yellow-100 text-yellow-800'
      case 'Dissolved': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Entities</h1>
            <p className="text-muted-foreground">
              Manage your corporate entities and their details
            </p>
          </div>
          <Button asChild>
            <Link href="/entities/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Entity
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search Entities</CardTitle>
            <CardDescription>
              Find entities by name, ABN, ACN, or entity type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Entities Table */}
        <Card>
          <CardHeader>
            <CardTitle>Entities ({filteredEntities.length})</CardTitle>
            <CardDescription>
              All registered entities in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading entities...</div>
            ) : filteredEntities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No entities found matching your search.' : 'No entities yet. Add your first entity to get started!'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity</TableHead>
                      <TableHead>Entity Type</TableHead>
                      <TableHead>ABN/ACN</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Securities</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntities.map((entity: Entity) => (
                      <TableRow key={entity.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-primary/10 rounded-md flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{entity.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {entity.city && entity.state ? `${entity.city}, ${entity.state}` : 'No location set'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{entity.entityType}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {entity.abn && <div>ABN: {entity.abn}</div>}
                            {entity.acn && <div>ACN: {entity.acn}</div>}
                            {!entity.abn && !entity.acn && <span className="text-muted-foreground">Not set</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(entity.status)}>
                            {entity.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{entity._count?.members || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{entity._count?.securityClasses || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <Link href={`/entities/${entity.id}`}>
                                View
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <Link href={`/entities/${entity.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Entity</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete &quot;{entity.name}&quot;? This action cannot be undone.
                                    You can only delete entities with no members, securities, or transactions.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(entity)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
} 