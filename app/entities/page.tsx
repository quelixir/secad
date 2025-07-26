'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Search, Edit, Trash2, Building2, Users, Shield, Play } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEntities, useDeleteEntity } from '@/lib/hooks/use-trpc'
import { Entity } from '@/lib/types/interfaces/Entity'
import { compliancePackRegistration } from '@/lib/compliance'
import { useEntityContext } from '@/lib/entity-context'
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function EntitiesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [transformedEntities, setTransformedEntities] = useState<Entity[]>([])
  const { data: entitiesData, isLoading, refetch, error } = useEntities()
  const deleteEntityMutation = useDeleteEntity()
  const { setSelectedEntity } = useEntityContext()
  const router = useRouter()

  // Transform entities to match our Entity interface
  useEffect(() => {
    async function transformEntities() {
      const entities = entitiesData?.data || []

      if (entities.length === 0) {
        setTransformedEntities([])
        return
      }

      const transformed = await Promise.all(
        entities.map(async (entity: Entity) => ({
          ...entity,
          entityType: compliancePackRegistration.getEntityType(
            entity.incorporationCountry || 'Australia',
            entity.entityTypeId
          )
        }))
      )
      setTransformedEntities(transformed)
    }

    transformEntities()
  }, [entitiesData?.data])

  if (error) {
    console.error('Error fetching entities:', error)
  }

  // Log API errors (when data.success === false)
  if (entitiesData && 'success' in entitiesData && !entitiesData.success) {
    console.error('Error fetching entities:', (entitiesData as { error?: string }).error || 'Unknown API error')
  }

  const handleDelete = async (entity: Entity) => {
    try {
      await deleteEntityMutation.mutateAsync({ id: entity.id })
      await refetch() // Refresh the list
    } catch (error) {
      console.error('Error deleting entity:', error)
    }
  }

  const handleUseEntity = (entity: Entity) => {
    setSelectedEntity(entity)
    router.push(`/entities/${entity.id}`) // Redirect to the entity view page
  }

  const filteredEntities = transformedEntities.filter((entity: Entity) => {
    const searchTermLower = searchTerm.toLowerCase();
    const nameMatch = entity.name?.toLowerCase().includes(searchTermLower);
    const identifierMatch = entity.identifiers?.some((identifier: any) =>
      identifier.value?.toLowerCase().includes(searchTermLower)
    );
    const entityType = compliancePackRegistration.getEntityType(
      entity.incorporationCountry || 'Australia',
      entity.entityTypeId
    );
    console.log('Entity type lookup:', {
      country: entity.incorporationCountry || 'Australia',
      entityTypeId: entity.entityTypeId,
      found: entityType?.name || 'Not found'
    });
    const typeMatch = entityType?.name?.toLowerCase().includes(searchTermLower);

    return nameMatch || identifierMatch || typeMatch;
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Inactive': return 'bg-yellow-100 text-yellow-800'
      case 'Dissolved': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Add debugging for available entity types
  const availableTypes = compliancePackRegistration.getEntityTypes('Australia');
  console.log('Available Australia entity types:', availableTypes.map(t => ({ id: t.id, name: t.name })));

  return (
    <MainLayout requireEntity={false}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Entities</h1>
            <p className="text-muted-foreground">
              Select an entity to work with or manage your corporate entities
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
              Find entities by name, identifiers, or entity type
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
              All registered entities in the system. Click "Use" to select an entity and start working with it.
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
                      <TableHead className="w-[25%]">Entity</TableHead>
                      <TableHead className="w-[20%]">Entity Type</TableHead>
                      <TableHead className="w-[10%]">Status</TableHead>
                      <TableHead className="w-[8%]">Members</TableHead>
                      <TableHead className="w-[8%]">Securities</TableHead>
                      <TableHead className="w-[29%] text-center">Actions</TableHead>
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
                          <Badge variant="outline">
                            {compliancePackRegistration.getEntityType(
                              entity.incorporationCountry || 'Australia',
                              entity.entityTypeId
                            )?.name || 'Unknown Type'}
                          </Badge>
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
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleUseEntity(entity)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Use
                            </Button>
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