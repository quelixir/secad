'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Search, Building2, Plus } from 'lucide-react'
import { cn, formatACN, formatABN } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useEntity } from '@/lib/entity-context'
import Link from 'next/link'

export function EntitySelector() {
  const { selectedEntity, setSelectedEntity, entities, loading } = useEntity()
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  // Filter entities based on search, limit to 5 results
  const filteredEntities = entities
    .filter((entity: any) =>
      entity.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      entity.abn?.includes(searchValue) ||
      entity.acn?.includes(searchValue)
    )
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md">
        <Building2 className="h-4 w-4 text-muted-foreground animate-pulse" />
        <span className="text-sm text-muted-foreground">Loading entities...</span>
      </div>
    )
  }

  if (entities.length === 0) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/entities">
          <Plus className="mr-2 h-4 w-4" />
          Add Entity
        </Link>
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[280px] justify-between"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            {selectedEntity ? (
              <div className="min-w-0">
                <div className="font-medium truncate">{selectedEntity.name}</div>
                <div className="text-xs text-muted-foreground">
                  {selectedEntity.entityType}
                  {selectedEntity.abn && ` • ABN: ${formatABN(selectedEntity.abn)}`}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">Select entity...</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search entities..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent px-0"
            />
          </div>
          <CommandList>
            <CommandEmpty>
              <div className="py-4 text-center">
                <div className="text-sm text-muted-foreground mb-2">
                  No entities found.
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/entities">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Entity
                  </Link>
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredEntities.map((entity) => (
                <CommandItem
                  key={entity.id}
                  value={entity.id}
                  onSelect={(currentValue: string) => {
                    const selected = entities.find(e => e.id === currentValue)
                    if (selected) {
                      setSelectedEntity(selected)
                    }
                    setOpen(false)
                    setSearchValue('')
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedEntity?.id === entity.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{entity.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {entity.entityType}
                      {entity.abn && ` • ABN: ${formatABN(entity.abn)}`}
                      {entity.acn && ` • ACN: ${formatACN(entity.acn)}`}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {searchValue && filteredEntities.length === 5 && (
              <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
                Showing first 5 results. Refine search for more options.
              </div>
            )}
            <div className="border-t p-2">
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href="/entities">
                  <Building2 className="mr-2 h-4 w-4" />
                  Manage Entities
                </Link>
              </Button>
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 