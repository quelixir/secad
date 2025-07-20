'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Search, Edit, Trash2, Shield, TrendingUp, Package } from 'lucide-react'
import { SecurityForm } from './security-form'
import { useEntity } from '@/lib/entity-context'
import Link from 'next/link'
import type { Entity } from '@/lib/types/interfaces/Entity'

interface SecuritySummary {
  id: string
  name: string
  symbol?: string
  description?: string
  votingRights: boolean
  dividendRights: boolean
  isActive: boolean
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
  const { selectedEntity, entities } = useEntity();
  const [securities, setSecurities] = useState<SecuritySummary[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [securityClasses, setSecurityClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingSecurity, setEditingSecurity] = useState<SecuritySummary | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const fetchSecurities = useCallback(async () => {
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

  const fetchMembers = useCallback(async () => {
    if (!selectedEntity) return

    try {
      const response = await fetch(`/api/registry/members?entityId=${selectedEntity.id}`)
      const result = await response.json()

      if (result.success) {
        setMembers(result.data || [])
        setSecurityClasses(result.data || [])
      } else {
        console.error('Failed to fetch members:', result.error)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }, [selectedEntity])

  const fetchSecurityClasses = useCallback(async () => {
    if (!selectedEntity) return

    try {
      const response = await fetch(`/api/registry/securities?entityId=${selectedEntity.id}`)
      const result = await response.json()

      if (result.success) {
        setSecurityClasses(result.data || [])
      } else {
        console.error('Failed to fetch security classes:', result.error)
      }
    } catch (error) {
      console.error('Error fetching security classes:', error)
    }
  }, [selectedEntity])

  useEffect(() => {
    fetchSecurities()
    fetchMembers()
    fetchSecurityClasses()
  }, [fetchSecurities, fetchMembers, fetchSecurityClasses])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/registry/securities/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        await fetchSecurities()
      } else {
        console.error('Error deleting security:', result.error)
      }
    } catch (error) {
      console.error('Error deleting security:', error)
    }
  }

  const handleFormSuccess = async () => {
    setShowAddDialog(false)
    setEditingSecurity(null)
    await fetchSecurities()
  }

  const filteredSecurities = securities.filter(security => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return security.name.toLowerCase().includes(searchLower) ||
      (security.symbol || '').toLowerCase().includes(searchLower) ||
      (security.description || '').toLowerCase().includes(searchLower)
  })

  // Calculate statistics
  const activeSecurities = securities.filter(s => s.isActive).length
  const totalSecurities = securities.reduce((sum, security) => sum + security.totalQuantity, 0)
  const totalTranches = securities.reduce((sum, security) => sum + security.trancheCount, 0)
  const totalMembers = securities.reduce((sum, security) => sum + security.memberCount, 0)

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
                    entities={entities.filter((e: Entity) => e.id === selectedEntity.id)}
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
              <div className="text-2xl font-bold">{securities.length}</div>
              <div className="text-sm text-muted-foreground">Total Securities</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold">{activeSecurities}</div>
              <div className="text-sm text-muted-foreground">Active Securities</div>
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

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search securities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
            ) : filteredSecurities.length === 0 ? (
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
              filteredSecurities.map((security) => (
                <TableRow key={security.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{security.name}</div>
                      {security.description && (
                        <div className="text-sm text-muted-foreground">
                          {security.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {security.symbol ? (
                      <Badge variant="outline">{security.symbol}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {security.votingRights && (
                        <Badge variant="secondary" className="text-xs">Voting</Badge>
                      )}
                      {security.dividendRights && (
                        <Badge variant="secondary" className="text-xs">Dividend</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{security.totalQuantity.toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    {security.totalAmountPaid > 0 ? (
                      <span>${security.totalAmountPaid.toFixed(2)} {security.currency}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {security.totalAmountUnpaid > 0 ? (
                      <span>${security.totalAmountUnpaid.toFixed(2)} {security.currency}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      {security.trancheCount.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {security.memberCount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={security.isActive ? 'default' : 'secondary'}>
                      {security.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingSecurity(security)}
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
                              entities={entities.filter((e: Entity) => e.id === selectedEntity.id)}
                              selectedEntity={selectedEntity}
                              security={editingSecurity}
                              onSaved={handleFormSuccess}
                            />
                          )}
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
                            <AlertDialogTitle>Delete Security Class</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this security class? This action cannot be undone and will also remove all associated holdings and transactions.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(security.id)}
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