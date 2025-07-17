'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

const currencies = ['AUD', 'USD', 'EUR', 'GBP', 'NZD']

const securityFormSchema = z.object({
  entityId: z.string().min(1, 'Entity is required'),
  name: z.string().min(1, 'Security class name is required').max(100, 'Name must be less than 100 characters'),
  symbol: z.string().optional(),
  description: z.string().optional(),
  votingRights: z.boolean(),
  dividendRights: z.boolean(),
  parValue: z.string().optional().refine((val) => !val || !isNaN(parseFloat(val)), 'Par value must be a valid number'),
  currency: z.string()
})

type SecurityFormValues = z.infer<typeof securityFormSchema>

interface Entity {
  id: string
  name: string
}

interface SecurityFormProps {
  entities: Entity[]
  security?: any
  onSaved: () => void
}

export function SecurityForm({ entities, security, onSaved }: SecurityFormProps) {
  const [loading, setLoading] = useState(false)
  
  const form = useForm<SecurityFormValues>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      entityId: security?.entity?.id || '',
      name: security?.name || '',
      symbol: security?.symbol || '',
      description: security?.description || '',
      votingRights: security?.votingRights ?? true,
      dividendRights: security?.dividendRights ?? true,
      parValue: security?.parValue || '',
      currency: security?.currency || 'AUD'
    }
  })

  const onSubmit = async (values: SecurityFormValues) => {
    try {
      setLoading(true)
      
      const requestData = {
        ...values,
        parValue: values.parValue ? parseFloat(values.parValue) : undefined
      }

      const url = security ? `/api/securities/${security.id}` : '/api/securities'
      const method = security ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        onSaved()
      } else {
        form.setError('root', { message: result.error || 'Failed to save security class' })
      }
    } catch (error) {
      console.error('Error saving security class:', error)
      form.setError('root', { message: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>
          
          <FormField
            control={form.control}
            name="entityId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entity *</FormLabel>
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Security Class Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Ordinary Shares, Preference Shares" {...field} />
                </FormControl>
                <FormDescription>
                  The full name of this security class
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="symbol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Symbol/Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., ORD, PREF, OPT" {...field} />
                </FormControl>
                <FormDescription>
                  Optional short code or symbol for this security class
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the features and characteristics of this security class"
                    className="resize-none" 
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Optional detailed description of this security class
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Rights and Characteristics */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Rights and Characteristics</h3>
          
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="votingRights"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Voting Rights
                    </FormLabel>
                                      <FormDescription>
                    Whether holders of this security class have voting rights in entity decisions
                  </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dividendRights"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Dividend Rights
                    </FormLabel>
                    <FormDescription>
                      Whether holders of this security class are entitled to receive dividends
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Financial Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Financial Information</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="parValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Par Value</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.0001"
                      placeholder="1.0000" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    The nominal or face value per security
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The currency for par value and pricing
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Example Information */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Common Security Classes:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li><strong>Ordinary Shares:</strong> Standard shares with voting and dividend rights</li>
            <li><strong>Preference Shares:</strong> Priority for dividends, may have limited voting rights</li>
            <li><strong>Options:</strong> Rights to purchase shares at a specific price</li>
            <li><strong>Convertible Notes:</strong> Debt that can convert to equity</li>
          </ul>
        </div>

        {/* Error Display */}
        {form.formState.errors.root && (
          <div className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : security ? 'Update Security Class' : 'Create Security Class'}
          </Button>
        </div>
      </form>
    </Form>
  )
} 