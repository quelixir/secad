'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2 } from 'lucide-react'
import { TransactionForm } from '../../transaction-form'
import { useEntity } from '@/lib/entity-context'
import type { TransactionWithRelations } from '@/lib/types/interfaces/Transaction';

export default function EditTransactionPage() {
    const params = useParams()
    const router = useRouter()
    const { selectedEntity, entities } = useEntity()
    const [transaction, setTransaction] = useState<TransactionWithRelations | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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

    const handleTransactionSaved = () => {
        // Navigate back to the transaction view page
        router.push(`/registry/transactions/${params.id}`)
    }

    const handleCancel = () => {
        // Navigate back to the transaction view page
        router.push(`/registry/transactions/${params.id}`)
    }

    if (!selectedEntity) {
        return (
            <MainLayout>
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Transaction</CardTitle>
                        <CardDescription>
                            Please select an entity to edit a transaction.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">
                                Please select an entity to edit a transaction.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </MainLayout>
        )
    }

    if (loading) {
        return (
            <MainLayout>
                <div className="space-y-6">
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
                <div className="space-y-6">
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
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Transaction
                    </Button>
                </div>

                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Transaction</h1>
                    <p className="text-muted-foreground">
                        Update transaction details for {selectedEntity.name}
                    </p>
                </div>

                {/* Transaction Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Transaction Details</CardTitle>
                        <CardDescription>
                            Update the details for this transaction
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TransactionForm
                            selectedEntity={selectedEntity}
                            transaction={transaction}
                            onSaved={handleTransactionSaved}
                        />
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    )
} 