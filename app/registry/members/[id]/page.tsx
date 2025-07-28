'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, User, FileUser, Landmark, Mail, Phone, MapPin, Shield, TrendingUp, Eye, HelpCircle, ExternalLink, Copy, Pencil, Archive, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { MemberWithRelations, TransactionDirection } from '@/lib/types/interfaces'
import { getDefaultCurrencyCode } from '@/lib/config'
import { getLocale, getLocaleOptions } from '@/lib/locale'

interface SecurityClassesSummary {
    securityClassId: string
    securityClassName: string
    securityClassSymbol?: string
    totalQuantity: number
    totalAmountPaid: number
    totalAmountUnpaid: number
    currency: string
    trancheCount: number
}

export default function MemberViewPage() {
    const params = useParams()
    const memberId = params.id as string

    const [member, setMember] = useState<(MemberWithRelations & { transactionsTo?: any[], transactionsFrom?: any[] }) | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedSecurityClass, setSelectedSecurityClass] = useState<string>('all')
    const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)

    useEffect(() => {
        const fetchMember = async () => {
            try {
                setLoading(true)
                const response = await fetch(`/api/registry/members/${memberId}?include=transactions`)
                const result = await response.json()

                if (result.success) {
                    setMember(result.data)
                } else {
                    setError(result.error || 'Failed to fetch member')
                }
            } catch (error) {
                console.error('Error fetching member:', error)
                setError('Failed to fetch member')
            } finally {
                setLoading(false)
            }
        }

        if (memberId) {
            fetchMember()
        }
    }, [memberId])

    if (loading) {
        return (
            <div className="container mx-auto py-6">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading member details...</span>
                </div>
            </div>
        )
    }

    if (error || !member) {
        return (
            <div className="container mx-auto py-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Error</CardTitle>
                        <CardDescription>
                            {error || 'Member not found'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/registry/members">
                            <Button>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Members
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Calculate securities summary from transactions
    const securitiesSummary: SecurityClassesSummary[] = []
    const securityClassMap = new Map<string, SecurityClassesSummary>()

        // Process incoming transactions (toMember)
        ; (member.transactionsTo || []).forEach(transaction => {
            if (transaction.securityClass) {
                const securityClassId = transaction.securityClass.id
                const existing = securityClassMap.get(securityClassId)

                if (existing) {
                    existing.totalQuantity += transaction.quantity
                    existing.totalAmountPaid += transaction.totalAmountPaid || 0
                    existing.totalAmountUnpaid += transaction.totalAmountUnpaid || 0
                    existing.trancheCount += 1
                } else {
                    const summary: SecurityClassesSummary = {
                        securityClassId,
                        securityClassName: transaction.securityClass.name,
                        securityClassSymbol: transaction.securityClass.symbol,
                        totalQuantity: transaction.quantity,
                        totalAmountPaid: transaction.totalAmountPaid || 0,
                        totalAmountUnpaid: transaction.totalAmountUnpaid || 0,
                        currency: getDefaultCurrencyCode(),
                        trancheCount: 1
                    }
                    securityClassMap.set(securityClassId, summary)
                }
            }
        })

        // Process outgoing transactions (fromMember) - subtract quantities
        ; (member.transactionsFrom || []).forEach(transaction => {
            if (transaction.securityClass) {
                const securityClassId = transaction.securityClass.id
                const existing = securityClassMap.get(securityClassId)

                if (existing) {
                    existing.totalQuantity -= transaction.quantity
                    existing.totalAmountPaid -= transaction.totalAmountPaid || 0
                    existing.totalAmountUnpaid -= transaction.totalAmountUnpaid || 0
                }
            }
        })

    securitiesSummary.push(...securityClassMap.values())

    // Combine all transactions
    const allTransactions = [
        ...(member.transactionsFrom || []).map(t => ({ ...t, direction: TransactionDirection.OUT as const })),
        ...(member.transactionsTo || []).map(t => ({ ...t, direction: TransactionDirection.IN as const }))
    ].sort((a, b) => new Date(b.settlementDate).getTime() - new Date(a.settlementDate).getTime())

    // Filter transactions by security class
    const filteredTransactions = selectedSecurityClass === 'all'
        ? allTransactions
        : allTransactions.filter(t => {
            return t.securityClass?.id === selectedSecurityClass
        })

    const getMemberDisplayName = (member: any) => {
        if (member.memberType === 'INDIVIDUAL') {
            return `${member.firstName || ''} ${member.lastName || ''}`.trim()
        }
        return member.entityName || ''
    }

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: currency || getDefaultCurrencyCode()
        }).format(amount)
    }

    const formatDate = (dateInput: string | Date) => {
        return new Date(dateInput).toLocaleDateString('en-AU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const showTooltip = (text: string, event: React.MouseEvent) => {
        setTooltip({
            text,
            x: event.clientX + 10,
            y: event.clientY - 10
        })
    }

    const hideTooltip = () => {
        setTooltip(null)
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            {getMemberDisplayName(member)}
                            {member.designation && ` ${member.designation}`}
                        </h1>
                        <p className="text-muted-foreground">
                            Member of{' '}
                            <Link href={`/entities/${member.entityId}`} className="text-primary underline inline-flex items-center gap-1">
                                {member.entity?.name || member.entityId}
                                <ExternalLink className="h-4 w-4" />
                            </Link>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/registry/members">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Members
                            </Button>
                        </Link>

                        <Link href={`/registry/members/${memberId}/edit`}>
                            <Button variant="outline" size="sm">
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </Link>

                        {/* TODO: Add links for archive and delete buttons */}
                        <Button variant="outline">
                            <Archive className="h-4 w-4" />
                        </Button>

                        <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="holdings">Holdings</TabsTrigger>
                        <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    </TabsList>

                    {/* Details Tab */}
                    <TabsContent value="details" className="space-y-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileUser className="h-5 w-5" />
                                    Basic Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Type:</span>
                                                <Badge variant="outline">{member.memberType}</Badge>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Name:</span>
                                                <span className="font-medium">{getMemberDisplayName(member)}</span>
                                            </div>
                                            {member.designation && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Designation:</span>
                                                    <span>{member.designation}</span>
                                                </div>
                                            )}
                                            {member.memberNumber && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Member Number:</span>
                                                    <span>
                                                        <div className="flex items-center gap-2">
                                                            <code className="text-sm bg-muted px-2 rounded">{member.memberNumber}</code>
                                                            <button
                                                                onClick={() => navigator.clipboard.writeText(member.memberNumber || 'Error copying Member Number')}
                                                                className="p-1 hover:bg-muted rounded transition-colors"
                                                                title="Copy Member Number"
                                                            >
                                                                <Copy className="h-3 w-3 text-muted-foreground" />
                                                            </button>
                                                        </div>

                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">secad ID:</span>
                                                <span>
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-sm bg-muted px-2 rounded">{member.id}</code>
                                                        <button
                                                            onClick={() => navigator.clipboard.writeText(member.id)}
                                                            className="p-1 hover:bg-muted rounded transition-colors"
                                                            title="Copy secad ID"
                                                        >
                                                            <Copy className="h-3 w-3 text-muted-foreground" />
                                                        </button>
                                                    </div>

                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Status:</span>
                                                <Badge variant={member.status === 'Active' ? 'default' : 'secondary'}>
                                                    {member.status}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Beneficially Held:</span>
                                                <Badge variant={member.beneficiallyHeld ? 'default' : 'secondary'}>
                                                    {member.beneficiallyHeld ? 'Yes' : 'No'}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Join Date:</span>
                                                <span>{formatDate(member.joinDate)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Member Contact Information */}
                                    <div>
                                        <div className="space-y-2 text-sm">
                                            {member.email && (
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <a
                                                        href={`mailto:${member.email}`}
                                                        className="text-primary hover:underline"
                                                        title={`Send email to ${member.email}`}
                                                    >
                                                        {member.email}
                                                    </a>
                                                </div>
                                            )}
                                            {member.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    <span>{member.phone}</span>
                                                </div>
                                            )}
                                            {(member.address || member.city || member.state || member.postcode) && (
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                    <div>
                                                        {member.address && <div>{member.address}</div>}
                                                        {(member.city || member.state || member.postcode) && (
                                                            <div>
                                                                {[member.city, member.state, member.postcode].filter(Boolean).join(', ')}
                                                            </div>
                                                        )}
                                                        {member.country && <div>{member.country}</div>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Financial Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Landmark className="h-5 w-5" />
                                    Financial Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Tax Information */}
                                    <div>
                                        <div className="space-y-2 text-sm">
                                            {!member.tfn && !member.abn && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">No tax information available</span>
                                                </div>
                                            )}
                                            {member.tfn && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">TFN:</span>
                                                    <span>{member.tfn}</span>
                                                </div>
                                            )}
                                            {member.abn && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">ABN:</span>
                                                    <span>{member.abn}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contacts */}
                        {member.contacts && member.contacts.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Contacts
                                    </CardTitle>
                                    <CardDescription>
                                        Contact information for this member
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {member.contacts.map((contact) => (
                                            <div key={contact.id} className="border rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-medium">{contact.name}</h4>
                                                    <div className="flex gap-1">
                                                        {contact.isPrimary && (
                                                            <Badge variant="secondary" className="text-xs">Primary</Badge>
                                                        )}
                                                        {contact.role && (
                                                            <Badge variant="outline" className="text-xs">{contact.role}</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-1 text-sm text-muted-foreground">
                                                    {contact.email && (
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="h-3 w-3" />
                                                            <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                                                                {contact.email}
                                                            </a>
                                                        </div>
                                                    )}
                                                    {contact.phone && (
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-3 w-3" />
                                                            <span>{contact.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Holdings Tab */}
                    <TabsContent value="holdings" className="space-y-6">
                        {securitiesSummary.length > 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Securities Summary
                                    </CardTitle>
                                    <CardDescription>
                                        Current holdings across all security classes
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-muted/50 rounded-lg p-4">
                                            <div className="text-2xl font-bold">{securitiesSummary.length}</div>
                                            <div className="text-sm text-muted-foreground">Security Classes</div>
                                        </div>
                                        <div className="bg-muted/50 rounded-lg p-4">
                                            <div className="text-2xl font-bold">
                                                {securitiesSummary.reduce((sum, s) => sum + s.totalQuantity, 0).toLocaleString(getLocale(), getLocaleOptions())}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Total Securities</div>
                                        </div>
                                        <div className="bg-muted/50 rounded-lg p-4">
                                            <div className="text-2xl font-bold">
                                                {formatCurrency(
                                                    securitiesSummary.reduce((sum, s) => sum + s.totalAmountPaid, 0),
                                                    securitiesSummary[0]?.currency || getDefaultCurrencyCode()
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Total Paid</div>
                                        </div>
                                        <div className="bg-muted/50 rounded-lg p-4">
                                            <div className="text-2xl font-bold">
                                                {formatCurrency(
                                                    securitiesSummary.reduce((sum, s) => sum + s.totalAmountUnpaid, 0),
                                                    securitiesSummary[0]?.currency || getDefaultCurrencyCode()
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Total Unpaid</div>
                                        </div>
                                    </div>

                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Security Class</TableHead>
                                                <TableHead>Quantity</TableHead>
                                                <TableHead>Amount Paid</TableHead>
                                                <TableHead>Amount Unpaid</TableHead>
                                                <TableHead>Tranches</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {securitiesSummary.map((securityClass) => (
                                                <TableRow key={securityClass.securityClassId}>
                                                    <TableCell>
                                                        <div>
                                                            {securityClass.securityClassSymbol && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {securityClass.securityClassSymbol}
                                                                </Badge>
                                                            )}
                                                            <div className="font-medium">{securityClass.securityClassName}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{securityClass.totalQuantity.toLocaleString(getLocale(), getLocaleOptions())}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {securityClass.totalAmountPaid > 0 ? (
                                                            <span>{formatCurrency(securityClass.totalAmountPaid, securityClass.currency)}</span>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {securityClass.totalAmountUnpaid > 0 ? (
                                                            <span>{formatCurrency(securityClass.totalAmountUnpaid, securityClass.currency)}</span>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                                            {securityClass.trancheCount}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Securities Summary
                                    </CardTitle>
                                    <CardDescription>
                                        Current holdings across all security classes
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-8">
                                        <div className="text-muted-foreground">
                                            No securities found for this member.
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Transactions Tab */}
                    <TabsContent value="transactions" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Transaction History
                                </CardTitle>
                                <CardDescription>
                                    History of securities transactions
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {allTransactions.length > 0 ? (
                                    <>
                                        {/* Filter */}
                                        <div className="mb-4">
                                            <Select value={selectedSecurityClass} onValueChange={setSelectedSecurityClass}>
                                                <SelectTrigger className="w-64">
                                                    <SelectValue placeholder="Filter by security class" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Security Classes</SelectItem>
                                                    {securitiesSummary.map((securityClass) => (
                                                        <SelectItem key={securityClass.securityClassId} value={securityClass.securityClassId}>
                                                            {securityClass.securityClassName} {securityClass.securityClassSymbol && `(${securityClass.securityClassSymbol})`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Security Class</TableHead>
                                                    <TableHead>Quantity</TableHead>
                                                    <TableHead>
                                                        <div className="flex items-center gap-1">
                                                            PPS
                                                            <span
                                                                onMouseEnter={(e) => showTooltip("Paid Per Security", e)}
                                                                onMouseLeave={hideTooltip}
                                                            >
                                                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                                            </span>
                                                        </div>
                                                    </TableHead>
                                                    <TableHead>Total Paid</TableHead>
                                                    <TableHead>
                                                        <div className="flex items-center gap-1">
                                                            UPS
                                                            <span
                                                                onMouseEnter={(e) => showTooltip("Unpaid Per Security", e)}
                                                                onMouseLeave={hideTooltip}
                                                            >
                                                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                                            </span>
                                                        </div>
                                                    </TableHead>
                                                    <TableHead>Total Unpaid</TableHead>
                                                    <TableHead>Reference</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredTransactions.map((transaction) => (
                                                    <TableRow key={transaction.id}>
                                                        <TableCell>{formatDate(transaction.settlementDate)}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{transaction.transactionType}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                {transaction.securityClass?.symbol && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {transaction.securityClass?.symbol}
                                                                    </Badge>
                                                                )}
                                                                <div>{transaction.securityClass?.name || transaction.securityClassId}</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="font-bold">
                                                                <span className={transaction.direction === TransactionDirection.IN ? 'text-green-800' : 'text-red-800'}>
                                                                    {transaction.direction === TransactionDirection.OUT && '('}
                                                                    {transaction.quantity.toLocaleString(getLocale(), getLocaleOptions())}
                                                                    {transaction.direction === TransactionDirection.OUT && ')'}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {transaction.amountPaidPerSecurity ? (
                                                                <span className={transaction.direction === TransactionDirection.IN ? 'text-green-800' : 'text-red-800'}>
                                                                    {transaction.direction === TransactionDirection.OUT && '('}
                                                                    {formatCurrency(transaction.amountPaidPerSecurity, transaction.currencyCode || getDefaultCurrencyCode())}
                                                                    {transaction.direction === TransactionDirection.OUT && ')'}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {transaction.totalAmountPaid ? (
                                                                <span className={transaction.direction === TransactionDirection.IN ? 'text-green-800' : 'text-red-800'}>
                                                                    {transaction.direction === TransactionDirection.OUT && '('}
                                                                    {formatCurrency(transaction.totalAmountPaid, transaction.currencyCode || getDefaultCurrencyCode())}
                                                                    {transaction.direction === TransactionDirection.OUT && ')'}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {transaction.amountUnpaidPerSecurity ? (
                                                                <span className={transaction.direction === TransactionDirection.IN ? 'text-green-800' : 'text-red-800'}>
                                                                    {transaction.direction === TransactionDirection.OUT && '('}
                                                                    {formatCurrency(transaction.amountUnpaidPerSecurity, transaction.currencyCode || getDefaultCurrencyCode())}
                                                                    {transaction.direction === TransactionDirection.OUT && ')'}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {transaction.totalAmountUnpaid ? (
                                                                <span className={transaction.direction === TransactionDirection.OUT ? 'text-red-800' : 'text-green-800'}>
                                                                    {transaction.direction === TransactionDirection.OUT && '('}
                                                                    {formatCurrency(transaction.totalAmountUnpaid, transaction.currencyCode || getDefaultCurrencyCode())}
                                                                    {transaction.direction === TransactionDirection.OUT && ')'}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {transaction.reference || (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                asChild
                                                            >
                                                                <Link href={`/registry/transactions/${transaction.id}`}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-muted-foreground">
                                            No transactions found for this member.
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Custom Tooltip */}
            {tooltip && (
                <div
                    className="fixed z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg pointer-events-none"
                    style={{
                        left: tooltip.x,
                        top: tooltip.y,
                        transform: 'translateY(-100%)'
                    }}
                >
                    {tooltip.text}
                </div>
            )}
        </MainLayout>
    )
} 