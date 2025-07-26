'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { compliancePackRegistration } from '@/lib/compliance'
import { CountrySelect } from '@/components/ui/country-select'
import { StateSelect } from '@/components/ui/state-select'
import { EntityTypeSelect } from '@/components/ui/entity-type-select'
import { EntityIdentifiers, type EntityIdentifier } from '@/components/ui/entity-identifiers'
import { getDefaultCountry } from '@/lib/config'
import { Entity } from '@/lib/types/interfaces'

const entityFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  entityTypeId: z.string().min(1, 'Entity type is required'),
  incorporationDate: z.string().min(1, 'Incorporation/formation date is required').refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  incorporationCountry: z.string().optional(),
  incorporationState: z.string().optional(),
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
  entity?: Entity
  onSubmit: (data: EntityFormValues & { identifiers: EntityIdentifier[] }) => Promise<void>
  loading?: boolean
}

export function EntityForm({ entity, onSubmit, loading = false }: EntityFormProps) {
  const [selectedCountry, setSelectedCountry] = useState(entity?.country || getDefaultCountry())
  const [selectedIncorporationCountry, setSelectedIncorporationCountry] = useState(entity?.incorporationCountry || getDefaultCountry())
  const [identifiers, setIdentifiers] = useState<EntityIdentifier[]>(entity?.identifiers || [])

  const form = useForm<EntityFormValues>({
    resolver: zodResolver(entityFormSchema),
    defaultValues: {
      name: entity?.name || '',
      entityTypeId: entity?.entityTypeId || '',
      incorporationDate: entity?.incorporationDate ? entity.incorporationDate.toISOString().split('T')[0] : '',
      incorporationCountry: entity?.incorporationCountry || getDefaultCountry(),
      incorporationState: entity?.incorporationState || '',
      address: entity?.address || '',
      city: entity?.city || '',
      state: entity?.state || '',
      postcode: entity?.postcode || '',
      country: entity?.country || getDefaultCountry(),
      email: entity?.email || '',
      phone: entity?.phone || '',
      website: entity?.website || '',
    },
  })

  const handleSubmit = async (values: EntityFormValues) => {
    try {
      // Convert incorporationDate to ISO-8601 if present
      const isoDate = values.incorporationDate ? new Date(values.incorporationDate).toISOString() : '';
      await onSubmit({ ...values, incorporationDate: isoDate, identifiers })
    } catch (error) {
      console.error('Error submitting form:', error)
      form.setError('root', { message: 'Failed to save entity' })
    }
  }

  const watchedCountry = form.watch('country')
  if (watchedCountry !== selectedCountry) {
    setSelectedCountry(watchedCountry || getDefaultCountry())
  }

  const watchedIncorporationCountry = form.watch('incorporationCountry')
  if (watchedIncorporationCountry !== selectedIncorporationCountry) {
    setSelectedIncorporationCountry(watchedIncorporationCountry || getDefaultCountry())
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>

          {/* Entity Name - Full Width */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entity Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter entity name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Incorporation Details - Three Columns */}
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="incorporationCountry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incorporation/Formation Country</FormLabel>
                  <FormControl>
                    <CountrySelect
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedIncorporationCountry(value || getDefaultCountry());
                        // Reset entity type when country changes
                        const entityTypeField = form.getValues('entityTypeId');
                        if (entityTypeField) {
                          const newCountryEntityTypes = compliancePackRegistration.getEntityTypes(value || getDefaultCountry());
                          const typeStillValid = newCountryEntityTypes.some(type => type.id === entityTypeField);
                          if (!typeStillValid) {
                            form.setValue('entityTypeId', '');
                          }
                        }
                      }}
                      placeholder="Select incorporation country..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="incorporationState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incorporation/Formation State</FormLabel>
                  <FormControl>
                    <StateSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select incorporation state..."
                      selectedCountry={selectedIncorporationCountry}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="incorporationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incorporation/Formation Date <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="date" required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Entity Type - Full Width */}
          <FormField
            control={form.control}
            name="entityTypeId"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Entity Type</FormLabel>
                <FormControl>
                  <EntityTypeSelect
                    field={field}
                    selectedCountry={selectedIncorporationCountry}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Entity Identifiers */}
        <EntityIdentifiers
          identifiers={identifiers}
          onChange={setIdentifiers}
          disabled={loading}
        />

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

          {/* Address Information */}
          <div className="space-y-4 pt-4">
            <h4 className="text-base font-medium">Address Information</h4>

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