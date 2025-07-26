'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Countries, getCountryByName } from '@/lib/Countries'
import { cn } from '@/lib/utils'
import 'flag-icons/css/flag-icons.min.css'

interface CountrySelectProps {
    value?: string
    onValueChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

export function CountrySelect({
    value,
    onValueChange,
    placeholder = "Select country...",
    disabled = false,
    className
}: CountrySelectProps) {
    const [open, setOpen] = useState(false)

    const selectedCountry = value ? getCountryByName(value) : null

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                    disabled={disabled}
                >
                    {selectedCountry ? (
                        <span className="flex items-center gap-2">
                            <span className={`fi fi-${selectedCountry.iso2.toLowerCase()}`}></span>
                            <span>{selectedCountry.name}</span>
                        </span>
                    ) : (
                        placeholder
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder="Search countries..." />
                    <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup>
                            {Countries.map((country) => (
                                <CommandItem
                                    key={country.name}
                                    value={country.name}
                                    onSelect={() => {
                                        onValueChange(country.name)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === country.name ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <span className={`fi fi-${country.iso2.toLowerCase()} mr-2`}></span>
                                    {country.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
} 