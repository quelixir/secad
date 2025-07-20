'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Calendar, User, Copy } from 'lucide-react'
import { useEntity } from '@/lib/entity-context'
import { compliancePackRegistration } from '@/lib/compliance'

export default function IssuerPage() {
    const { selectedEntity } = useEntity()

    if (!selectedEntity) {
        return (
            <MainLayout>
                <div className="space-y-8">
                    <div className="text-center py-12">
                        <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-semibold text-muted-foreground mb-2">No Entity Selected</h2>
                        <p className="text-muted-foreground mb-6">
                            Please select an entity from the dropdown in the navigation bar to view issuer information.
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
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Issuer Dashboard</h1>
                    <p className="text-muted-foreground">
                        Overview and details for {selectedEntity.name}
                    </p>
                </div>

                {/* Entity Information */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Entity Information
                            </CardTitle>
                            <CardDescription>
                                Basic details about the issuing entity
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Entity Name</label>
                                <p className="text-lg font-semibold">{selectedEntity.name}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Entity Type</label>
                                <p className="text-sm">
                                    {compliancePackRegistration.getEntityType(
                                        selectedEntity.incorporationCountry || 'Australia',
                                        selectedEntity.entityTypeId
                                    )?.name || 'Not specified'}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-muted-foreground">Identifiers</label>
                                {selectedEntity.identifiers && selectedEntity.identifiers.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedEntity.identifiers.map((identifier: any, index: number) => {
                                            const formatted = compliancePackRegistration.formatIdentifier(
                                                identifier.country,
                                                identifier.type,
                                                identifier.value
                                            )
                                            return (
                                                <div key={index} className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">{identifier.type}:</span>
                                                    <span className="text-sm font-mono">{formatted}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No identifiers registered</p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Entity ID
                                </label>
                                <div className="flex items-center gap-2">
                                    <code className="text-sm bg-muted px-2 py-1 rounded">{selectedEntity.id}</code>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(selectedEntity.id)}
                                        className="p-1 hover:bg-muted rounded transition-colors"
                                        title="Copy Entity ID"
                                    >
                                        <Copy className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Registry Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Registry Summary
                            </CardTitle>
                            <CardDescription>
                                Quick overview of this entity&apos;s registry
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-muted/50 rounded-lg">
                                    <div className="text-2xl font-bold text-primary">-</div>
                                    <div className="text-sm text-muted-foreground">Total Members</div>
                                </div>
                                <div className="text-center p-4 bg-muted/50 rounded-lg">
                                    <div className="text-2xl font-bold text-primary">-</div>
                                    <div className="text-sm text-muted-foreground">Security Classes</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-muted/50 rounded-lg">
                                    <div className="text-2xl font-bold text-primary">-</div>
                                    <div className="text-sm text-muted-foreground">Total Securities</div>
                                </div>
                                <div className="text-center p-4 bg-muted/50 rounded-lg">
                                    <div className="text-2xl font-bold text-primary">-</div>
                                    <div className="text-sm text-muted-foreground">Transactions</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    )
} 