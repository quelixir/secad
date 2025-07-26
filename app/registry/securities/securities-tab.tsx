'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Search, Edit, Trash2, Shield, TrendingUp, Package, Archive, RotateCcw, Eye, EyeOff } from 'lucide-react'
import { SecurityForm } from './securityclass-form'
import { useEntity } from '@/lib/entity-context'
import Link from 'next/link'
import { getLocale, getLocaleOptions } from '@/lib/locale'

interface SecuritySummary {
  id: string
  name: string
  symbol?: string
  description?: string
  votingRights: boolean
  dividendRights: boolean
  isActive: boolean
  isArchived: boolean
  totalQuantity: number
  totalAmountPaid: number
  totalAmountUnpaid: number
  currency: string
  trancheCount: number
  memberCount: number
  tranches: {
    id: string
    trancheNumber: string
    issueDate: string
    quantity: number
    amountPaidPerSecurity?: number
    amountUnpaidPerSecurity?: number
    totalAmountPaid?: number
    totalAmountUnpaid?: number
    currency: string
    reference?: string
    description?: string
    allocationCount: number
  }[]
}

export function SecuritiesTab() {
  const { selectedEntity } = useEntity();
  const [securityClasses, setSecurities] = useState<SecuritySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [editingSecurity, setEditingSecurityClass] = useState<SecuritySummary | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const fetchSecurityClasses = useCallback(async () => {
    if (!selectedEntity) {
      setSecurities([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/registry/securities/summary?entityId=${selectedEntity.id}`)
      const result = await response.json()

      if (result.success) {
        setSecurities(result.data)
      } else {
        console.error('Failed to fetch securities summary:', result.error)
      }
    } catch (error) {
      console.error('Error fetching securities summary:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedEntity])

  useEffect(() => {
    fetchSecurityClasses()
  }, [fetchSecurityClasses])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/registry/securities/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        await fetchSecurityClasses()
      } else {
        console.error('Error deleting security:', result.error)
      }
    } catch (error) {
      console.error('Error deleting security:', error)
    }
  }

  const handleArchive = async (id: string, action: 'archive' | 'unarchive') => {
    try {
      const response = await fetch(`/api/registry/securities/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      const result = await response.json()
      if (result.success) {
        await fetchSecurityClasses()
      } else {
        console.error(`Error ${action}ing security:`, result.error)
      }
    } catch (error) {
      console.error(`Error ${action}ing security:`, error)
    }
  }

  const handleFormSuccess = async () => {
    setShowAddDialog(false)
    setEditingSecurityClass(null)
    await fetchSecurityClasses()
  }

  const filteredSecurityClasses = securityClasses.filter(securityClass => {
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = securityClass.name.toLowerCase().includes(searchLower) ||
        (securityClass.symbol || '').toLowerCase().includes(searchLower) ||
        (securityClass.description || '').toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    // Filter by archived status
    if (!showArchived && securityClass.isArchived) return false

    return true
  })

  // Calculate statistics
  const activeSecurities = securityClasses.filter(s => s.isActive && !s.isArchived).length
  const archivedSecurities = securityClasses.filter(s => s.isArchived).length
  const totalSecurities = securityClasses.reduce((sum, securityClass) => sum + securityClass.totalQuantity, 0)
  const totalTranches = securityClasses.reduce((sum, securityClass) => sum + securityClass.trancheCount, 0)

  if (!selectedEntity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Securities
          </CardTitle>
          <CardDescription>
            Please select an entity to view securities.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Securities</h1>
        <p className="text-muted-foreground">
          Manage security classes and instruments for {selectedEntity.name}
        </p>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Management
              </CardTitle>
              <CardDescription>
                Create and manage security classes
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Link href="/registry/transactions/new">
                <Button variant="outline">
                  <Package className="mr-2 h-4 w-4" />
                  Create Transaction
                </Button>
              </Link>

              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Security Class
                  </Button>
                </DialogTrigger>
                <DialogContent className="dialog-wide max-h-[95vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>Add New Security Class</DialogTitle>
                    <DialogDescription>
                      Create a new security class for {selectedEntity.name}.
                    </DialogDescription>
                  </DialogHeader>
                  <SecurityForm
                    entities={[{ id: selectedEntity.id, name: selectedEntity.name }]}
                    selectedEntity={selectedEntity}
                    onSaved={handleFormSuccess}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold">{securityClasses.length}</div>
              <div className="text-sm text-muted-foreground">Total Securities</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold">{activeSecurities}</div>
              <div className="text-sm text-muted-foreground">Active Securities</div>
              {archivedSecurities > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {archivedSecurities} archived
                </div>
              )}
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold">{totalSecurities.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Securities</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold">{totalTranches.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Tranches</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search securities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2"
            >
              {showArchived ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showArchived ? 'Hide Archived' : 'Show Archived'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Securities Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Security</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Rights</TableHead>
              <TableHead>Total Quantity</TableHead>
              <TableHead>Amount Paid</TableHead>
              <TableHead>Amount Unpaid</TableHead>
              <TableHead>Tranches</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Loading securities...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSecurityClasses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <div className="text-muted-foreground">
                    {searchTerm ? `No securities found matching "${searchTerm}"` : 'No securities found for this entity.'}
                  </div>
                  {!searchTerm && (
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => setShowAddDialog(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Security Class
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredSecurityClasses.map((securityClass) => (
                <TableRow key={securityClass.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{securityClass.name}</div>
                      {securityClass.description && (
                        <div className="text-sm text-muted-foreground">
                          {securityClass.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {securityClass.symbol ? (
                      <Badge variant="outline">{securityClass.symbol}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {securityClass.votingRights && (
                        <Badge variant="secondary" className="text-xs">Voting</Badge>
                      )}
                      {securityClass.dividendRights && (
                        <Badge variant="secondary" className="text-xs">Dividend</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{securityClass.totalQuantity.toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    {securityClass.totalAmountPaid > 0 ? (
                      <span>${securityClass.totalAmountPaid.toLocaleString(getLocale(), getLocaleOptions())} {securityClass.currency}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {securityClass.totalAmountUnpaid > 0 ? (
                      <span>${securityClass.totalAmountUnpaid.toLocaleString(getLocale(), getLocaleOptions())} {securityClass.currency}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      {securityClass.trancheCount.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {securityClass.memberCount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge variant={securityClass.isActive ? 'default' : 'secondary'}>
                        {securityClass.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {securityClass.isArchived && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          Archived
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingSecurityClass(securityClass)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="dialog-wide max-h-[95vh] overflow-hidden">
                          <DialogHeader>
                            <DialogTitle>Edit Security Class</DialogTitle>
                            <DialogDescription>
                              Update security class information.
                            </DialogDescription>
                          </DialogHeader>
                          {editingSecurity && (
                            <SecurityForm
                              entities={[{ id: selectedEntity.id, name: selectedEntity.name }]}
                              selectedEntity={selectedEntity}
                              security={editingSecurity}
                              onSaved={handleFormSuccess}
                            />
                          )}
                        </DialogContent>
                      </Dialog>

                      {!securityClass.isArchived ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" title="Archive">
                              <Archive className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Archive Security Class</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to archive this security class? Archived classes are hidden from new transactions but remain accessible for historical records.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleArchive(securityClass.id, 'archive')}
                                className="bg-orange-600 text-white hover:bg-orange-700"
                              >
                                Archive
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" title="Unarchive">
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Unarchive Security Class</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to unarchive this security class? It will become available for new transactions again.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleArchive(securityClass.id, 'unarchive')}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                              >
                                Unarchive
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Security Class</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this security class? This action cannot be undone and will also remove all associated holdings and transactions.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(securityClass.id)}
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
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
} 