'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Check, ChevronsUpDown, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { TransactionType } from '@/lib/types'
import { TransactionReasons } from '@/lib/transaction-reasons'
import { Currencies } from '@/lib/currencies'
import { cn } from '@/lib/utils'
import { getDefaultCurrencyCode } from '@/lib/config'

const transactionFormSchema = z.object({
    entityId: z.string().min(1, 'Entity is required'),
    securityClassId: z.string().min(1, 'Security class is required'),
    type: z.string().min(1, 'Transaction type is required'),
    reasonCode: z.string().min(1, 'Reason code is required'),
    quantity: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Quantity must be a positive number'),
    paidPerSecurity: z.string().optional().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), 'Paid amount must be a valid positive number'),
    unpaidPerSecurity: z.string().optional().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), 'Unpaid amount must be a valid positive number'),
    currency: z.string().min(1, 'Currency is required'),
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
}).refine((data) => {
    // Validate transaction date is not before entity incorporation date
    if (data.transactionDate) {
        const transactionDate = new Date(data.transactionDate)
        const today = new Date()
        const maxBackdate = new Date()
        maxBackdate.setFullYear(today.getFullYear() - 10) // Allow backdating up to 10 years

        if (transactionDate > today) {
            return false // Cannot date in the future
        }
        if (transactionDate < maxBackdate) {
            return false // Cannot backdate more than 10 years
        }
    }
    return true
}, {
    message: 'Transaction date cannot be in the future or more than 10 years in the past',
    path: ['transactionDate']
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

interface Transaction {
    id: string
    transactionType: string
    quantity: number
    amountPaidPerSecurity?: string
    amountUnpaidPerSecurity?: string
    transferPricePerSecurity?: string
    totalAmountPaid?: string
    totalAmountUnpaid?: string
    totalTransferAmount?: string
    transactionDate: string
    settlementDate?: string
    reference?: string
    description?: string
    certificateNumber?: string
    status: string
    entity: {
        id: string
        name: string
    }
    securityClass: {
        id: string
        name: string
        symbol?: string
    }
    fromMember?: {
        id: string
        firstName?: string
        lastName?: string
        entityName?: string
        memberType: string
    }
    toMember?: {
        id: string
        firstName?: string
        lastName?: string
        entityName?: string
        memberType: string
    }
}

interface TransactionFormProps {
    selectedEntity?: Entity
    transaction?: Transaction
    onSaved: () => void
}

export function TransactionForm({ selectedEntity, transaction, onSaved }: TransactionFormProps) {
    const [loading, setLoading] = useState(false)
    const [securityClasses, setSecurities] = useState<SecurityClass[]>([])
    const [members, setMembers] = useState<Member[]>([])
    const [loadingSecurities, setLoadingSecurities] = useState(false)
    const [loadingMembers, setLoadingMembers] = useState(false)
    const [securityClassOpen, setSecurityClassOpen] = useState(false)
    const [reasonCodeOpen, setReasonCodeOpen] = useState(false)
    const [currencyOpen, setCurrencyOpen] = useState(false)
    const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)

    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionFormSchema),
        mode: "onChange",
        defaultValues: {
            entityId: selectedEntity?.id || '',
            securityClassId: transaction?.securityClass?.id || '',
            type: transaction?.transactionType || '',
            reasonCode: '',
            quantity: transaction?.quantity?.toString() || '',
            paidPerSecurity: transaction?.amountPaidPerSecurity || transaction?.transferPricePerSecurity || '',
            unpaidPerSecurity: transaction?.amountUnpaidPerSecurity || '',
            currency: getDefaultCurrencyCode(),
            fromMemberId: transaction?.fromMember?.id || '',
            toMemberId: transaction?.toMember?.id || '',
            transactionDate: transaction?.transactionDate ? new Date(transaction.transactionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            reference: transaction?.reference || '',
            description: transaction?.description || ''
        }
    })

    const selectedEntityId = form.watch('entityId')
    const selectedType = form.watch('type')
    const quantity = form.watch('quantity')
    const paidPerSecurity = form.watch('paidPerSecurity')
    const unpaidPerSecurity = form.watch('unpaidPerSecurity')
    const currency = form.watch('currency')

    useEffect(() => {
        if (selectedEntityId) {
            fetchSecurities(selectedEntityId)
            fetchMembers(selectedEntityId)
        }
    }, [selectedEntityId])

    const fetchSecurities = async (entityId: string) => {
        try {
            setLoadingSecurities(true)
            const response = await fetch(`/api/registry/securities?entityId=${entityId}`)
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
            const response = await fetch(`/api/registry/members?entityId=${entityId}`)
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

    const formatMemberName = (member: Member | undefined) => {
        if (!member) return 'N/A'
        if (member.entityName) return `${member.entityName} (${member.memberType})`
        return `${member.firstName || ''} ${member.lastName || ''} (${member.memberType})`.trim()
    }

    const showTooltip = (text: string, event: React.MouseEvent) => {
        setTooltip({
            text,
            x: event.clientX + 10,
            y: event.clientY - 10
        })
    }

    const hideTooltip = () => {
        setTooltip(null)
    }

    const calculateTotal = () => {
        const qty = parseFloat(quantity || '0') || 0
        const price = parseFloat(paidPerSecurity || '0') || 0
        const unpaid = parseFloat(unpaidPerSecurity || '0') || 0

        if (qty === 0) {
            return 'nil'
        }

        // For issue transactions, calculate total from paid + unpaid
        if (selectedType === 'ISSUE') {
            const totalPaid = qty * price
            const totalUnpaid = qty * unpaid
            const total = totalPaid + totalUnpaid

            if (total === 0) {
                return 'nil'
            }

            const currencyCode = currency || getDefaultCurrencyCode()

            if (Number.isInteger(total)) {
                return `${total.toFixed(2)} ${currencyCode}`
            } else if (total.toString().split('.')[1]?.length <= 2) {
                return `${total.toFixed(2)} ${currencyCode}`
            } else {
                return `${total.toFixed(5).replace(/\.?0+$/, '')} ${currencyCode}`
            }
        } else {
            // For non-issue transactions, use original logic
            if (price === 0) {
                return 'nil'
            }

            const total = qty * price
            const currencyCode = currency || getDefaultCurrencyCode()

            if (Number.isInteger(total)) {
                return `${total.toFixed(2)} ${currencyCode}`
            } else if (total.toString().split('.')[1]?.length <= 2) {
                return `${total.toFixed(2)} ${currencyCode}`
            } else {
                return `${total.toFixed(5).replace(/\.?0+$/, '')} ${currencyCode}`
            }
        }
    }

    const onSubmit = async (values: TransactionFormValues) => {
        try {
            setLoading(true)

            const requestData = {
                ...values,
                transactionType: values.type,
                reasonCode: values.reasonCode,
                quantity: parseFloat(values.quantity),
                pricePerSecurity: values.paidPerSecurity ? parseFloat(values.paidPerSecurity) : undefined,
                unpaidPerSecurity: values.unpaidPerSecurity ? parseFloat(values.unpaidPerSecurity) : undefined,
                currency: values.currency,
                transactionDate: values.transactionDate ? new Date(values.transactionDate).toISOString() : undefined,
                fromMemberId: values.type === 'ISSUE' ? null : (values.fromMemberId || undefined),
                toMemberId: values.toMemberId || undefined
            }

            const url = transaction ? `/api/registry/transactions/${transaction.id}` : '/api/registry/transactions'
            const method = transaction ? 'PUT' : 'POST'

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
                form.setError('root', { message: result.error || `Failed to ${transaction ? 'update' : 'create'} transaction` })
            }
        } catch (error) {
            console.error(`Error ${transaction ? 'updating' : 'creating'} transaction:`, error)
            form.setError('root', { message: 'An unexpected error occurred' })
        } finally {
            setLoading(false)
        }
    }

    const getTransactionTypeDescription = (type: string) => {
        switch (type) {
            case 'ISSUE': return 'Issue new securities to a member'
            case 'TRANSFER': return 'Transfer securities between members'
            case 'CANCELLATION': return 'Cancel existing securities'
            case 'REDEMPTION': return 'Redeem securities from a member'
            case 'RETURN_OF_CAPITAL': return 'Return capital to members'
            case 'CAPITAL_CALL': return 'Call for additional capital from members'
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
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Transaction Type *</FormLabel>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value || ''}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
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
                                            <span
                                                onMouseEnter={(e) => showTooltip(getTransactionTypeDescription(selectedType), e)}
                                                onMouseLeave={hideTooltip}
                                            >
                                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                            </span>
                                        )}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="reasonCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason Code *</FormLabel>
                                    <Popover open={reasonCodeOpen} onOpenChange={setReasonCodeOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={reasonCodeOpen}
                                                    className="w-full justify-between"
                                                >
                                                    {field.value
                                                        ? TransactionReasons.find((reason) => reason.code === field.value)?.code + ' - ' +
                                                        TransactionReasons.find((reason) => reason.code === field.value)?.reason
                                                        : "Select reason code..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search reason codes..." />
                                                <CommandList>
                                                    <CommandEmpty>No reason code found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {TransactionReasons.map((reason) => (
                                                            <CommandItem
                                                                key={reason.code}
                                                                value={`${reason.code} ${reason.reason} ${reason.description}`}
                                                                onSelect={() => {
                                                                    field.onChange(reason.code)
                                                                    setReasonCodeOpen(false)
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        reason.code === field.value ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{reason.code} - {reason.reason}</span>
                                                                    <span className="text-xs text-muted-foreground">{reason.description}</span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3">
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.000001"
                                                min="0.000001"
                                                placeholder="Enter quantity"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Number of securities to transact (must be positive)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="col-span-1">
                            <FormField
                                control={form.control}
                                name="securityClassId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Security Class *</FormLabel>
                                        <Popover open={securityClassOpen} onOpenChange={setSecurityClassOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={securityClassOpen}
                                                        className="w-full justify-between"
                                                        disabled={!selectedEntityId || loadingSecurities}
                                                    >
                                                        {field.value
                                                            ? securityClasses.find((securityClass) => securityClass.id === field.value)?.name +
                                                            (securityClasses.find((securityClass) => securityClass.id === field.value)?.symbol ?
                                                                ` (${securityClasses.find((securityClass) => securityClass.id === field.value)?.symbol})` : '')
                                                            : !selectedEntityId
                                                                ? "Select entity first"
                                                                : loadingSecurities
                                                                    ? "Loading securities..."
                                                                    : "Select security class..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[400px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search security classes..." />
                                                    <CommandList>
                                                        <CommandEmpty>No security class found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {securityClasses.map((securityClass) => (
                                                                <CommandItem
                                                                    key={securityClass.id}
                                                                    value={`${securityClass.name} ${securityClass.symbol || ''}`}
                                                                    onSelect={() => {
                                                                        field.onChange(securityClass.id)
                                                                        setSecurityClassOpen(false)
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            securityClass.id === field.value ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{securityClass.name}</span>
                                                                        {securityClass.symbol && (
                                                                            <span className="text-xs text-muted-foreground">Symbol: {securityClass.symbol}</span>
                                                                        )}
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {selectedType === 'ISSUE' ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="paidPerSecurity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Paid per Security (optional)</FormLabel>
                                            <div className="flex items-center gap-2">
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormField
                                                    control={form.control}
                                                    name="currency"
                                                    render={({ field: currencyField }) => (
                                                        <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        variant="outline"
                                                                        role="combobox"
                                                                        aria-expanded={currencyOpen}
                                                                        className="w-32 justify-between"
                                                                    >
                                                                        {currencyField.value
                                                                            ? Currencies.find((currency) => currency.code === currencyField.value)?.code
                                                                            : "Select currency..."}
                                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[400px] p-0">
                                                                <Command>
                                                                    <CommandInput placeholder="Search currencies..." />
                                                                    <CommandList>
                                                                        <CommandEmpty>No currency found.</CommandEmpty>
                                                                        <CommandGroup>
                                                                            {Currencies.map((currency) => (
                                                                                <CommandItem
                                                                                    key={currency.code}
                                                                                    value={`${currency.code} ${currency.name} ${currency.symbol}`}
                                                                                    onSelect={() => {
                                                                                        currencyField.onChange(currency.code)
                                                                                        setCurrencyOpen(false)
                                                                                    }}
                                                                                >
                                                                                    <Check
                                                                                        className={cn(
                                                                                            "mr-2 h-4 w-4",
                                                                                            currency.code === currencyField.value ? "opacity-100" : "opacity-0"
                                                                                        )}
                                                                                    />
                                                                                    <div className="flex flex-col">
                                                                                        <span className="font-medium">{currency.code} - {currency.name}</span>
                                                                                        <span className="text-xs text-muted-foreground">Symbol: {currency.symbol}</span>
                                                                                    </div>
                                                                                </CommandItem>
                                                                            ))}
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                    )}
                                                />
                                            </div>
                                            <FormDescription>
                                                Total: {(() => {
                                                    const qty = parseFloat(quantity || '0') || 0
                                                    const paid = parseFloat(paidPerSecurity || '0') || 0
                                                    if (qty === 0 || paid === 0) return 'nil'
                                                    const total = qty * paid
                                                    const currencyCode = currency || getDefaultCurrencyCode()
                                                    if (Number.isInteger(total)) {
                                                        return `${total.toFixed(2)} ${currencyCode}`
                                                    } else if (total.toString().split('.')[1]?.length <= 2) {
                                                        return `${total.toFixed(2)} ${currencyCode}`
                                                    } else {
                                                        return `${total.toFixed(5).replace(/\.?0+$/, '')} ${currencyCode}`
                                                    }
                                                })()}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="unpaidPerSecurity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unpaid per Security (optional)</FormLabel>
                                            <div className="flex items-center gap-2">
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormField
                                                    control={form.control}
                                                    name="currency"
                                                    render={({ field: currencyField }) => (
                                                        <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        variant="outline"
                                                                        role="combobox"
                                                                        aria-expanded={currencyOpen}
                                                                        className="w-32 justify-between"
                                                                    >
                                                                        {currencyField.value
                                                                            ? Currencies.find((currency) => currency.code === currencyField.value)?.code
                                                                            : "Select currency..."}
                                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[400px] p-0">
                                                                <Command>
                                                                    <CommandInput placeholder="Search currencies..." />
                                                                    <CommandList>
                                                                        <CommandEmpty>No currency found.</CommandEmpty>
                                                                        <CommandGroup>
                                                                            {Currencies.map((currency) => (
                                                                                <CommandItem
                                                                                    key={currency.code}
                                                                                    value={`${currency.code} ${currency.name} ${currency.symbol}`}
                                                                                    onSelect={() => {
                                                                                        currencyField.onChange(currency.code)
                                                                                        setCurrencyOpen(false)
                                                                                    }}
                                                                                >
                                                                                    <Check
                                                                                        className={cn(
                                                                                            "mr-2 h-4 w-4",
                                                                                            currency.code === currencyField.value ? "opacity-100" : "opacity-0"
                                                                                        )}
                                                                                    />
                                                                                    <div className="flex flex-col">
                                                                                        <span className="font-medium">{currency.code} - {currency.name}</span>
                                                                                        <span className="text-xs text-muted-foreground">Symbol: {currency.symbol}</span>
                                                                                    </div>
                                                                                </CommandItem>
                                                                            ))}
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                    )}
                                                />
                                            </div>
                                            <FormDescription>
                                                Total: {(() => {
                                                    const qty = parseFloat(quantity || '0') || 0
                                                    const unpaid = parseFloat(unpaidPerSecurity || '0') || 0
                                                    if (qty === 0 || unpaid === 0) return 'nil'
                                                    const total = qty * unpaid
                                                    const currencyCode = currency || getDefaultCurrencyCode()
                                                    if (Number.isInteger(total)) {
                                                        return `${total.toFixed(2)} ${currencyCode}`
                                                    } else if (total.toString().split('.')[1]?.length <= 2) {
                                                        return `${total.toFixed(2)} ${currencyCode}`
                                                    } else {
                                                        return `${total.toFixed(5).replace(/\.?0+$/, '')} ${currencyCode}`
                                                    }
                                                })()}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    ) : (
                        // Non-issue transaction - show original Price per Security field
                        <FormField
                            control={form.control}
                            name="paidPerSecurity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price per Security (optional)</FormLabel>
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="col-span-3">
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </div>
                                        <div className="col-span-1">
                                            <FormField
                                                control={form.control}
                                                name="currency"
                                                render={({ field: currencyField }) => (
                                                    <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    aria-expanded={currencyOpen}
                                                                    className="w-full justify-between pl-4"
                                                                >
                                                                    {currencyField.value
                                                                        ? Currencies.find((currency) => currency.code === currencyField.value)?.code
                                                                        : "Select currency..."}
                                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[400px] p-0">
                                                            <Command>
                                                                <CommandInput placeholder="Search currencies..." />
                                                                <CommandList>
                                                                    <CommandEmpty>No currency found.</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {Currencies.map((currency) => (
                                                                            <CommandItem
                                                                                key={currency.code}
                                                                                value={`${currency.code} ${currency.name} ${currency.symbol}`}
                                                                                onSelect={() => {
                                                                                    currencyField.onChange(currency.code)
                                                                                    setCurrencyOpen(false)
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        currency.code === currencyField.value ? "opacity-100" : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                <div className="flex flex-col">
                                                                                    <span className="font-medium">{currency.code} - {currency.name}</span>
                                                                                    <span className="text-xs text-muted-foreground">Symbol: {currency.symbol}</span>
                                                                                </div>
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <FormDescription>
                                        Total: {calculateTotal()}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                {/* Member Selection */}
                {selectedType && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Member Selection</h3>

                        <div className="grid grid-cols-2 gap-4">
                            {(selectedType === 'TRANSFER' || selectedType === 'REDEMPTION' || selectedType === 'RETURN_OF_CAPITAL' || selectedType === 'CAPITAL_CALL') && (
                                <FormField
                                    control={form.control}
                                    name="fromMemberId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>From Member *</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className="w-full justify-between"
                                                            disabled={!selectedEntityId || loadingMembers}
                                                        >
                                                            {field.value
                                                                ? formatMemberName(members.find((member) => member.id === field.value))
                                                                : !selectedEntityId
                                                                    ? "Select entity first"
                                                                    : loadingMembers
                                                                        ? "Loading members..."
                                                                        : "Select member..."}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[400px] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search members..." />
                                                        <CommandList>
                                                            <CommandEmpty>No member found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {members.map((member) => (
                                                                    <CommandItem
                                                                        key={member.id}
                                                                        value={formatMemberName(member)}
                                                                        onSelect={() => {
                                                                            field.onChange(member.id)
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                member.id === field.value ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {formatMemberName(member)}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
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
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className="w-full justify-between"
                                                            disabled={!selectedEntityId || loadingMembers}
                                                        >
                                                            {field.value
                                                                ? formatMemberName(members.find((member) => member.id === field.value))
                                                                : !selectedEntityId
                                                                    ? "Select entity first"
                                                                    : loadingMembers
                                                                        ? "Loading members..."
                                                                        : "Select member..."}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[400px] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search members..." />
                                                        <CommandList>
                                                            <CommandEmpty>No member found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {members.map((member) => (
                                                                    <CommandItem
                                                                        key={member.id}
                                                                        value={formatMemberName(member)}
                                                                        onSelect={() => {
                                                                            field.onChange(member.id)
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                member.id === field.value ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {formatMemberName(member)}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
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
                        {loading
                            ? (transaction ? 'Updating Transaction...' : 'Creating Transaction...')
                            : (transaction ? 'Update Transaction' : 'Create Transaction')
                        }
                    </Button>
                </div>
            </form>

            {/* Custom Tooltip */}
            {tooltip && (
                <div
                    className="fixed z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg pointer-events-none"
                    style={{
                        left: tooltip.x,
                        top: tooltip.y,
                        transform: 'translateY(-100%)'
                    }}
                >
                    {tooltip.text}
                </div>
            )}
        </Form>
    )
} 