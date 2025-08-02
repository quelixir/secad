"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Save, AlertCircle } from "lucide-react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { TransactionType } from "@/lib/types";
import { TransactionReasons } from "@/lib/transaction-reasons";
import { Currencies } from "@/lib/currencies";
import { getDefaultCurrencyCode } from "@/lib/config";
import {
  getFormattedMemberName,
  Member as MemberType,
} from "@/lib/types/interfaces/Member";
import type { Entity } from "@/lib/types/interfaces/Entity";
import type { SecurityClass } from "@/lib/types/interfaces/Security";
import type { Member } from "@/lib/types/interfaces/Member";

const bulkTransactionSchema = z
  .object({
    entityId: z.string().min(1, "Entity is required"),
    securityClassId: z.string().min(1, "Security class is required"),
    type: z.string().min(1, "Transaction type is required"),
    reasonCode: z.string().min(1, "Reason code is required"),
    currency: z.string().min(1, "Currency is required"),
    settlementDate: z.string().optional(),
    postedDate: z.string().optional(),
    reference: z.string().optional(),
    description: z.string().optional(),
    transactions: z
      .array(
        z.object({
          quantity: z
            .string()
            .refine(
              (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
              "Quantity must be a positive number"
            ),
          paidPerSecurity: z
            .string()
            .optional()
            .refine(
              (val) =>
                !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
              "Paid amount must be a valid positive number"
            ),
          unpaidPerSecurity: z
            .string()
            .optional()
            .refine(
              (val) =>
                !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
              "Unpaid amount must be a valid positive number"
            ),
          fromMemberId: z.string().optional(),
          toMemberId: z.string().optional(),
          reference: z.string().optional(),
          description: z.string().optional(),
        })
      )
      .min(1, "At least one transaction is required"),
  })
  .refine(
    (data) => {
      // Validate based on transaction type
      if (data.type === "ISSUE") {
        return data.transactions.every((t) => t.toMemberId); // Must have recipient for issuance
      } else if (data.type === "TRANSFER") {
        return data.transactions.every(
          (t) =>
            t.fromMemberId && t.toMemberId && t.fromMemberId !== t.toMemberId
        ); // Must have both members and they must be different
      } else if (data.type === "REDEMPTION") {
        return data.transactions.every((t) => t.fromMemberId); // Must have member to redeem from
      }
      return true;
    },
    {
      message: "Invalid member selection for transaction type",
      path: ["transactions"],
    }
  );

type BulkTransactionFormValues = z.infer<typeof bulkTransactionSchema>;

interface BulkTransactionFormProps {
  selectedEntity?: Entity;
  onSaved: () => void;
}

export function BulkTransactionForm({
  selectedEntity,
  onSaved,
}: BulkTransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [securityClasses, setSecurities] = useState<SecurityClass[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<BulkTransactionFormValues>({
    resolver: zodResolver(bulkTransactionSchema),
    defaultValues: {
      entityId: selectedEntity?.id || "",
      securityClassId: "",
      type: "",
      reasonCode: "",
      currency: getDefaultCurrencyCode(),
      settlementDate: new Date().toISOString().split("T")[0],
      postedDate: new Date().toISOString().split("T")[0],
      reference: "",
      description: "",
      transactions: [
        {
          quantity: "",
          paidPerSecurity: "",
          unpaidPerSecurity: "",
          fromMemberId: "",
          toMemberId: "",
          reference: "",
          description: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "transactions",
  });

  const selectedType = form.watch("type");
  const selectedCurrency = form.watch("currency");

  useEffect(() => {
    if (selectedEntity) {
      fetchSecurityClasses(selectedEntity.id);
      fetchMembers(selectedEntity.id);
    }
  }, [selectedEntity]);

  const fetchSecurityClasses = async (entityId: string) => {
    try {
      const response = await fetch(
        `/api/registry/securities?entityId=${entityId}`
      );
      const result = await response.json();
      if (result.success) {
        setSecurities(result.data);
      }
    } catch (error) {
      console.error("Error fetching securities:", error);
    }
  };

  const fetchMembers = async (entityId: string) => {
    try {
      const response = await fetch(
        `/api/registry/members?entityId=${entityId}`
      );
      const result = await response.json();
      if (result.success) {
        setMembers(result.data);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const formatMemberName = (member: Member | undefined) => {
    if (!member) return "";
    return getFormattedMemberName(member as MemberType);
  };

  const addTransaction = () => {
    append({
      quantity: "",
      paidPerSecurity: "",
      unpaidPerSecurity: "",
      fromMemberId: "",
      toMemberId: "",
      reference: "",
      description: "",
    });
  };

  const removeTransaction = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (values: BulkTransactionFormValues) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/registry/transactions/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (result.success) {
        onSaved();
      } else {
        setError(result.error || "Failed to create bulk transactions");
      }
    } catch (error) {
      console.error("Error creating bulk transactions:", error);
      setError("Failed to create bulk transactions");
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeDescription = (type: string) => {
    switch (type) {
      case "ISSUE":
        return "Issue new securities to a member";
      case "TRANSFER":
        return "Transfer securities between members";
      case "REDEMPTION":
        return "Redeem securities from a member";
      case "CANCELLATION":
        return "Cancel existing securities";
      default:
        return "";
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Common Transaction Details */}
        <Card>
          <CardHeader>
            <CardTitle>Bulk Transaction Details</CardTitle>
            <CardDescription>
              Common details that apply to all transactions in this batch
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="securityClassId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Class</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select security class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {securityClasses.map((securityClass) => (
                          <SelectItem
                            key={securityClass.id}
                            value={securityClass.id}
                          >
                            {securityClass.name}{" "}
                            {securityClass.symbol &&
                              `(${securityClass.symbol})`}
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transaction type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TransactionType).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value}
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

              <FormField
                control={form.control}
                name="reasonCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason Code</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason code" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TransactionReasons.map((reason) => (
                          <SelectItem key={reason.code} value={reason.code}>
                            {reason.code} - {reason.description}
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
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Currencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name}
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
                name="settlementDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Settlement date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Date when the transaction occurred (can be backdated)
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
                      <Input placeholder="Transaction reference" {...field} />
                    </FormControl>
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
                      placeholder="Transaction description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Individual Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Individual Transactions</CardTitle>
                <CardDescription>
                  Add multiple transactions with different members and
                  quantities
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={addTransaction}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Transaction {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeTransaction(index)}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`transactions.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Number of securities"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`transactions.${index}.paidPerSecurity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Paid per Security ({selectedCurrency})
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`transactions.${index}.unpaidPerSecurity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Unpaid per Security ({selectedCurrency})
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedType === "TRANSFER" && (
                    <FormField
                      control={form.control}
                      name={`transactions.${index}.fromMemberId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>FROM</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select member" />
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

                  {(selectedType === "ISSUE" ||
                    selectedType === "TRANSFER") && (
                    <FormField
                      control={form.control}
                      name={`transactions.${index}.toMemberId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TO</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select member" />
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

                  {selectedType === "REDEMPTION" && (
                    <FormField
                      control={form.control}
                      name={`transactions.${index}.fromMemberId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>FROM</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select member" />
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

                  <FormField
                    control={form.control}
                    name={`transactions.${index}.reference`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Individual reference"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`transactions.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Individual description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Bulk Transactions"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
