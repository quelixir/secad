"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import { Plus, Trash2, Edit } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { compliancePackRegistration } from "@/lib/compliance";

export interface EntityIdentifier {
  id?: string;
  type: string;
  value: string;
  country: string;
  isActive?: boolean;
}

interface EntityIdentifiersProps {
  identifiers: EntityIdentifier[];
  onChange: (identifiers: EntityIdentifier[]) => void;
  disabled?: boolean;
}

const identifierFormSchema = z.object({
  country: z.string().min(1, "Country is required"),
  type: z.string().min(1, "Identifier type is required"),
  value: z.string().min(1, "Value is required"),
});

type IdentifierFormValues = z.infer<typeof identifierFormSchema>;

export function EntityIdentifiers({
  identifiers,
  onChange,
  disabled = false,
}: EntityIdentifiersProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const form = useForm<IdentifierFormValues>({
    resolver: zodResolver(identifierFormSchema),
    defaultValues: {
      country: "",
      type: "",
      value: "",
    },
  });

  const packs = compliancePackRegistration.getAllPacks();
  const selectedPack = compliancePackRegistration.getByCountry(selectedCountry);

  const onSubmit = (values: IdentifierFormValues) => {
    // Validate the identifier value (only show error if user has interacted or we're in add mode)
    const shouldValidate = editingIndex === null || hasUserInteracted;
    const isValid = shouldValidate
      ? compliancePackRegistration.validateIdentifier(
          values.country,
          values.type,
          values.value
        )
      : true;
    if (!isValid) {
      form.setError("value", { message: "Invalid identifier value" });
      return;
    }

    // Check for duplicates (excluding the current item being edited)
    const isDuplicate = identifiers.some(
      (id, index) =>
        id.country === values.country &&
        id.type === values.type &&
        index !== editingIndex
    );
    if (isDuplicate) {
      form.setError("type", {
        message: "This identifier type already exists for this country",
      });
      return;
    }

    if (editingIndex !== null) {
      // Update existing identifier
      const updatedIdentifiers = [...identifiers];
      updatedIdentifiers[editingIndex] = {
        ...updatedIdentifiers[editingIndex],
        ...values,
      };
      onChange(updatedIdentifiers);
      setIsEditDialogOpen(false);
    } else {
      // Add new identifier
      const newIdentifier: EntityIdentifier = {
        id: `temp-${Date.now()}`, // Temporary ID for new identifiers
        ...values,
        isActive: true,
      };
      onChange([...identifiers, newIdentifier]);
      setIsDialogOpen(false);
    }

    form.reset();
    setSelectedCountry("");
    setEditingIndex(null);
  };

  const removeIdentifier = (index: number) => {
    const newIdentifiers = identifiers.filter((_, i) => i !== index);
    onChange(newIdentifiers);
  };

  const editIdentifier = (index: number) => {
    const identifier = identifiers[index];
    setEditingIndex(index);
    setSelectedCountry(identifier.country);
    setHasUserInteracted(false); // Reset user interaction state
    form.reset({
      country: identifier.country,
      type: identifier.type,
      value: identifier.value,
    });
    setIsEditDialogOpen(true);
  };

  const formatIdentifierValue = (identifier: EntityIdentifier) => {
    return compliancePackRegistration.formatIdentifier(
      identifier.country,
      identifier.type,
      identifier.value
    );
  };

  const getIdentifierTypeName = (country: string, typeCode: string) => {
    const identifierType = compliancePackRegistration.getIdentifierType(
      country,
      typeCode
    );
    return identifierType?.name || typeCode;
  };

  const getCountryName = (country: string) => {
    const pack = compliancePackRegistration.getByCountry(country);
    return pack?.country || country;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Entity Identifiers
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={disabled}>
                <Plus className="h-4 w-4 mr-2" />
                Add Identifier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Entity Identifier</DialogTitle>
                <DialogDescription>
                  Add a new identifier for this entity. Select the country and
                  identifier type.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedCountry(value);
                            form.setValue("type", ""); // Reset type when country changes
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {packs.map((pack) => (
                              <SelectItem
                                key={pack.country}
                                value={pack.country}
                              >
                                {pack.country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedPack && (
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Identifier Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select identifier type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedPack.identifierTypes.map((type) => (
                                <SelectItem
                                  key={type.abbreviation}
                                  value={type.abbreviation}
                                >
                                  {type.name} ({type.abbreviation})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("type") && selectedPack && (
                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => {
                        const identifierType =
                          selectedPack.identifierTypes.find(
                            (t) => t.abbreviation === form.watch("type")
                          );
                        const currentValue = field.value;
                        const country = form.watch("country");
                        const type = form.watch("type");

                        // Validate the identifier in real-time
                        const isValid =
                          currentValue && country && type
                            ? compliancePackRegistration.validateIdentifier(
                                country,
                                type,
                                currentValue
                              )
                            : null;

                        // Determine input styling based on validation
                        const inputClassName = currentValue
                          ? isValid
                            ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                            : "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "";

                        return (
                          <FormItem>
                            <FormLabel>Value</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={
                                  identifierType?.placeholder ||
                                  "Enter identifier value"
                                }
                                className={inputClassName}
                                {...field}
                              />
                            </FormControl>
                            {identifierType && (
                              <p className="text-sm text-muted-foreground">
                                Format: {identifierType.formatPattern}
                              </p>
                            )}
                            {currentValue && (
                              <p
                                className={`text-sm ${
                                  isValid ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {isValid
                                  ? "✓ Valid identifier"
                                  : "✗ Invalid identifier"}
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  )}

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setHasUserInteracted(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add Identifier</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Entity Identifier</DialogTitle>
                <DialogDescription>
                  Update the identifier details for this entity.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedCountry(value);
                            form.setValue("type", ""); // Reset type when country changes
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {packs.map((pack) => (
                              <SelectItem
                                key={pack.country}
                                value={pack.country}
                              >
                                {pack.country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedPack && (
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Identifier Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select identifier type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedPack.identifierTypes.map((type) => (
                                <SelectItem
                                  key={type.abbreviation}
                                  value={type.abbreviation}
                                >
                                  {type.name} ({type.abbreviation})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("type") && selectedPack && (
                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => {
                        const identifierType =
                          selectedPack.identifierTypes.find(
                            (t) => t.abbreviation === form.watch("type")
                          );
                        const currentValue = field.value;
                        const country = form.watch("country");
                        const type = form.watch("type");

                        // Validate the identifier in real-time
                        const isValid =
                          currentValue && country && type
                            ? compliancePackRegistration.validateIdentifier(
                                country,
                                type,
                                currentValue
                              )
                            : null;

                        // Determine input styling based on validation
                        const inputClassName = currentValue
                          ? isValid
                            ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                            : "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "";

                        return (
                          <FormItem>
                            <FormLabel>Value</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={
                                  identifierType?.placeholder ||
                                  "Enter identifier value"
                                }
                                className={inputClassName}
                                {...field}
                              />
                            </FormControl>
                            {identifierType && (
                              <p className="text-sm text-muted-foreground">
                                Format: {identifierType.formatPattern}
                              </p>
                            )}
                            {currentValue && (
                              <p
                                className={`text-sm ${
                                  isValid ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {isValid
                                  ? "✓ Valid identifier"
                                  : "✗ Invalid identifier"}
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  )}

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Update Identifier</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Manage legal identifiers for this entity across different
          jurisdictions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {identifiers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No identifiers added yet. Click &quot;Add Identifier&quot; to get
            started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {identifiers.map((identifier, index) => (
                <TableRow key={index}>
                  <TableCell>{getCountryName(identifier.country)}</TableCell>
                  <TableCell>
                    {getIdentifierTypeName(identifier.country, identifier.type)}
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatIdentifierValue(identifier)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editIdentifier(index)}
                        disabled={disabled}
                      >
                        <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIdentifier(index)}
                        disabled={disabled}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
