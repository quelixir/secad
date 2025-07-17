'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, ArrowRightLeft, TrendingUp, TrendingDown, Repeat } from 'lucide-react'
import { TransactionForm } from '../transactions/transaction-form'
import { useEntity } from '@/lib/entity-context'

interface Transaction {
  id: string
  type: string
  quantity: number
  pricePerSecurity?: string
  totalAmount?: string
  transactionDate: string
  reference?: string
  description?: string
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

export function TransactionsTab() {
  const { selectedEntity, entities } = useEntity()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)

  const fetchTransactions = useCallback(async () => {
    if (!selectedEntity) {
      setTransactions([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/transactions?entityId=${selectedEntity.id}`)
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
  }, [selectedEntity])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleFormSuccess = async () => {
    setShowAddDialog(false)
    await fetchTransactions()
  }

  const filteredTransactions = transactions.filter(transaction => {
    // Type filter
    if (typeFilter !== 'all' && transaction.type !== typeFilter) {
      return false
    }

    // Search filter
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    const fromMemberName = transaction.fromMember?.memberType === 'INDIVIDUAL'
      ? `${transaction.fromMember?.firstName} ${transaction.fromMember?.lastName}`
      : transaction.fromMember?.entityName || ''
    const toMemberName = transaction.toMember?.memberType === 'INDIVIDUAL'
      ? `${transaction.toMember?.firstName} ${transaction.toMember?.lastName}`
      : transaction.toMember?.entityName || ''
    
    return transaction.securityClass.name.toLowerCase().includes(searchLower) ||
           (transaction.securityClass.symbol || '').toLowerCase().includes(searchLower) ||
           fromMemberName.toLowerCase().includes(searchLower) ||
           toMemberName.toLowerCase().includes(searchLower) ||
           (transaction.reference || '').toLowerCase().includes(searchLower) ||
           (transaction.description || '').toLowerCase().includes(searchLower)
  })

  // Calculate statistics
  const totalTransactions = transactions.length
  const totalVolume = transactions.reduce((sum, tx) => sum + tx.quantity, 0)
  const totalValue = transactions.reduce((sum, tx) => {
    if (tx.pricePerSecurity) {
      return sum + (parseFloat(tx.pricePerSecurity) * tx.quantity)
    }
    return sum
  }, 0)

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'ISSUE':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'REDEMPTION':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'TRANSFER':
        return <Repeat className="h-4 w-4 text-blue-500" />
      default:
        return <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTransactionBadgeVariant = (type: string) => {
    switch (type) {
      case 'ISSUE':
        return 'default'
      case 'REDEMPTION':
        return 'destructive'
      case 'TRANSFER':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (!selectedEntity) {
    return (
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
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Transactions
              </CardTitle>
              <CardDescription>
                Manage securities transactions for {selectedEntity.name}
              </CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Record Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Record New Transaction</DialogTitle>
                  <DialogDescription>
                    Record a new securities transaction for {selectedEntity.name}.
                  </DialogDescription>
                </DialogHeader>
                <TransactionForm 
                  entities={entities.filter(e => e.id === selectedEntity.id)}
                  selectedEntity={selectedEntity}
                  onSaved={handleFormSuccess}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold">{totalTransactions}</div>
              <div className="text-sm text-muted-foreground">Total Transactions</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold">{totalVolume.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Securities Volume</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Transaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ISSUE">Issue</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
                <SelectItem value="REDEMPTION">Redemption</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Security</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Loading transactions...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="text-muted-foreground">
                    {searchTerm || typeFilter !== 'all' 
                      ? 'No transactions found matching the filters.' 
                      : 'No transactions found for this entity.'
                    }
                  </div>
                  {!searchTerm && typeFilter === 'all' && (
                    <Button 
                      variant="outline" 
                      className="mt-2" 
                      onClick={() => setShowAddDialog(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Record First Transaction
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(transaction.type)}
                      <Badge variant={getTransactionBadgeVariant(transaction.type)}>
                        {transaction.type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{transaction.securityClass.name}</div>
                      {transaction.securityClass.symbol && (
                        <div className="text-sm text-muted-foreground">
                          {transaction.securityClass.symbol}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.fromMember ? (
                      <div className="text-sm">
                        <div>
                          {transaction.fromMember.memberType === 'INDIVIDUAL'
                            ? `${transaction.fromMember.firstName} ${transaction.fromMember.lastName}`
                            : transaction.fromMember.entityName
                          }
                        </div>
                        <div className="text-muted-foreground">
                          {transaction.fromMember.memberType}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {transaction.toMember ? (
                      <div className="text-sm">
                        <div>
                          {transaction.toMember.memberType === 'INDIVIDUAL'
                            ? `${transaction.toMember.firstName} ${transaction.toMember.lastName}`
                            : transaction.toMember.entityName
                          }
                        </div>
                        <div className="text-muted-foreground">
                          {transaction.toMember.memberType}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {transaction.quantity.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.pricePerSecurity ? (
                      <span>${parseFloat(transaction.pricePerSecurity).toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {transaction.totalAmount ? (
                      <span className="font-medium">
                        ${parseFloat(transaction.totalAmount).toFixed(2)}
                      </span>
                    ) : transaction.pricePerSecurity ? (
                      <span className="font-medium">
                        ${(parseFloat(transaction.pricePerSecurity) * transaction.quantity).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(transaction.transactionDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm max-w-[150px] truncate">
                      {transaction.reference || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
} 