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
import { MemberType } from '@/lib/types'
import { CountrySelect } from '@/components/ui/country-select'
import { StateSelect } from '@/components/ui/state-select'

const memberFormSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  entityName: z.string().optional(),
  memberType: z.string().min(1, 'Member type is required'),
  designation: z.string().optional(),
  beneficiallyHeld: z.boolean(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional().refine((val) => !val || /^\d{4}$/.test(val), 'Postcode must be 4 digits'),
  country: z.string().optional(),
  memberNumber: z.string().optional(),
  tfn: z.string().optional(),
  abn: z.string().optional(),
  entityId: z.string().min(1, 'Entity is required'),
}).refine((data) => {
  if (data.memberType === 'Individual') {
    return data.firstName && data.lastName
  } else {
    return data.entityName
  }
}, {
  message: 'For individuals, given names and last name are required. For other types, entity name is required.',
  path: ['firstName']
})

type MemberFormValues = z.infer<typeof memberFormSchema>

interface Entity {
  id: string
  name: string
}

interface MemberFormProps {
  entities: Entity[]
  selectedEntity?: Entity
  member?: any
  onSaved: () => void
}

export function MemberForm({ entities, selectedEntity, member, onSaved }: MemberFormProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      firstName: member?.firstName || '',
      lastName: member?.lastName || '',
      entityName: member?.entityName || '',
      memberType: member?.memberType || '',
      designation: member?.designation || '',
      beneficiallyHeld: member?.beneficiallyHeld ?? true,
      email: member?.email || '',
      phone: member?.phone || '',
      address: member?.address || '',
      city: member?.city || '',
      state: member?.state || '',
      postcode: member?.postcode || '',
      country: member?.country || 'Australia',
      memberNumber: member?.memberNumber || '',
      tfn: member?.tfn || '',
      abn: member?.abn || '',
      entityId: member?.entityId || selectedEntity?.id || ''
    }
  })

  const selectedMemberType = form.watch('memberType')
  const selectedCountry = form.watch('country')

  const onSubmit = async (values: MemberFormValues) => {
    try {
      setLoading(true)

      const url = member ? `/api/registry/members/${member.id}` : '/api/registry/members'
      const method = member ? 'PUT' : 'POST'

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
        form.setError('root', { message: result.error || 'Failed to save member' })
      }
    } catch (error) {
      console.error('Error saving member:', error)
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entity *</FormLabel>
                    {selectedEntity && !member ? (
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
                name="memberType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select member type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(MemberType).map((type) => (
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
            </div>

            <FormField
              control={form.control}
              name="memberNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 001, M001" {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional internal member identification number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Personal/Entity Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {selectedMemberType === 'Individual' ? 'Personal Details' : 'Entity Details'}
            </h3>

            {selectedMemberType === 'Individual' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Given Names *</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., <SMITH FAMILY S/F A/C>" {...field} />
                      </FormControl>
                      <FormDescription>
                        Account designation for non-beneficial holdings (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="beneficiallyHeld"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Beneficially Held</FormLabel>
                        <FormDescription>
                          Check if the member holds these securities for their own benefit
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="entityName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entity Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC Pty Ltd" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., <SMITH FAMILY S/F A/C>" {...field} />
                      </FormControl>
                      <FormDescription>
                        Account designation for non-beneficial holdings (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="beneficiallyHeld"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Beneficially Held</FormLabel>
                        <FormDescription>
                          Check if the member holds these securities for their own benefit
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </>
            )}
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
                      <Input type="email" placeholder="john@example.com" {...field} />
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
                      <Input placeholder="+61 400 000 000" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <StateSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select state..."
                        selectedCountry={selectedCountry}
                      />
                    </FormControl>
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
                    <CountrySelect
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select country..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Tax Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tax Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tfn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TFN</FormLabel>
                    <FormControl>
                      <Input placeholder="123456789" maxLength={9} {...field} />
                    </FormControl>
                    <FormDescription>9-digit Tax File Number</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedMemberType !== 'Individual' && (
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
              )}
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
              {loading ? 'Saving...' : member ? 'Update Member' : 'Create Member'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 