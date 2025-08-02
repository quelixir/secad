"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

import { AssociateType } from "@/lib/types";
import { CountrySelect } from "@/components/ui/country-select";
import { StateSelect } from "@/components/ui/state-select";
import { getDefaultCountry } from "@/lib/config";

const associateFormSchema = z
  .object({
    type: z.string().min(1, "Associate type is required"),
    isIndividual: z.boolean(),
    givenNames: z.string().optional(),
    familyName: z.string().optional(),
    dateOfBirth: z.string().optional(),
    previousNames: z.array(z.string()).optional(),
    entityName: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postcode: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\d{4}$/.test(val),
        "Postcode must be 4 digits",
      ),
    country: z.string().optional(),
    appointmentDate: z.string().optional(),
    resignationDate: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.isIndividual) {
        return data.givenNames && data.familyName;
      } else {
        return data.entityName;
      }
    },
    {
      message:
        "For individuals, given names and family name are required. For entities, entity name is required.",
      path: ["givenNames"],
    },
  );

type AssociateFormValues = z.infer<typeof associateFormSchema>;

interface AssociateFormProps {
  entityId: string;
  associate?: any;
  onSaved: () => void;
}

export function AssociateForm({
  entityId,
  associate,
  onSaved,
}: AssociateFormProps) {
  const [loading, setLoading] = useState(false);
  const [newPreviousName, setNewPreviousName] = useState("");

  const form = useForm<AssociateFormValues>({
    resolver: zodResolver(associateFormSchema),
    defaultValues: {
      type: associate?.type || "officeholder_director",
      isIndividual: associate?.isIndividual ?? true,
      givenNames: associate?.givenNames || "",
      familyName: associate?.familyName || "",
      dateOfBirth: associate?.dateOfBirth
        ? associate.dateOfBirth.split("T")[0]
        : "",
      previousNames: associate?.previousNames || [],
      entityName: associate?.entityName || "",
      email: associate?.email || "",
      phone: associate?.phone || "",
      address: associate?.address || "",
      city: associate?.city || "",
      state: associate?.state || "",
      postcode: associate?.postcode || "",
      country: associate?.country || getDefaultCountry(),
      appointmentDate: associate?.appointmentDate
        ? associate.appointmentDate.split("T")[0]
        : "",
      resignationDate: associate?.resignationDate
        ? associate.resignationDate.split("T")[0]
        : "",
      notes: associate?.notes || "",
    },
  });

  const isIndividual = form.watch("isIndividual");
  const previousNames = form.watch("previousNames") || [];
  const selectedCountry = form.watch("country");

  const addPreviousName = () => {
    if (newPreviousName.trim()) {
      const currentNames = form.getValues("previousNames") || [];
      form.setValue("previousNames", [...currentNames, newPreviousName.trim()]);
      setNewPreviousName("");
    }
  };

  const removePreviousName = (index: number) => {
    const currentNames = form.getValues("previousNames") || [];
    const updatedNames = currentNames.filter((_, i) => i !== index);
    form.setValue("previousNames", updatedNames);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPreviousName();
    }
  };

  const onSubmit = async (values: AssociateFormValues) => {
    try {
      setLoading(true);

      const requestData = {
        entityId,
        ...values,
        dateOfBirth: values.dateOfBirth
          ? new Date(values.dateOfBirth).toISOString()
          : undefined,
        appointmentDate: values.appointmentDate
          ? new Date(values.appointmentDate).toISOString()
          : undefined,
        resignationDate: values.resignationDate
          ? new Date(values.resignationDate).toISOString()
          : undefined,
        previousNames:
          values.previousNames?.filter((name) => name.length > 0) || [],
      };

      const url = associate
        ? `/api/associates/${associate.id}`
        : "/api/associates";
      const method = associate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save associate");
      }

      onSaved();
    } catch (error) {
      console.error("Error saving associate:", error);
      form.setError("root", {
        type: "manual",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while saving",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto px-1">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Type and Associate Type - side by side */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select associate type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={AssociateType.OFFICEHOLDER_DIRECTOR}>
                        Director
                      </SelectItem>
                      <SelectItem value={AssociateType.OFFICEHOLDER_SECRETARY}>
                        Secretary
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isIndividual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Associate Type</FormLabel>
                  <Select
                    onValueChange={(value: string) =>
                      field.onChange(value === "true")
                    }
                    defaultValue={field.value ? "true" : "false"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select associate type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">Individual Person</SelectItem>
                      <SelectItem value="false">Corporate Entity</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Individual Details */}
          {isIndividual && (
            <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
              <h3 className="text-sm font-medium">Individual Details</h3>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="givenNames"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Given Names *</FormLabel>
                      <FormControl>
                        <Input placeholder="John William" {...field} />
                      </FormControl>
                      <FormDescription>All given names</FormDescription>
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
                      <FormDescription>Last name / surname</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Date of birth for the individual
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="previousNames"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous Names</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add previous name"
                            value={newPreviousName}
                            onChange={(e) => setNewPreviousName(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addPreviousName}
                            disabled={!newPreviousName.trim()}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {previousNames.length > 0 && (
                          <div className="space-y-1">
                            {previousNames.map((name, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-muted/50 p-2 rounded-md"
                              >
                                <span className="text-sm">{name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removePreviousName(index)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50 h-auto p-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Previous names the individual has used
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Corporate Details */}
          {!isIndividual && (
            <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
              <h3 className="text-sm font-medium">Corporate Details</h3>

              <FormField
                control={form.control}
                name="entityName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entity Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC Holdings Pty Ltd" {...field} />
                    </FormControl>
                    <FormDescription>
                      Full legal name of the corporate entity
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
            <h3 className="text-sm font-medium">Contact Information</h3>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
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

            <div className="grid grid-cols-3 gap-3">
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

          {/* Appointment Details */}
          <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
            <h3 className="text-sm font-medium">Appointment Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="appointmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Appointment Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date().toISOString().split("T")[0];
                          form.setValue("appointmentDate", today);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Today
                      </button>
                      <FormDescription>
                        Date when the person was appointed to this role
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resignationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resignation Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <div className="space-y-1">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const today = new Date()
                              .toISOString()
                              .split("T")[0];
                            form.setValue("resignationDate", today);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Today
                        </button>
                        {field.value && (
                          <button
                            type="button"
                            onClick={() => {
                              form.setValue("resignationDate", "");
                            }}
                            className="text-xs text-red-600 hover:text-red-800 underline"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <FormDescription>
                        Date when the person resigned from this role. Setting
                        this date will automatically mark the associate as
                        "Resigned". Clearing this field will mark them as
                        "Active".
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes or comments"
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
            <div className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t bg-background sticky bottom-0">
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : associate
                  ? "Update Associate"
                  : "Add Associate"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
