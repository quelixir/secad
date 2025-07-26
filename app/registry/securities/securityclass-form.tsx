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
import type { Entity } from '@/lib/types/interfaces/Entity';

const securityFormSchema = z.object({
  entityId: z.string().min(1, 'Entity is required'),
  name: z.string().min(1, 'Security class name is required').max(100, 'Name must be less than 100 characters'),
  symbol: z.string().optional(),
  description: z.string().optional(),
  votingRights: z.boolean(),
  dividendRights: z.boolean()
})

type SecurityFormValues = z.infer<typeof securityFormSchema>

interface SecurityFormProps {
  entities: Entity[]
  selectedEntity?: Entity
  security?: any
  onSaved: () => void
}

export function SecurityForm({ entities, selectedEntity, security: securityClass, onSaved }: SecurityFormProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<SecurityFormValues>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      entityId: securityClass?.entity?.id || selectedEntity?.id || '',
      name: securityClass?.name || '',
      symbol: securityClass?.symbol || '',
      description: securityClass?.description || '',
      votingRights: securityClass?.votingRights ?? true,
      dividendRights: securityClass?.dividendRights ?? true
    }
  })

  const onSubmit = async (values: SecurityFormValues) => {
    try {
      setLoading(true)

      const url = securityClass ? `/api/registry/securities/${securityClass.id}` : '/api/registry/securities'
      const method = securityClass ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
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
    <div className="max-h-[80vh] overflow-y-auto px-1">
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
                  {selectedEntity && !securityClass ? (
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

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Predefined Suggestions */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium mb-3 text-sm">Common Security Class Suggestions:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    form.setValue('name', 'Ordinary Shares')
                    form.setValue('symbol', 'ORD')
                  }}
                  className="text-left p-3 bg-background border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium text-sm">Ordinary Shares</div>
                  <div className="text-xs text-muted-foreground">Symbol: ORD</div>
                  <div className="text-xs text-muted-foreground mt-1">Standard shares with voting and dividend rights</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    form.setValue('name', 'Preference Shares')
                    form.setValue('symbol', 'PREF')
                  }}
                  className="text-left p-3 bg-background border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium text-sm">Preference Shares</div>
                  <div className="text-xs text-muted-foreground">Symbol: PREF</div>
                  <div className="text-xs text-muted-foreground mt-1">Priority for dividends, may have limited voting rights</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    form.setValue('name', 'A Class Shares')
                    form.setValue('symbol', 'A')
                  }}
                  className="text-left p-3 bg-background border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium text-sm">A Class Shares</div>
                  <div className="text-xs text-muted-foreground">Symbol: A</div>
                  <div className="text-xs text-muted-foreground mt-1">Class A shares with specific rights and restrictions</div>
                </button>
              </div>
            </div>

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

            <div className="grid grid-cols-2 gap-6">
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


          {/* Error Display */}
          {form.formState.errors.root && (
            <div className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : securityClass ? 'Update Security Class' : 'Create Security Class'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 