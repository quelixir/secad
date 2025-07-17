'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Search, Edit, Trash2, Shield, Building2, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { SecurityForm } from './security-form'

interface SecurityClass {
  id: string
  name: string
  symbol?: string
  description?: string
  votingRights: boolean
  dividendRights: boolean
  parValue?: string
  currency: string
  isActive: boolean
  entity: {
    id: string
    name: string
  }
  _count: {
    holdings: number
    transactions: number
  }
}

interface Entity {
  id: string
  name: string
}

export default function SecuritiesPage() {
  const [securities, setSecurities] = useState<SecurityClass[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntity, setSelectedEntity] = useState<string>('all')
  const [editingSecurity, setEditingSecurity] = useState<SecurityClass | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const fetchSecurities = async () => {
    try {
      setLoading(true)
      const entityParam = selectedEntity && selectedEntity !== 'all' ? `?entityId=${selectedEntity}` : ''
      const response = await fetch(`/api/securities${entityParam}`)
      const result = await response.json()
      
      if (result.success) {
        setSecurities(result.data)
      } else {
        console.error('Failed to fetch securities:', result.error)
      }
    } catch (error) {
      console.error('Error fetching securities:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEntities = async () => {
    try {
      const response = await fetch('/api/entities')
      const result = await response.json()
      
      if (result.success) {
        setEntities(result.data)
      } else {
        console.error('Failed to fetch entities:', result.error)
      }
    } catch (error) {
      console.error('Error fetching entities:', error)
    }
  }

  useEffect(() => {
    fetchEntities()
    fetchSecurities()
  }, [selectedEntity])

  const handleDelete = async (security: SecurityClass) => {
    try {
      const response = await fetch(`/api/securities/${security.id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchSecurities() // Refresh the list
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error deleting security class:', error)
      alert('Failed to delete security class')
    }
  }

  const handleSecuritySaved = () => {
    setShowAddDialog(false)
    setEditingSecurity(null)
    fetchSecurities()
  }

  const filteredSecurities = securities.filter(security => {
    const searchLower = searchTerm.toLowerCase()
    
    return security.name.toLowerCase().includes(searchLower) ||
           security.symbol?.toLowerCase().includes(searchLower) ||
           security.description?.toLowerCase().includes(searchLower) ||
           security.entity.name.toLowerCase().includes(searchLower)
  })

  const formatCurrency = (amount: string | undefined, currency: string) => {
    if (!amount) return 'Not set'
    return `${currency} ${parseFloat(amount).toFixed(4)}`
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Securities</h1>
            <p className="text-muted-foreground">
              Manage security classes and types across all companies
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Security Class
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Security Class</DialogTitle>
                <DialogDescription>
                  Create a new type of security for an entity
                </DialogDescription>
              </DialogHeader>
              <SecurityForm entities={entities} onSaved={handleSecuritySaved} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter Securities</CardTitle>
            <CardDescription>
                              Find security classes by name, symbol, or entity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex items-center space-x-2 flex-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search securities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
                              <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All entities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All entities</SelectItem>
                  {entities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Securities Table */}
        <Card>
          <CardHeader>
            <CardTitle>Security Classes ({filteredSecurities.length})</CardTitle>
            <CardDescription>
              All security classes and types in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading securities...</div>
            ) : filteredSecurities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || (selectedEntity && selectedEntity !== 'all') ? 'No security classes found matching your criteria.' : 'No security classes yet. Add your first security class to get started!'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Security Class</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Rights</TableHead>
                      <TableHead>Par Value</TableHead>
                      <TableHead>Holdings</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSecurities.map((security) => (
                      <TableRow key={security.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-primary/10 rounded-md flex items-center justify-center">
                              <Shield className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{security.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {security.symbol && <span className="font-mono">{security.symbol}</span>}
                                {security.description && (
                                  <span className={security.symbol ? 'ml-2' : ''}>
                                    {security.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <Link 
                              href={`/entities/${security.entity.id}`}
                              className="text-sm hover:underline"
                            >
                              {security.entity.name}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {security.votingRights && (
                              <Badge variant="outline" className="text-xs">
                                Voting
                              </Badge>
                            )}
                            {security.dividendRights && (
                              <Badge variant="outline" className="text-xs">
                                Dividend
                              </Badge>
                            )}
                            {!security.votingRights && !security.dividendRights && (
                              <span className="text-xs text-muted-foreground">No rights</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono">
                            {formatCurrency(security.parValue, security.currency)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{security._count.holdings}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{security._count.transactions}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={security.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {security.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <Link href={`/securities/${security.id}`}>
                                View
                              </Link>
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingSecurity(security)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Edit Security Class</DialogTitle>
                                  <DialogDescription>
                                    Update security class information
                                  </DialogDescription>
                                </DialogHeader>
                                {editingSecurity && (
                                  <SecurityForm 
                                    entities={entities}
                                    security={editingSecurity} 
                                    onSaved={handleSecuritySaved} 
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Security Class</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{security.name}"? This action cannot be undone.
                                    You can only delete security classes with no holdings or transactions.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(security)}
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