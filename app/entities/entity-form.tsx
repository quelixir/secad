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
import { EntityType, AustralianStates } from '@/lib/types'

const entityFormSchema = z.object({
  name: z.string().min(1, 'Entity name is required').max(100, 'Entity name must be less than 100 characters'),
  abn: z.string().optional().refine((val) => !val || /^\d{11}$/.test(val), 'ABN must be 11 digits'),
  acn: z.string().optional().refine((val) => !val || /^\d{9}$/.test(val), 'ACN must be 9 digits'),
  entityType: z.string().min(1, 'Entity type is required'),
  incorporationDate: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional().refine((val) => !val || /^\d{4}$/.test(val), 'Postcode must be 4 digits'),
  country: z.string().optional(),
  email: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, 'Invalid email format'),
  phone: z.string().optional(),
  website: z.string().optional().refine((val) => !val || z.string().url().safeParse(val).success, 'Invalid website URL')
})

type EntityFormValues = z.infer<typeof entityFormSchema>

interface EntityFormProps {
  entity?: any
  onSaved: () => void
}

export function EntityForm({ entity, onSaved }: EntityFormProps) {
  const [loading, setLoading] = useState(false)
  
  const form = useForm<EntityFormValues>({
    resolver: zodResolver(entityFormSchema),
    defaultValues: {
      name: entity?.name || '',
      abn: entity?.abn || '',
      acn: entity?.acn || '',
      entityType: entity?.entityType || '',
      incorporationDate: entity?.incorporationDate ? entity.incorporationDate.split('T')[0] : '',
      address: entity?.address || '',
      city: entity?.city || '',
      state: entity?.state || '',
      postcode: entity?.postcode || '',
      country: entity?.country || 'Australia',
      email: entity?.email || '',
      phone: entity?.phone || '',
      website: entity?.website || ''
    }
  })

  const onSubmit = async (values: EntityFormValues) => {
    try {
      setLoading(true)
      
      const requestData = {
        ...values,
        incorporationDate: values.incorporationDate ? new Date(values.incorporationDate).toISOString() : undefined
      }

      const url = entity ? `/api/entities/${entity.id}` : '/api/entities'
      const method = entity ? 'PUT' : 'POST'
      
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
        form.setError('root', { message: result.error || 'Failed to save entity' })
      }
    } catch (error) {
      console.error('Error saving entity:', error)
      form.setError('root', { message: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Entity Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Entity Information</h3>
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entity Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter entity name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="entityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entity Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select entity type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(EntityType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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
              name="incorporationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incorporation Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="abn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ABN</FormLabel>
                  <FormControl>
                    <Input placeholder="12345678901" maxLength={11} {...field} />
                  </FormControl>
                  <FormDescription>11-digit Australian Business Number</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ACN</FormLabel>
                  <FormControl>
                    <Input placeholder="123456789" maxLength={9} {...field} />
                  </FormControl>
                  <FormDescription>9-digit Australian Company Number</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Address Information</h3>
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter street address"
                    className="resize-none" 
                    rows={2}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Sydney" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(AustralianStates).map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
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
              name="postcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postcode</FormLabel>
                  <FormControl>
                    <Input placeholder="2000" maxLength={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="Australia" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Contact Information</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contact@entity.com.au" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+61 2 9876 5432" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                                  <FormControl>
                    <Input placeholder="https://www.entity.com.au" {...field} />
                  </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
            {loading ? 'Saving...' : entity ? 'Update Entity' : 'Create Entity'}
          </Button>
        </div>
      </form>
    </Form>
  )
} 