'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { BulkTransactionForm } from '../bulk-transaction-form'
import { useEntity } from '@/lib/entity-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function BulkTransactionsPage() {
    const { selectedEntity } = useEntity()

    const handleSaved = () => {
        // Redirect back to transactions page after successful creation
        window.location.href = '/registry/transactions'
    }

    if (!selectedEntity) {
        return (
            <MainLayout>
                <Card>
                    <CardHeader>
                        <CardTitle>Bulk Transactions</CardTitle>
                        <CardDescription>
                            Please select an entity to create bulk transactions.
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
                <div className="flex items-center gap-4">
                    <Link href="/registry/transactions">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Transactions
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Bulk Transactions</h1>
                        <p className="text-muted-foreground">
                            Create multiple transactions at once for {selectedEntity.name}
                        </p>
                    </div>
                </div>

                {/* Form */}
                <BulkTransactionForm selectedEntity={selectedEntity} onSaved={handleSaved} />
            </div>
        </MainLayout>
    )
} 