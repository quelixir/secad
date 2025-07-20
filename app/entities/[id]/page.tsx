'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Building2, Users, Shield, FileText, Calendar, MapPin, Phone, Mail, Globe, Edit, Copy } from 'lucide-react'
import Link from 'next/link'
import { compliancePackRegistration } from '@/lib/compliance'

interface EntityIdentifier {
    id: string
    type: string
    value: string
    country: string
    isActive: boolean
}

interface Entity {
    id: string
    name: string
    entityType: string
    status: string
    incorporationDate?: string
    address?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
    email?: string
    phone?: string
    website?: string
    createdAt: string
    updatedAt: string
    identifiers?: EntityIdentifier[]
    _count?: {
        members: number
        securityClasses: number
        transactions: number
        associates: number
    }
}

export default function ViewEntityPage() {
    const params = useParams()
    const [entity, setEntity] = useState<Entity | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchEntity = async () => {
            try {
                setLoading(true)
                const response = await fetch(`/api/entities/${params.id}`)
                const result = await response.json()

                if (result.success) {
                    setEntity(result.data)
                } else {
                    setError(result.error || 'Failed to fetch entity')
                }
            } catch (error) {
                console.error('Error fetching entity:', error)
                setError('An unexpected error occurred')
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            fetchEntity()
        }
    }, [params.id])

    const formatIdentifierValue = (identifier: EntityIdentifier) => {
        return compliancePackRegistration.formatIdentifier(identifier.country, identifier.type, identifier.value)
    }

    const getIdentifierTypeName = (country: string, typeCode: string) => {
        const identifierType = compliancePackRegistration.getIdentifierType(country, typeCode)
        return identifierType?.name || typeCode
    }

    const getCountryName = (country: string) => {
        const pack = compliancePackRegistration.getByCountry(country)
        return pack?.country || country
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-800'
            case 'Inactive': return 'bg-yellow-100 text-yellow-800'
            case 'Dissolved': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-AU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const copyEntityId = async () => {
        if (entity) {
            try {
                await navigator.clipboard.writeText(entity.id)
                // You could add a toast notification here if you have a toast system
            } catch (error) {
                console.error('Failed to copy entity ID:', error)
            }
        }
    }

    if (loading) {
        return (
            <MainLayout>
                <div className="space-y-6">
                    <div className="text-center py-8 text-muted-foreground">Loading entity...</div>
                </div>
            </MainLayout>
        )
    }

    if (error || !entity) {
        return (
            <MainLayout>
                <div className="space-y-6">
                    <div className="text-center py-8">
                        <p className="text-destructive mb-4">{error || 'Entity not found'}</p>
                        <Button asChild>
                            <Link href="/entities">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Entities
                            </Link>
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
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/entities">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Entities
                        </Link>
                    </Button>
                    <Button size="sm" asChild>
                        <Link href={`/entities/${entity.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Entity
                        </Link>
                    </Button>
                </div>

                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{entity.name}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{entity.entityType}</Badge>
                        <Badge className={getStatusColor(entity.status)}>{entity.status}</Badge>
                    </div>
                </div>

                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="identifiers">Identifiers</TabsTrigger>
                        <TabsTrigger value="members">Members ({entity._count?.members || 0})</TabsTrigger>
                        <TabsTrigger value="securities">Securities ({entity._count?.securityClasses || 0})</TabsTrigger>
                        <TabsTrigger value="transactions">Transactions ({entity._count?.transactions || 0})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Basic Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        Basic Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Entity Type</span>
                                        <Badge variant="outline">{entity.entityType}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Status</span>
                                        <Badge className={getStatusColor(entity.status)}>{entity.status}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-muted-foreground">Entity ID</span>
                                        <div className="flex items-center gap-2">
                                            <code className="text-sm bg-muted px-2 py-1 rounded">{entity.id}</code>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={copyEntityId}
                                                className="h-6 w-6 p-0"
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    {entity.incorporationDate && (
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Incorporation Date</span>
                                            <span>{formatDate(entity.incorporationDate)}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Contact Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Contact Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {entity.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">{entity.email}</span>
                                        </div>
                                    )}
                                    {entity.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">{entity.phone}</span>
                                        </div>
                                    )}
                                    {entity.website && (
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-muted-foreground" />
                                            <a href={entity.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                                {entity.website}
                                            </a>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Address Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5" />
                                        Address
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {entity.address && (
                                        <div className="text-sm">{entity.address}</div>
                                    )}
                                    {(entity.city || entity.state || entity.postcode) && (
                                        <div className="text-sm text-muted-foreground">
                                            {[entity.city, entity.state, entity.postcode].filter(Boolean).join(', ')}
                                        </div>
                                    )}
                                    {entity.country && (
                                        <div className="text-sm text-muted-foreground">{entity.country}</div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Statistics */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Statistics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Members</span>
                                        <div className="flex items-center gap-1">
                                            <Users className="h-3 w-3 text-muted-foreground" />
                                            <span>{entity._count?.members || 0}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Securities</span>
                                        <div className="flex items-center gap-1">
                                            <Shield className="h-3 w-3 text-muted-foreground" />
                                            <span>{entity._count?.securityClasses || 0}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Transactions</span>
                                        <div className="flex items-center gap-1">
                                            <FileText className="h-3 w-3 text-muted-foreground" />
                                            <span>{entity._count?.transactions || 0}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="identifiers" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Entity Identifiers</CardTitle>
                                <CardDescription>
                                    Legal identifiers for this entity across different countries
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!entity.identifiers || entity.identifiers.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No identifiers registered for this entity.
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Country</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Value</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {entity.identifiers.map((identifier) => (
                                                <TableRow key={identifier.id}>
                                                    <TableCell>{getCountryName(identifier.country)}</TableCell>
                                                    <TableCell>{getIdentifierTypeName(identifier.country, identifier.type)}</TableCell>
                                                    <TableCell className="font-mono">{formatIdentifierValue(identifier)}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={identifier.isActive ? "default" : "secondary"}>
                                                            {identifier.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="members" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Members</CardTitle>
                                <CardDescription>
                                    Members associated with this entity
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-muted-foreground">
                                    Member management coming soon.
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="securities" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Securities</CardTitle>
                                <CardDescription>
                                    Security classes issued by this entity
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-muted-foreground">
                                    Securities management coming soon.
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="transactions" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Transactions</CardTitle>
                                <CardDescription>
                                    Transactions involving this entity
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-muted-foreground">
                                    Transaction history coming soon.
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    )
} 