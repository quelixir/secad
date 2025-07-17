'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Search, Edit, Trash2, FileText, Crown, CheckCircle, Clock, XCircle } from 'lucide-react'
import { ResolutionType, ResolutionStatus } from '@/lib/types'

interface Resolution {
  id: string
  title: string
  type: string
  description?: string
  status: string
  resolutionDate?: string
  effectiveDate?: string
  referenceNumber?: string
  approvedBy?: string
  createdAt: string
  entity: {
    id: string
    name: string
  }
}

interface DirectorsTabProps {
  entityId: string
  entityName: string
}

export function DirectorsTab({ entityId, entityName }: DirectorsTabProps) {
  const [resolutions, setResolutions] = useState<Resolution[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const fetchResolutions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        entityId,
        category: 'directors'
      })
      
      const response = await fetch(`/api/resolutions?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setResolutions(result.data)
      } else {
        console.error('Failed to fetch resolutions:', result.error)
        setResolutions([])
      }
    } catch (error) {
      console.error('Error fetching resolutions:', error)
      setResolutions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResolutions()
  }, [entityId])

  const handleDelete = async (resolution: Resolution) => {
    try {
      const response = await fetch(`/api/resolutions/${resolution.id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchResolutions() // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting resolution:', error)
    }
  }

  const handleResolutionSaved = () => {
    setShowCreateDialog(false)
    fetchResolutions()
  }

  const formatResolutionType = (type: string) => {
    switch (type) {
      case ResolutionType.DIRECTORS_APPOINTMENT:
        return 'Director Appointment'
      case ResolutionType.DIRECTORS_REMOVAL:
        return 'Director Removal'
      case ResolutionType.DIRECTORS_RESIGNATION_ACCEPTANCE:
        return 'Resignation Acceptance'
      case ResolutionType.DIVIDEND_DECLARATION:
        return 'Dividend Declaration'
      case ResolutionType.FINANCIAL_APPROVAL:
        return 'Financial Approval'
      case ResolutionType.POLICY_APPROVAL:
        return 'Policy Approval'
      case ResolutionType.CONTRACT_APPROVAL:
        return 'Contract Approval'
      case ResolutionType.GENERAL_BUSINESS:
        return 'General Business'
      default:
        return type
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case ResolutionStatus.APPROVED:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case ResolutionStatus.DRAFT:
        return <Clock className="h-4 w-4 text-yellow-600" />
      case ResolutionStatus.REJECTED:
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case ResolutionStatus.APPROVED:
        return 'bg-green-100 text-green-800'
      case ResolutionStatus.DRAFT:
        return 'bg-yellow-100 text-yellow-800'
      case ResolutionStatus.REJECTED:
        return 'bg-red-100 text-red-800'
      case ResolutionStatus.SUPERSEDED:
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredResolutions = resolutions.filter(resolution =>
    resolution.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatResolutionType(resolution.type).toLowerCase().includes(searchTerm.toLowerCase()) ||
    resolution.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (resolution.referenceNumber && resolution.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading directors' resolutions...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Directors' Resolutions ({filteredResolutions.length})
            </CardTitle>
            <CardDescription>
              Directors' resolutions for {entityName}
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Resolution
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Create New Directors' Resolution</DialogTitle>
                <DialogDescription>
                  Create a new directors' resolution for {entityName}
                </DialogDescription>
              </DialogHeader>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Resolution creation form coming soon...</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resolutions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Resolutions Table */}
        {filteredResolutions.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Directors' Resolutions</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No resolutions match your search.' : 'No directors\' resolutions have been created yet.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Resolution
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Resolution Date</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResolutions.map((resolution) => (
                  <TableRow key={resolution.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{resolution.title}</div>
                        {resolution.description && (
                          <div className="text-sm text-muted-foreground">
                            {resolution.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatResolutionType(resolution.type)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`flex items-center gap-1 ${getStatusColor(resolution.status)}`}>
                        {getStatusIcon(resolution.status)}
                        {resolution.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {resolution.referenceNumber || '—'}
                    </TableCell>
                    <TableCell>
                      {resolution.resolutionDate 
                        ? new Date(resolution.resolutionDate).toLocaleDateString()
                        : '—'
                      }
                    </TableCell>
                    <TableCell>
                      {new Date(resolution.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Resolution</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{resolution.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(resolution)}
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
  )
} 