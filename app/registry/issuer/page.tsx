'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Calendar, User } from 'lucide-react'
import { useEntity } from '@/lib/entity-context'

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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Entity Type</label>
                                    <p className="text-sm">{selectedEntity.entityType || 'Not specified'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <Badge variant="default" className="text-xs">Active</Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">ACN</label>
                                    <p className="text-sm font-mono">{selectedEntity.acn || 'Not specified'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">ABN</label>
                                    <p className="text-sm font-mono">{selectedEntity.abn || 'Not specified'}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Entity ID
                                </label>
                                <p className="text-sm font-mono">{selectedEntity.id}</p>
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