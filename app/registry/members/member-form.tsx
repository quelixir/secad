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
import { MemberType } from '@/lib/types'
import { Entity } from '@/lib/types/interfaces'
import { CountrySelect } from '@/components/ui/country-select'
import { StateSelect } from '@/components/ui/state-select'

const jointPersonSchema = z.object({
  givenNames: z.string().optional(),
  familyName: z.string().optional(),
  entityName: z.string().optional(),
  order: z.number(),
}).refine((data) => {
  // Either individual names OR entity name must be provided
  return (data.givenNames && data.familyName) || data.entityName;
}, {
  message: 'Either individual names (given names and family name) or entity name is required',
  path: ['givenNames']
});

const memberFormSchema = z.object({
  givenNames: z.string().optional(),
  familyName: z.string().optional(),
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
  jointPersons: z.array(jointPersonSchema).optional(),
}).refine((data) => {
  if (data.memberType === MemberType.INDIVIDUAL) {
    return data.givenNames && data.familyName
  } else if (data.memberType === MemberType.JOINT) {
    // Joint members require at least 2 persons
    return data.jointPersons && data.jointPersons.length >= 2
  } else {
    return data.entityName
  }
}, {
  message: 'For individuals, given names and family name are required. For joint members, at least 2 persons are required. For other types, entity name is required.',
  path: ['givenNames']
})

type MemberFormValues = z.infer<typeof memberFormSchema>

interface MemberFormProps {
  entities: Entity[]
  selectedEntity?: Entity
  member?: any
  onSaved: () => void
  disableScroll?: boolean
}

export function MemberForm({ entities, selectedEntity, member, onSaved, disableScroll = false }: MemberFormProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      givenNames: member?.givenNames || '',
      familyName: member?.familyName || '',
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
      entityId: member?.entityId || selectedEntity?.id || '',
      jointPersons: member?.jointPersons || []
    }
  })

  const selectedMemberType = form.watch('memberType')
  const selectedCountry = form.watch('country')

  // Initialize joint persons when member type is set to Joint
  useEffect(() => {
    if (selectedMemberType === MemberType.JOINT) {
      const currentPersons = form.getValues('jointPersons') || [];
      if (currentPersons.length === 0) {
        // Initialize with 2 empty persons
        form.setValue('jointPersons', [
          { givenNames: '', familyName: '', entityName: '', order: 0 },
          { givenNames: '', familyName: '', entityName: '', order: 1 }
        ]);
      }
    }
  }, [selectedMemberType, form]);

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
    <div className={`${disableScroll ? '' : 'max-h-[80vh] overflow-y-auto'} px-1`}>
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
              {selectedMemberType === MemberType.INDIVIDUAL ? 'Personal Details' :
                selectedMemberType === MemberType.JOINT ? 'Joint Member Details' : 'Entity Details'}
            </h3>

            {selectedMemberType === MemberType.INDIVIDUAL ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="givenNames"
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
                    name="familyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Family Name *</FormLabel>
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
            ) : selectedMemberType === MemberType.JOINT ? (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Joint Members</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentPersons = form.getValues('jointPersons') || [];
                        form.setValue('jointPersons', [
                          ...currentPersons,
                          {
                            givenNames: '',
                            familyName: '',
                            entityName: '',
                            order: currentPersons.length
                          }
                        ]);
                      }}
                    >
                      Add Person
                    </Button>
                  </div>

                  {(form.watch('jointPersons') || []).map((person, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium">Person {index + 1}</h5>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentPersons = form.getValues('jointPersons') || [];
                              form.setValue('jointPersons', currentPersons.filter((_, i) => i !== index));
                            }}
                            disabled={(form.watch('jointPersons') || []).length <= 2}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`jointPersons.${index}.givenNames`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Given Names</FormLabel>
                              <FormControl>
                                <Input placeholder="John" {...field} />
                              </FormControl>
                              <FormDescription>
                                Required if entity name not provided
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`jointPersons.${index}.familyName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Family Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Smith" {...field} />
                              </FormControl>
                              <FormDescription>
                                Required if entity name not provided
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`jointPersons.${index}.entityName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Entity Name</FormLabel>
                            <FormControl>
                              <Input placeholder="ABC Pty Ltd" {...field} />
                            </FormControl>
                            <FormDescription>
                              Alternative to individual names for non-individual joint persons
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />


                    </div>
                  ))}

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
                </div>
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

              {selectedMemberType !== MemberType.INDIVIDUAL && (
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