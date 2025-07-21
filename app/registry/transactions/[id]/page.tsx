'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'

import { ArrowLeft, TrendingUp, TrendingDown, ArrowRightLeft, Building2, Calendar, Hash, FileText, User, Users, Copy, Check, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Transaction {
    id: string
    transactionType: string
    quantity: number
    amountPaidPerSecurity?: string
    amountUnpaidPerSecurity?: string
    transferPricePerSecurity?: string
    totalAmountPaid?: string
    totalAmountUnpaid?: string
    totalTransferAmount?: string
    transactionDate: string
    settlementDate?: string
    reference?: string
    description?: string
    certificateNumber?: string
    status: string
    entity: {
        id: string
        name: string
    }
    securityClass: {
        id: string
        name: string
        symbol?: string
    }
    fromMember?: {
        id: string
        firstName?: string
        lastName?: string
        entityName?: string
        memberType: string
    }
    toMember?: {
        id: string
        firstName?: string
        lastName?: string
        entityName?: string
        memberType: string
    }
}

export default function ViewTransactionPage() {
    const params = useParams()
    const router = useRouter()
    const [transaction, setTransaction] = useState<Transaction | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                setLoading(true)
                const response = await fetch(`/api/registry/transactions/${params.id}`)
                const result = await response.json()

                if (result.success) {
                    setTransaction(result.data)
                } else {
                    setError(result.error || 'Failed to fetch transaction')
                }
            } catch (error) {
                console.error('Error fetching transaction:', error)
                setError('An unexpected error occurred')
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            fetchTransaction()
        }
    }, [params.id])

    const formatMemberName = (member: Transaction['fromMember']) => {
        if (!member) return 'N/A'
        if (member.entityName) return member.entityName
        return `${member.firstName || ''} ${member.lastName || ''}`.trim()
    }

    const getTransactionTypeColor = (type: string) => {
        switch (type) {
            case 'ISSUE': return 'bg-green-100 text-green-800'
            case 'TRANSFER': return 'bg-blue-100 text-blue-800'
            case 'REDEMPTION': return 'bg-red-100 text-red-800'
            case 'CANCELLATION': return 'bg-gray-100 text-gray-800'
            case 'RETURN_OF_CAPITAL': return 'bg-orange-100 text-orange-800'
            case 'CAPITAL_CALL': return 'bg-purple-100 text-purple-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'ISSUE': return <TrendingUp className="h-4 w-4" />
            case 'TRANSFER': return <ArrowRightLeft className="h-4 w-4" />
            case 'REDEMPTION': return <TrendingDown className="h-4 w-4" />
            case 'CANCELLATION': return <TrendingDown className="h-4 w-4" />
            case 'RETURN_OF_CAPITAL': return <TrendingDown className="h-4 w-4" />
            case 'CAPITAL_CALL': return <TrendingUp className="h-4 w-4" />
            default: return <ArrowRightLeft className="h-4 w-4" />
        }
    }

    const formatCurrency = (amount: string | undefined) => {
        if (!amount) return 'N/A'
        return `$${parseFloat(amount).toLocaleString()}`
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy text: ', err)
        }
    }

    const handleDelete = async () => {
        if (!transaction) return

        try {
            setIsDeleting(true)
            const response = await fetch(`/api/registry/transactions/${transaction.id}`, {
                method: 'DELETE'
            })

            const result = await response.json()

            if (result.success) {
                router.push('/registry/transactions')
            } else {
                setError(result.error || 'Failed to delete transaction')
            }
        } catch (error) {
            console.error('Error deleting transaction:', error)
            setError('An unexpected error occurred while deleting the transaction')
        } finally {
            setIsDeleting(false)
        }
    }

    if (loading) {
        return (
            <MainLayout>
                <div className="space-y-8">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading transaction details...</p>
                    </div>
                </div>
            </MainLayout>
        )
    }

    if (error || !transaction) {
        return (
            <MainLayout>
                <div className="space-y-8">
                    <div className="text-center py-12">
                        <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-semibold text-muted-foreground mb-2">Transaction Not Found</h2>
                        <p className="text-muted-foreground mb-6">
                            {error || 'The transaction you are looking for could not be found.'}
                        </p>
                        <Button onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Go Back
                        </Button>
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
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Transaction Details</h1>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span>Transaction ID:</span>
                                <code className="px-2 bg-muted rounded text-sm font-mono">
                                    {transaction.id}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(transaction.id)}
                                    className="h-6 w-6 p-0"
                                >
                                    {copied ? (
                                        <Check className="h-3 w-3 text-green-600" />
                                    ) : (
                                        <Copy className="h-3 w-3" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className={getTransactionTypeColor(transaction.transactionType)}>
                            <div className="flex items-center gap-1">
                                {getTransactionIcon(transaction.transactionType)}
                                {transaction.transactionType}
                            </div>
                        </Badge>
                        <Badge variant="outline">{transaction.status}</Badge>

                        <Link href={`/registry/transactions/${transaction.id}/edit`}>
                            <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                            </Button>
                        </Link>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete this transaction? This action cannot be undone.
                                        <br /><br />
                                        To confirm deletion, please type <strong>permanently delete</strong> in the field below.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-4">
                                    <Input
                                        placeholder="Type 'permanently delete' to confirm"
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        disabled={deleteConfirmText !== 'permanently delete' || isDeleting}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete Transaction
                                            </>
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                {/* Transaction Overview */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Quantity</CardTitle>
                            <Hash className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{transaction.quantity.toLocaleString()}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {transaction.totalTransferAmount ? formatCurrency(transaction.totalTransferAmount) :
                                    transaction.totalAmountPaid ? formatCurrency(transaction.totalAmountPaid) : 'N/A'}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Transaction Date</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatDate(transaction.transactionDate)}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Transaction Details */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction Information</CardTitle>
                            <CardDescription>Basic details about this transaction</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Reference</label>
                                    <p className="text-sm">{transaction.reference || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Certificate Number</label>
                                    <p className="text-sm">{transaction.certificateNumber || 'N/A'}</p>
                                </div>
                            </div>

                            {transaction.description && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                                    <p className="text-sm">{transaction.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Transaction Date</label>
                                    <p className="text-sm">{formatDate(transaction.transactionDate)}</p>
                                </div>
                                {transaction.settlementDate && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Settlement Date</label>
                                        <p className="text-sm">{formatDate(transaction.settlementDate)}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Information</CardTitle>
                            <CardDescription>Details about the security class involved</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Security Class</label>
                                <p className="text-sm font-medium">{transaction.securityClass.name}</p>
                                {transaction.securityClass.symbol && (
                                    <p className="text-xs text-muted-foreground font-mono">{transaction.securityClass.symbol}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                                    <p className="text-sm font-mono">{transaction.quantity.toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <Badge variant="outline" className="text-xs">{transaction.status}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing Information</CardTitle>
                            <CardDescription>Financial details of the transaction</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {transaction.transactionType === 'ISSUE' ? (
                                <>
                                    {transaction.amountPaidPerSecurity && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Paid per Security</label>
                                                <p className="text-sm font-mono">{formatCurrency(transaction.amountPaidPerSecurity)}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Total Paid</label>
                                                <p className="text-sm font-mono">{formatCurrency(transaction.totalAmountPaid)}</p>
                                            </div>
                                        </div>
                                    )}

                                    {transaction.amountUnpaidPerSecurity && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Unpaid per Security</label>
                                                <p className="text-sm font-mono">{formatCurrency(transaction.amountUnpaidPerSecurity)}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Total Unpaid</label>
                                                <p className="text-sm font-mono">{formatCurrency(transaction.totalAmountUnpaid)}</p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                transaction.transferPricePerSecurity && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Price per Security</label>
                                            <p className="text-sm font-mono">{formatCurrency(transaction.transferPricePerSecurity)}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                                            <p className="text-sm font-mono">{formatCurrency(transaction.totalTransferAmount)}</p>
                                        </div>
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>

                    {/* Member Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Member Information</CardTitle>
                            <CardDescription>Parties involved in the transaction</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {transaction.fromMember && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        From Member
                                    </label>
                                    <p className="text-sm font-medium">{formatMemberName(transaction.fromMember)}</p>
                                    <p className="text-xs text-muted-foreground">{transaction.fromMember.memberType}</p>
                                </div>
                            )}

                            {transaction.toMember && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        To Member
                                    </label>
                                    <p className="text-sm font-medium">{formatMemberName(transaction.toMember)}</p>
                                    <p className="text-xs text-muted-foreground">{transaction.toMember.memberType}</p>
                                </div>
                            )}

                            {!transaction.fromMember && !transaction.toMember && (
                                <p className="text-sm text-muted-foreground">No members involved in this transaction</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                        <CardDescription>Available actions for this transaction</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => router.back()}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Transactions
                            </Button>
                            <Link href="/registry/transactions">
                                <Button variant="outline">
                                    View All Transactions
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    )
} 