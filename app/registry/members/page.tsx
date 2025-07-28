'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Plus, Search, Edit, Trash2, Users, Eye } from 'lucide-react'
import { MemberForm } from './member-form'
import { useEntity } from '@/lib/entity-context'
import Link from 'next/link'
import { Member, MemberStatus, MemberType, calculateMemberHoldings } from '@/lib/types'
import { MainLayout } from '@/components/layout/main-layout'
import { TransactionWithRelations } from '@/lib/types/interfaces/Transaction'
import { getLocale, getLocaleOptions } from '@/lib/locale'

export default function MembersPage() {
    const { selectedEntity, entities } = useEntity()
    const [members, setMembers] = useState<Member[]>([])
    const [transactions, setTransactions] = useState<TransactionWithRelations[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [editingMember, setEditingMember] = useState<Member | null>(null)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [popoverStates, setPopoverStates] = useState<{ [key: string]: boolean }>({})

    const fetchMembers = useCallback(async () => {
        if (!selectedEntity) {
            setMembers([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const response = await fetch(`/api/registry/members?entityId=${selectedEntity.id}`)
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

    const fetchTransactions = useCallback(async () => {
        if (!selectedEntity) {
            setTransactions([])
            return
        }

        try {
            const response = await fetch(`/api/registry/transactions?entityId=${selectedEntity.id}`)
            const result = await response.json()

            if (result.success) {
                setTransactions(result.data)
            } else {
                console.error('Failed to fetch transactions:', result.error)
            }
        } catch (error) {
            console.error('Error fetching transactions:', error)
        }
    }, [selectedEntity])

    useEffect(() => {
        fetchMembers()
        fetchTransactions()
    }, [fetchMembers, fetchTransactions])

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/registry/members/${id}`, {
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
        const memberHoldings = calculateMemberHoldings(member.id, transactions);
        return sum + memberHoldings.reduce((memberSum, holding) => memberSum + holding.balance, 0);
    }, 0)

    if (!selectedEntity) {
        return (
            <MainLayout>
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
            </MainLayout>
        )
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Members</h1>
                    <p className="text-muted-foreground">
                        Manage entity members and shareholders for {selectedEntity.name}
                    </p>
                </div>

                {/* Actions */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Member Management
                                </CardTitle>
                                <CardDescription>
                                    Add, edit, and manage members
                                </CardDescription>
                            </div>
                            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Member
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="dialog-wide max-h-[95vh] overflow-hidden">
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
                                <div className="text-2xl font-bold">{totalHoldings.toLocaleString(getLocale(), getLocaleOptions())}</div>
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
                                <TableHead className="text-center">Type</TableHead>
                                <TableHead className="text-center">Beneficially Held</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead>Holdings</TableHead>
                                <TableHead>Join Date</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                            Loading members...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredMembers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8">
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
                                filteredMembers.map((member) => {
                                    const memberHoldings = calculateMemberHoldings(member.id, transactions);

                                    return (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">
                                                        {member.memberType == MemberType.INDIVIDUAL
                                                            ? `${member.firstName} ${member.lastName}`.trim()
                                                            : member.entityName
                                                        }
                                                    </div>
                                                    {member.designation && (
                                                        <div className="text-sm text-muted-foreground">
                                                            {member.designation}
                                                        </div>
                                                    )}
                                                    {member.memberNumber && (
                                                        <div className="text-sm text-muted-foreground">
                                                            #{member.memberNumber}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={member.memberType == MemberType.INDIVIDUAL ? 'default' : 'secondary'}>
                                                    {member.memberType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant='outline' className={member.beneficiallyHeld ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                                                    {member.beneficiallyHeld ? 'Yes' : 'No'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {member.email && (
                                                        <div className="text-muted-foreground hover:underline">
                                                            <Link href={`mailto:${member.email}`}>{member.email}</Link>
                                                        </div>
                                                    )}
                                                    {member.phone && (
                                                        <div className="text-muted-foreground">{member.phone}</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant='outline' className={member.status === MemberStatus.ACTIVE ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                    {member.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {memberHoldings.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {memberHoldings.map((holding, index) => {
                                                            const popoverKey = `${member.id}-${holding.securityClass.id}-${index}`;
                                                            return (
                                                                <Popover
                                                                    key={index}
                                                                    open={popoverStates[popoverKey]}
                                                                    onOpenChange={(open) => setPopoverStates(prev => ({ ...prev, [popoverKey]: open }))}
                                                                >
                                                                    <PopoverTrigger asChild>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs cursor-help"
                                                                            onMouseEnter={() => setPopoverStates(prev => ({ ...prev, [popoverKey]: true }))}
                                                                            onMouseLeave={() => setPopoverStates(prev => ({ ...prev, [popoverKey]: false }))}
                                                                        >
                                                                            {holding.securityClass.symbol || holding.securityClass.name}
                                                                        </Badge>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-auto p-2">
                                                                        <div className="text-sm font-medium">{holding.securityClass.name}</div>
                                                                        {holding.securityClass.symbol && (
                                                                            <div className="text-xs text-muted-foreground">Symbol: {holding.securityClass.symbol}</div>
                                                                        )}
                                                                        <div className="text-xs text-muted-foreground">Balance: {holding.balance.toLocaleString(getLocale(), getLocaleOptions())} shares</div>
                                                                    </PopoverContent>
                                                                </Popover>
                                                            );
                                                        })}
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
                                                    <Link href={`/registry/members/${member.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
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
                                                        <DialogContent className="dialog-wide max-h-[95vh] overflow-hidden">
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
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </MainLayout>
    )
} 