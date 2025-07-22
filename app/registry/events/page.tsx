'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
    FileText,
    Download,
    Filter,
    Calendar,
    User,
    Database,
    Activity
} from 'lucide-react'
import { useEntity } from '@/lib/entity-context'
import { useEffect, useState } from 'react'

interface EventLog {
    id: string
    entityId: string
    userId: string
    action: string
    tableName: string
    recordId: string
    fieldName?: string
    oldValue?: any
    newValue?: any
    metadata?: any
    timestamp: string
    entity: {
        name: string
    }
}

interface EventLogResponse {
    logs: EventLog[]
    total: number
    hasMore: boolean
}

export default function EventsPage() {
    const { selectedEntity } = useEntity()
    const [events, setEvents] = useState<EventLog[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [offset, setOffset] = useState(0)
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        userId: '',
        tableName: '',
        recordId: '',
        action: '',
    })

    useEffect(() => {
        if (selectedEntity) {
            fetchEventLogs()
        } else {
            setEvents([])
            setLoading(false)
        }
    }, [selectedEntity, offset, filters])

    const fetchEventLogs = async () => {
        if (!selectedEntity) return

        try {
            setLoading(true)
            const params = new URLSearchParams({
                entityId: selectedEntity.id,
                limit: '50',
                offset: offset.toString(),
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, value]) => value !== '')
                ),
            })

            const response = await fetch(`/api/registry/events?${params}`)
            const result = await response.json()

            if (result.success) {
                const data: EventLogResponse = result.data
                setEvents(data.logs)
                setTotal(data.total)
                setHasMore(data.hasMore)
            } else {
                console.error('Failed to fetch event logs:', result.error)
            }
        } catch (error) {
            console.error('Error fetching event logs:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async () => {
        if (!selectedEntity) return

        try {
            const params = new URLSearchParams({
                entityId: selectedEntity.id,
                export: 'csv',
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, value]) => value !== '')
                ),
            })

            const response = await fetch(`/api/registry/events?${params}`)
            const blob = await response.blob()

            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `audit-log-${selectedEntity.id}-${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Error exporting event logs:', error)
        }
    }

    const resetFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            userId: '',
            tableName: '',
            recordId: '',
            action: '',
        })
        setOffset(0)
    }

    const formatValue = (value: any): string => {
        if (value === null || value === undefined) return '-'
        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2)
        }
        return String(value)
    }

    const getActionColor = (action: string): string => {
        switch (action) {
            case 'CREATE':
                return 'bg-green-100 text-green-800'
            case 'UPDATE':
                return 'bg-blue-100 text-blue-800'
            case 'DELETE':
                return 'bg-red-100 text-red-800'
            case 'ARCHIVE':
                return 'bg-yellow-100 text-yellow-800'
            case 'UNARCHIVE':
                return 'bg-purple-100 text-purple-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    if (!selectedEntity) {
        return (
            <MainLayout>
                <div className="space-y-8">
                    <div className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-semibold text-muted-foreground mb-2">No Entity Selected</h2>
                        <p className="text-muted-foreground mb-6">
                            Please select an entity from the dropdown in the navigation bar to view event logs.
                        </p>
                    </div>
                </div>
            </MainLayout>
        )
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Event Log</h1>
                    <p className="text-muted-foreground">
                        Audit trail of all registry changes for {selectedEntity.name}
                    </p>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters
                        </CardTitle>
                        <CardDescription>
                            Filter event logs by various criteria
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium">Start Date</label>
                                <Input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">End Date</label>
                                <Input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">User ID</label>
                                <Input
                                    placeholder="Filter by user"
                                    value={filters.userId}
                                    onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Table</label>
                                <Select value={filters.tableName} onValueChange={(value) => setFilters({ ...filters, tableName: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All tables" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All tables</SelectItem>
                                        <SelectItem value="Member">Member</SelectItem>
                                        <SelectItem value="SecurityClass">Security Class</SelectItem>
                                        <SelectItem value="Transaction">Transaction</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Action</label>
                                <Select value={filters.action} onValueChange={(value) => setFilters({ ...filters, action: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All actions" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All actions</SelectItem>
                                        <SelectItem value="CREATE">Create</SelectItem>
                                        <SelectItem value="UPDATE">Update</SelectItem>
                                        <SelectItem value="DELETE">Delete</SelectItem>
                                        <SelectItem value="ARCHIVE">Archive</SelectItem>
                                        <SelectItem value="UNARCHIVE">Unarchive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Record ID</label>
                                <Input
                                    placeholder="Filter by record ID"
                                    value={filters.recordId}
                                    onChange={(e) => setFilters({ ...filters, recordId: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <Button onClick={resetFilters} variant="outline">
                                Reset Filters
                            </Button>
                            <Button onClick={handleExport} variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Event Log Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    Event Log
                                </CardTitle>
                                <CardDescription>
                                    {total} total events found
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Table</TableHead>
                                    <TableHead>Record ID</TableHead>
                                    <TableHead>Field</TableHead>
                                    <TableHead>Old Value</TableHead>
                                    <TableHead>New Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                                Loading event logs...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : events.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            <div className="text-muted-foreground">
                                                No event logs found matching the current filters.
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    events.map((event) => (
                                        <TableRow key={event.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {new Date(event.timestamp).toLocaleString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    {event.userId}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getActionColor(event.action)}>
                                                    {event.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Database className="h-4 w-4 text-muted-foreground" />
                                                    {event.tableName}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                                    {event.recordId.substring(0, 8)}...
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                {event.fieldName || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-xs truncate" title={formatValue(event.oldValue)}>
                                                    {formatValue(event.oldValue)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-xs truncate" title={formatValue(event.newValue)}>
                                                    {formatValue(event.newValue)}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {events.length > 0 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {offset + 1} to {offset + events.length} of {total} events
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={offset === 0}
                                        onClick={() => setOffset(Math.max(0, offset - 50))}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!hasMore}
                                        onClick={() => setOffset(offset + 50)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    )
} 