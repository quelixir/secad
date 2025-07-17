'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { TransactionType } from '@/lib/types'

const transactionFormSchema = z.object({
  entityId: z.string().min(1, 'Entity is required'),
  securityClassId: z.string().min(1, 'Security class is required'),
  type: z.string().min(1, 'Transaction type is required'),
  quantity: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, 'Quantity must be a positive number'),
  pricePerSecurity: z.string().optional().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), 'Price must be a valid positive number'),
  fromMemberId: z.string().optional(),
  toMemberId: z.string().optional(),
  transactionDate: z.string().optional(),
  reference: z.string().optional(),
  description: z.string().optional()
}).refine((data) => {
  // Validate based on transaction type
  if (data.type === 'ISSUE') {
    return data.toMemberId // Must have recipient for issuance
  } else if (data.type === 'TRANSFER') {
    return data.fromMemberId && data.toMemberId && data.fromMemberId !== data.toMemberId // Must have both members and they must be different
  } else if (data.type === 'REDEMPTION') {
    return data.fromMemberId // Must have member to redeem from
  }
  return true
}, {
  message: 'Invalid member selection for transaction type',
  path: ['toMemberId']
})

type TransactionFormValues = z.infer<typeof transactionFormSchema>

interface Entity {
  id: string
  name: string
}

interface SecurityClass {
  id: string
  name: string
  symbol?: string
  entityId: string
}

interface Member {
  id: string
  firstName?: string
  lastName?: string
  entityName?: string
  memberType: string
  entityId: string
}

interface TransactionFormProps {
  entities: Entity[]
  selectedEntity?: Entity
  onSaved: () => void
}

export function TransactionForm({ entities, selectedEntity, onSaved }: TransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [securities, setSecurities] = useState<SecurityClass[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loadingSecurities, setLoadingSecurities] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(false)
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      entityId: selectedEntity?.id || '',
      securityClassId: '',
      type: '',
      quantity: '',
      pricePerSecurity: '',
      fromMemberId: '',
      toMemberId: '',
      transactionDate: new Date().toISOString().split('T')[0],
      reference: '',
      description: ''
    }
  })

  const selectedEntityId = form.watch('entityId')
  const selectedType = form.watch('type')

  useEffect(() => {
    if (selectedEntityId) {
      fetchSecurities(selectedEntityId)
      fetchMembers(selectedEntityId)
    }
  }, [selectedEntityId])

  const fetchSecurities = async (entityId: string) => {
    try {
      setLoadingSecurities(true)
             const response = await fetch(`/api/securities?entityId=${entityId}`)
      const result = await response.json()
      
      if (result.success) {
        setSecurities(result.data)
      } else {
        console.error('Failed to fetch securities:', result.error)
      }
    } catch (error) {
      console.error('Error fetching securities:', error)
    } finally {
      setLoadingSecurities(false)
    }
  }

  const fetchMembers = async (entityId: string) => {
    try {
      setLoadingMembers(true)
             const response = await fetch(`/api/members?entityId=${entityId}`)
      const result = await response.json()
      
      if (result.success) {
        setMembers(result.data)
      } else {
        console.error('Failed to fetch members:', result.error)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoadingMembers(false)
    }
  }

  const formatMemberName = (member: Member) => {
    if (member.entityName) return `${member.entityName} (${member.memberType})`
    return `${member.firstName || ''} ${member.lastName || ''} (${member.memberType})`.trim()
  }

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      setLoading(true)
      
      const requestData = {
        ...values,
        quantity: parseInt(values.quantity),
        pricePerSecurity: values.pricePerSecurity ? parseFloat(values.pricePerSecurity) : undefined,
        transactionDate: values.transactionDate ? new Date(values.transactionDate).toISOString() : undefined,
        fromMemberId: values.fromMemberId || undefined,
        toMemberId: values.toMemberId || undefined
      }

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        onSaved()
      } else {
        form.setError('root', { message: result.error || 'Failed to create transaction' })
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
      form.setError('root', { message: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const getTransactionTypeDescription = (type: string) => {
    switch (type) {
      case 'ISSUE': return 'Issue new securities to a member'
      case 'TRANSFER': return 'Transfer securities between members'
      case 'REDEMPTION': return 'Redeem securities from a member'
      case 'SPLIT': return 'Split existing securities (increase quantity, reduce value)'
      case 'CONSOLIDATION': return 'Consolidate securities (reduce quantity, increase value)'
      default: return ''
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Transaction Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Transaction Details</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="entityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entity *</FormLabel>
                  {selectedEntity ? (
                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                      <span className="text-sm font-medium">{selectedEntity.name}</span>
                      <span className="text-xs text-muted-foreground">(Selected entity)</span>
                    </div>
                  ) : (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select entity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {entities.map((entity) => (
                          <SelectItem key={entity.id} value={entity.id}>
                            {entity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(TransactionType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedType && (
                    <FormDescription>
                      {getTransactionTypeDescription(selectedType)}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="securityClassId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Security Class *</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={!selectedEntityId || loadingSecurities}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue 
                        placeholder={
                          !selectedEntityId 
                            ? "Select entity first" 
                            : loadingSecurities 
                              ? "Loading securities..." 
                              : "Select security class"
                        } 
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {securities.map((security) => (
                      <SelectItem key={security.id} value={security.id}>
                        {security.name} {security.symbol && `(${security.symbol})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1"
                      placeholder="Enter quantity" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Number of securities to transact
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pricePerSecurity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per Security</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      placeholder="0.00" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Optional price per security
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Member Selection */}
        {selectedType && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Member Selection</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {(selectedType === 'TRANSFER' || selectedType === 'REDEMPTION') && (
                <FormField
                  control={form.control}
                  name="fromMemberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Member *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!selectedEntityId || loadingMembers}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue 
                              placeholder={
                                !selectedEntityId 
                                  ? "Select entity first" 
                                  : loadingMembers 
                                    ? "Loading members..." 
                                    : "Select member"
                              } 
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {members.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {formatMemberName(member)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(selectedType === 'ISSUE' || selectedType === 'TRANSFER') && (
                <FormField
                  control={form.control}
                  name="toMemberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Member *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!selectedEntityId || loadingMembers}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue 
                              placeholder={
                                !selectedEntityId 
                                  ? "Select entity first" 
                                  : loadingMembers 
                                    ? "Loading members..." 
                                    : "Select member"
                              } 
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {members.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {formatMemberName(member)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
        )}

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Additional Information</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="transactionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    Date when the transaction occurred
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., TXN-001, ISS-2024-001" {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional internal reference number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Optional description or notes about this transaction"
                    className="resize-none" 
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Error Display */}
        {form.formState.errors.root && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {form.formState.errors.root.message}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating Transaction...' : 'Create Transaction'}
          </Button>
        </div>
      </form>
    </Form>
  )
} 