'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, ArrowRightLeft, TrendingUp, TrendingDown, Repeat, Eye } from 'lucide-react'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { useEntity } from '@/lib/entity-context'
import { TransactionWithRelations } from '@/lib/types/interfaces/Transaction'

export default function TransactionsPage() {
    const { selectedEntity } = useEntity()
    const [transactions, setTransactions] = useState<TransactionWithRelations[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedType, setSelectedType] = useState<string>('all')

    const fetchTransactions = async () => {
        if (!selectedEntity) {
            setTransactions([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const response = await fetch(`/api/registry/transactions?entityId=${selectedEntity.id}`)
            const result = await response.json()

            if (result.success) {
                setTransactions(result.data)
            } else {
                console.error('Failed to fetch transactions:', result.error)
            }
        } catch (error) {
            console.error('Error fetching transactions:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTransactions()
    }, [selectedEntity])

    const formatMemberName = (member: TransactionWithRelations['fromMember']) => {
        if (!member) return 'N/A'
        if (member.entityName) return member.entityName
        return `${member.firstName || ''} ${member.lastName || ''}`.trim()
    }

    const filteredTransactions = transactions.filter(transaction => {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch =
            transaction.reference?.toLowerCase().includes(searchLower) ||
            transaction.description?.toLowerCase().includes(searchLower) ||
            transaction.security?.name.toLowerCase().includes(searchLower) ||
            formatMemberName(transaction.fromMember).toLowerCase().includes(searchLower) ||
            formatMemberName(transaction.toMember).toLowerCase().includes(searchLower)

        const matchesType = !selectedType || selectedType === 'all' || transaction.transactionType === selectedType

        return matchesSearch && matchesType
    })

    const getTransactionTypeColor = (type: string) => {
        switch (type) {
            case 'ISSUE': return 'bg-green-100 text-green-800'
            case 'TRANSFER': return 'bg-blue-100 text-blue-800'
            case 'REDEMPTION': return 'bg-red-100 text-red-800'
            case 'SPLIT': return 'bg-purple-100 text-purple-800'
            case 'CONSOLIDATION': return 'bg-orange-100 text-orange-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'ISSUE': return <TrendingUp className="h-3 w-3" />
            case 'TRANSFER': return <ArrowRightLeft className="h-3 w-3" />
            case 'REDEMPTION': return <TrendingDown className="h-3 w-3" />
            case 'SPLIT':
            case 'CONSOLIDATION': return <Repeat className="h-3 w-3" />
            default: return <ArrowRightLeft className="h-3 w-3" />
        }
    }

    const formatCurrency = (amount: string | undefined) => {
        if (!amount) return 'N/A'
        return `$${parseFloat(amount).toLocaleString()}`
    }

    const getTransactionsByType = (type: string) => {
        return transactions.filter(t => t.transactionType === type)
    }

    if (!selectedEntity) {
        return (
            <MainLayout>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ArrowRightLeft className="h-5 w-5" />
                            Transactions
                        </CardTitle>
                        <CardDescription>
                            Please select an entity to view transactions.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </MainLayout>
        )
    }

    return (
        <MainLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
                        <p className="text-muted-foreground">
                            Manage securities transactions, issuance, and transfers for {selectedEntity.name}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/registry/transactions/bulk">
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                Bulk Transactions
                            </Button>
                        </Link>
                        <Link href="/registry/transactions/new">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                New Transaction
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Overview Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{transactions.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Issuances</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {getTransactionsByType('ISSUE').length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Transfers</CardTitle>
                            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {getTransactionsByType('TRANSFER').length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Redemptions</CardTitle>
                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {getTransactionsByType('REDEMPTION').length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Search & Filter Transactions</CardTitle>
                        <CardDescription>
                            Find transactions by reference, description, security, or member
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                            <div className="flex items-center space-x-2 flex-1">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search transactions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="max-w-sm"
                                />
                            </div>
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="All types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All types</SelectItem>
                                    <SelectItem value="ISSUE">Issuance</SelectItem>
                                    <SelectItem value="TRANSFER">Transfer</SelectItem>
                                    <SelectItem value="REDEMPTION">Redemption</SelectItem>
                                    <SelectItem value="SPLIT">Split</SelectItem>
                                    <SelectItem value="CONSOLIDATION">Consolidation</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Transactions Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Transaction History ({filteredTransactions.length})</CardTitle>
                        <CardDescription>
                            Complete record of all securities transactions for {selectedEntity.name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {searchTerm || (selectedType && selectedType !== 'all') ? 'No transactions found matching your criteria.' : 'No transactions yet. Create your first transaction to get started!'}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Transaction</TableHead>
                                            <TableHead>Security</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>From</TableHead>
                                            <TableHead>To</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="w-[100px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTransactions.map((transaction) => (
                                            <TableRow key={transaction.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 bg-primary/10 rounded-md flex items-center justify-center">
                                                            {getTransactionIcon(transaction.transactionType)}
                                                        </div>
                                                        <div>
                                                            <Badge className={getTransactionTypeColor(transaction.transactionType)}>
                                                                {transaction.transactionType}
                                                            </Badge>
                                                            {transaction.reference && (
                                                                <div className="text-xs text-muted-foreground font-mono mt-1">
                                                                    {transaction.reference}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        {transaction.security?.symbol && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {transaction.security?.symbol}
                                                            </Badge>
                                                        )}
                                                        <div className="font-medium">{transaction.security?.name || transaction.securityClassId}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-mono font-medium">
                                                        {transaction.quantity.toLocaleString()}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {transaction.amountPaidPerSecurity && (
                                                            <div>@{formatCurrency(transaction.amountPaidPerSecurity.toString())}</div>
                                                        )}
                                                        {transaction.amountPaidPerSecurity && transaction.quantity && (
                                                            <div className="font-medium">{formatCurrency((transaction.amountPaidPerSecurity * transaction.quantity).toString())}</div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">
                                                        {formatMemberName(transaction.fromMember)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">
                                                        {formatMemberName(transaction.toMember)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">
                                                        {new Date(transaction.transactionDate).toLocaleDateString()}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Link href={`/registry/transactions/${transaction.id}`}>
                                                        <Button variant="outline" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
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