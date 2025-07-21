'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Search, Edit, Trash2, Building2, Crown, UserCheck } from 'lucide-react'
import { useEntity } from '@/lib/entity-context'
import { AssociateForm } from './associate-form'

interface Associate {
  id: string
  type: string
  isIndividual: boolean
  givenNames?: string
  familyName?: string
  dateOfBirth?: string
  previousNames?: string[]
  entityName?: string
  email?: string
  phone?: string
  status: string
  appointmentDate: string
  resignationDate?: string
  notes?: string
  entity: {
    id: string
    name: string
  }
}

export default function AssociatesPage() {
  const { selectedEntity } = useEntity()
  const [associates, setAssociates] = useState<Associate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [hideResigned, setHideResigned] = useState(false)
  const [editingAssociate, setEditingAssociate] = useState<Associate | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)


  const fetchAssociates = async () => {
    if (!selectedEntity) {
      setAssociates([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams({
        entityId: selectedEntity.id,
        includeHistorical: 'true', // Always include historical data
        type: 'officeholder_director,officeholder_secretary'
      })

      const response = await fetch(`/api/associates?${params}`)
      const result = await response.json()

      if (result.success) {
        setAssociates(result.data)
      } else {
        console.error('Failed to fetch associates:', result.error)
        setAssociates([])
      }
    } catch (error) {
      console.error('Error fetching associates:', error)
      setAssociates([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssociates()
  }, [selectedEntity]) // Remove hideResigned from dependencies since we filter on frontend

  const handleDelete = async (associate: Associate) => {
    try {
      const response = await fetch(`/api/associates/${associate.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        await fetchAssociates() // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting associate:', error)
    }
  }

  const handleAssociateSaved = () => {
    setEditingAssociate(null)
    setShowAddDialog(false)
    fetchAssociates()
  }



  const formatAssociateName = (associate: Associate) => {
    if (associate.isIndividual) {
      return `${associate.givenNames || ''} ${associate.familyName || ''}`.trim()
    } else {
      return associate.entityName || 'Unknown Entity'
    }
  }

  const formatAssociateType = (type: string) => {
    switch (type) {
      case 'officeholder_director':
        return 'Director'
      case 'officeholder_secretary':
        return 'Secretary'
      default:
        return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Resigned': return 'bg-yellow-100 text-yellow-800'
      case 'Removed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredAssociates = associates
    .filter(associate => {
      // Filter out resigned associates if hideResigned is true
      if (hideResigned && associate.status === 'Resigned') {
        return false
      }
      return true
    })
    .filter(associate =>
      formatAssociateName(associate).toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatAssociateType(associate.type).toLowerCase().includes(searchTerm.toLowerCase()) ||
      associate.status.toLowerCase().includes(searchTerm.toLowerCase())
    )

  if (!selectedEntity) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-muted-foreground mb-2">No Entity Selected</h2>
            <p className="text-muted-foreground mb-6">
              Please select an entity from the dropdown in the navigation bar to view its associates.
            </p>
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
            <h1 className="text-3xl font-bold tracking-tight">Associates</h1>
            <p className="text-muted-foreground">
              Manage directors, secretaries, and other associates for {selectedEntity.name}
            </p>
          </div>
        </div>

        {/* Officeholders Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Officeholders ({filteredAssociates.length})
                </CardTitle>
                <CardDescription>
                  Directors and secretaries for {selectedEntity.name}
                </CardDescription>
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Officeholder
                  </Button>
                </DialogTrigger>
                <DialogContent className="dialog-wide max-h-[95vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>Add New Officeholder</DialogTitle>
                    <DialogDescription>
                      Add a new director or secretary to {selectedEntity.name}
                    </DialogDescription>
                  </DialogHeader>
                  <AssociateForm entityId={selectedEntity.id} onSaved={handleAssociateSaved} />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* Controls */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search officeholders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hide-resigned"
                  checked={hideResigned}
                  onCheckedChange={(checked) => setHideResigned(checked === true)}
                />
                <label
                  htmlFor="hide-resigned"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Hide resigned
                </label>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading officeholders...</div>
            ) : filteredAssociates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No officeholders found matching your search.' : 'No officeholders yet. Add your first officeholder to get started!'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Appointment Date</TableHead>
                      <TableHead>Resignation Date</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssociates.map((associate) => (
                      <TableRow key={associate.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                              {associate.isIndividual ? (
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{formatAssociateName(associate)}</div>
                              <div className="text-sm text-muted-foreground">
                                {associate.isIndividual ? 'Individual' : 'Corporate Entity'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatAssociateType(associate.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(associate.status)}>
                            {associate.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {associate.isIndividual && associate.dateOfBirth && (
                              <div>DOB: {new Date(associate.dateOfBirth).toLocaleDateString()}</div>
                            )}
                            {associate.isIndividual && associate.previousNames && associate.previousNames.length > 0 && (
                              <div className="text-muted-foreground">
                                Also known as: {associate.previousNames.join(', ')}
                              </div>
                            )}
                            {!associate.isIndividual && associate.entityName && (
                              <div className="text-muted-foreground">Corporate Entity</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(associate.appointmentDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {associate.resignationDate
                            ? new Date(associate.resignationDate).toLocaleDateString()
                            : '—'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {associate.email && <div>{associate.email}</div>}
                            {associate.phone && <div>{associate.phone}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingAssociate(associate)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="dialog-wide max-h-[95vh] overflow-hidden">
                                <DialogHeader>
                                  <DialogTitle>Edit Officeholder</DialogTitle>
                                  <DialogDescription>
                                    Update information for {formatAssociateName(associate)}
                                  </DialogDescription>
                                </DialogHeader>
                                <AssociateForm
                                  entityId={selectedEntity.id}
                                  associate={editingAssociate}
                                  onSaved={handleAssociateSaved}
                                />
                              </DialogContent>
                            </Dialog>



                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Officeholder</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{formatAssociateName(associate)}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(associate)}
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