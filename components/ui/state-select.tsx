'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getStatesForCountry } from '@/lib/countries-states-data'
import { cn } from '@/lib/utils'

interface StateSelectProps {
    value?: string
    onValueChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    selectedCountry?: string
}

export function StateSelect({
    value,
    onValueChange,
    placeholder = "Select state...",
    disabled = false,
    className,
    selectedCountry
}: StateSelectProps) {
    const [open, setOpen] = useState(false)

    const states = selectedCountry ? getStatesForCountry(selectedCountry) : []
    const selectedState = states.find(state => state.state_code === value || state.name === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                    disabled={disabled || !selectedCountry || states.length === 0}
                >
                    {selectedState ? selectedState.name : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder="Search states..." />
                    <CommandList>
                        <CommandEmpty>No state found.</CommandEmpty>
                        <CommandGroup>
                            {states.map((state) => (
                                <CommandItem
                                    key={state.state_code}
                                    value={state.name}
                                    onSelect={() => {
                                        onValueChange(state.state_code)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === state.state_code ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <Badge variant="secondary" className="mr-2 text-xs">
                                        {state.state_code}
                                    </Badge>
                                    {state.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
} 