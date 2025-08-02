"use client";

import { useState } from "react";
import { useEntityTypesByCountry } from "@/lib/compliance/hooks";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FormControl } from "./form";
import { cn } from "@/lib/utils";

interface EntityTypeSelectProps {
  field: any;
  selectedCountry?: string;
}

export function EntityTypeSelect({
  field,
  selectedCountry,
}: EntityTypeSelectProps) {
  const { entityTypes, loading } = useEntityTypesByCountry(selectedCountry);
  const [open, setOpen] = useState(false);

  if (loading) {
    return <div>Loading entity types...</div>;
  }

  const selectedEntityType = entityTypes.find(
    (type) => type.id === field.value
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedEntityType ? (
              <span className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {selectedEntityType.shortCode}
                </Badge>
                <span>{selectedEntityType.name}</span>
              </span>
            ) : (
              "Select an entity type"
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search entity types..." />
          <CommandList>
            <CommandEmpty>No entity type found.</CommandEmpty>
            <CommandGroup>
              {entityTypes.map((type) => (
                <CommandItem
                  key={type.id}
                  value={type.name}
                  onSelect={() => {
                    field.onChange(type.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      field.value === type.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Badge variant="secondary" className="mr-2 text-xs">
                    {type.shortCode}
                  </Badge>
                  {type.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
