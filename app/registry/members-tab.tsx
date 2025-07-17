'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react'
import { MemberForm } from '../members/member-form'
import { useEntity } from '@/lib/entity-context'

interface Member {
  id: string
  firstName?: string
  lastName?: string
  entityName?: string
  memberType: string
  email?: string
  phone?: string
  memberNumber?: string
  status: string
  joinDate: string
  entity: {
    id: string
    name: string
  }
  holdings?: Array<{
    quantity: number
    securityClass: {
      name: string
      symbol?: string
    }
  }>
}

export function MembersTab() {
  const { selectedEntity, entities } = useEntity()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const fetchMembers = useCallback(async () => {
    if (!selectedEntity) {
      setMembers([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/members?entityId=${selectedEntity.id}`)
      const result = await response.json()
      
      if (result.success) {
        setMembers(result.data)
      } else {
        console.error('Failed to fetch members:', result.error)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedEntity])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      if (result.success) {
        await fetchMembers()
      } else {
        console.error('Error deleting member:', result.error)
      }
    } catch (error) {
      console.error('Error deleting member:', error)
    }
  }

  const handleFormSuccess = async () => {
    setShowAddDialog(false)
    setEditingMember(null)
    await fetchMembers()
  }

  const filteredMembers = members.filter(member => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase()
    const entityName = (member.entityName || '').toLowerCase()
    const memberNumber = (member.memberNumber || '').toLowerCase()
    const email = (member.email || '').toLowerCase()
    
    return fullName.includes(searchLower) ||
           entityName.includes(searchLower) ||
           memberNumber.includes(searchLower) ||
           email.includes(searchLower)
  })

  // Calculate member statistics
  const activeMembers = members.filter(m => m.status === 'ACTIVE').length
  const totalHoldings = members.reduce((sum, member) => {
    return sum + (member.holdings?.reduce((holdingSum, holding) => holdingSum + holding.quantity, 0) || 0)
  }, 0)

  if (!selectedEntity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members
          </CardTitle>
          <CardDescription>
            Please select an entity to view members.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members
              </CardTitle>
              <CardDescription>
                                 Manage entity members and shareholders for {selectedEntity.name}
              </CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Member</DialogTitle>
                  <DialogDescription>
                    Add a new member to {selectedEntity.name}.
                  </DialogDescription>
                </DialogHeader>
                <MemberForm 
                  onSaved={handleFormSuccess}
                  entities={entities}
                  selectedEntity={selectedEntity}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold">{members.length}</div>
              <div className="text-sm text-muted-foreground">Total Members</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold">{activeMembers}</div>
              <div className="text-sm text-muted-foreground">Active Members</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold">{totalHoldings.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Holdings</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Holdings</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Loading members...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="text-muted-foreground">
                    {searchTerm ? `No members found matching "${searchTerm}"` : 'No members found for this entity.'}
                  </div>
                  {!searchTerm && (
                    <Button 
                      variant="outline" 
                      className="mt-2" 
                      onClick={() => setShowAddDialog(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Member
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {member.memberType === 'INDIVIDUAL' 
                          ? `${member.firstName} ${member.lastName}`
                          : member.entityName
                        }
                      </div>
                      {member.memberNumber && (
                        <div className="text-sm text-muted-foreground">
                          #{member.memberNumber}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.memberType === 'INDIVIDUAL' ? 'default' : 'secondary'}>
                      {member.memberType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {member.email && (
                        <div className="text-muted-foreground">{member.email}</div>
                      )}
                      {member.phone && (
                        <div className="text-muted-foreground">{member.phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.holdings && member.holdings.length > 0 ? (
                      <div className="text-sm">
                        {member.holdings.map((holding, index) => (
                          <div key={index} className="text-muted-foreground">
                            {holding.quantity.toLocaleString()} {holding.securityClass.symbol || holding.securityClass.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No holdings</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(member.joinDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingMember(member)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Edit Member</DialogTitle>
                            <DialogDescription>
                              Update member information.
                            </DialogDescription>
                          </DialogHeader>
                                                     {editingMember && (
                             <MemberForm 
                               member={editingMember}
                               onSaved={handleFormSuccess}
                               entities={entities}
                               selectedEntity={selectedEntity}
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
                            <AlertDialogTitle>Delete Member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this member? This action cannot be undone and will also remove all associated holdings and transactions.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(member.id)}
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