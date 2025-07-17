'use client'

import { useEffect, useState, useCallback } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Search, Edit, Trash2, Users, Building2, Shield } from 'lucide-react'
import Link from 'next/link'
import { MemberForm } from './member-form'
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

export default function MembersPage() {
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
      const response = await fetch(`/api/members?entityId=${selectedEntity.id}&include=holdings`)
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

  const handleDelete = async (member: Member) => {
    try {
      const response = await fetch(`/api/members/${member.id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchMembers() // Refresh the list
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error deleting member:', error)
      alert('Failed to delete member')
    }
  }

  const handleMemberSaved = () => {
    setShowAddDialog(false)
    setEditingMember(null)
    fetchMembers()
  }

  const formatMemberName = (member: Member) => {
    if (member.entityName) return member.entityName
    return `${member.firstName || ''} ${member.lastName || ''}`.trim()
  }

  const filteredMembers = members.filter(member => {
    const name = formatMemberName(member).toLowerCase()
    const searchLower = searchTerm.toLowerCase()
    
    return name.includes(searchLower) ||
           member.email?.toLowerCase().includes(searchLower) ||
           member.memberNumber?.toLowerCase().includes(searchLower) ||
           member.memberType.toLowerCase().includes(searchLower)
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Inactive': return 'bg-yellow-100 text-yellow-800'
      case 'Resigned': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMemberTypeColor = (type: string) => {
    switch (type) {
      case 'Individual': return 'bg-blue-100 text-blue-800'
      case 'Company': return 'bg-purple-100 text-purple-800'
      case 'Trust': return 'bg-orange-100 text-orange-800'
      case 'SMSF': return 'bg-teal-100 text-teal-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!selectedEntity) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-muted-foreground mb-2">No Entity Selected</h2>
            <p className="text-muted-foreground mb-6">
              Please select an entity from the dropdown in the navigation bar to view its members.
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
            <h1 className="text-3xl font-bold tracking-tight">Members</h1>
            <p className="text-muted-foreground">
              Manage shareholders and members for {selectedEntity.name}
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>
                  Add a new shareholder or member to {selectedEntity.name}
                </DialogDescription>
              </DialogHeader>
              <MemberForm entities={entities} selectedEntity={selectedEntity} onSaved={handleMemberSaved} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search Members</CardTitle>
            <CardDescription>
              Find members by name, email, member number, or type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>Members ({filteredMembers.length})</CardTitle>
            <CardDescription>
              All members and shareholders for {selectedEntity.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading members...</div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No members found matching your search.' : 'No members yet. Add your first member to get started!'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name/Entity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Member #</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Holdings</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-primary/10 rounded-md flex items-center justify-center">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{formatMemberName(member)}</div>
                              <div className="text-sm text-muted-foreground">
                                Joined {new Date(member.joinDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getMemberTypeColor(member.memberType)}>
                            {member.memberType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono">
                            {member.memberNumber || 'Not set'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {member.email && <div>{member.email}</div>}
                            {member.phone && <div className="text-muted-foreground">{member.phone}</div>}
                            {!member.email && !member.phone && <span className="text-muted-foreground">No contact</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {member.holdings && member.holdings.length > 0 ? (
                              <div className="space-y-1">
                                {member.holdings.slice(0, 2).map((holding, idx) => (
                                  <div key={idx} className="flex items-center gap-1">
                                    <Shield className="h-3 w-3 text-muted-foreground" />
                                    <span>{holding.quantity} {holding.securityClass.symbol || holding.securityClass.name}</span>
                                  </div>
                                ))}
                                {member.holdings.length > 2 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{member.holdings.length - 2} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No holdings</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(member.status)}>
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <Link href={`/members/${member.id}`}>
                                View
                              </Link>
                            </Button>
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
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Edit Member</DialogTitle>
                                  <DialogDescription>
                                    Update member information
                                  </DialogDescription>
                                </DialogHeader>
                                {editingMember && (
                                  <MemberForm 
                                    entities={entities}
                                    selectedEntity={selectedEntity}
                                    member={editingMember} 
                                    onSaved={handleMemberSaved} 
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
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
                                  <AlertDialogTitle>Delete Member</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete &quot;{formatMemberName(member)}&quot;? This action cannot be undone.
                                    You can only delete members with no securities holdings or transaction history.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(member)}
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