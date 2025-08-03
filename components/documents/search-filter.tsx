"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  X,
  Calendar,
  FileType,
  User,
  FolderOpen,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEntity } from "@/lib/entity-context";
import { useFolders } from "@/lib/hooks/use-documents";

const searchFilterSchema = z.object({
  query: z.string(),
  fileType: z.string().optional(),
  dateRange: z.string().optional(),
  minSize: z.string().optional(),
  maxSize: z.string().optional(),
  folderId: z.string().optional(),
});

type SearchFilterFormData = z.infer<typeof searchFilterSchema>;

interface SearchFilterProps {
  onSearch: (filters: SearchFilterFormData) => void;
  onClear: () => void;
  selectedFolder?: string | null;
}

const FILE_TYPES = [
  { value: "pdf", label: "PDF Documents" },
  { value: "doc,docx", label: "Word Documents" },
  { value: "xls,xlsx,csv", label: "Spreadsheets" },
  { value: "jpg,jpeg,png,gif,webp", label: "Images" },
  { value: "txt,rtf", label: "Text Files" },
  { value: "zip,rar", label: "Archives" },
];

const DATE_RANGES = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
];

const SIZE_RANGES = [
  { value: "0,1", label: "Less than 1 MB" },
  { value: "1,10", label: "1-10 MB" },
  { value: "10,50", label: "10-50 MB" },
  { value: "50,100", label: "50-100 MB" },
  { value: "100,", label: "More than 100 MB" },
];

export function SearchFilter({ onSearch, onClear, selectedFolder }: SearchFilterProps) {
  const { selectedEntity } = useEntity();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const { data: folders } = useFolders(selectedEntity?.id || "");

  const form = useForm<SearchFilterFormData>({
    resolver: zodResolver(searchFilterSchema),
    defaultValues: {
      query: "",
      fileType: "",
      dateRange: "",
      minSize: "",
      maxSize: "",
      folderId: selectedFolder || "",
    },
  });

  // Update form when selectedFolder changes
  useEffect(() => {
    form.setValue("folderId", selectedFolder || "");
  }, [selectedFolder, form]);

  const handleSearchSubmit = () => {
    const formData = form.getValues();
    formData.query = searchQuery;
    
    // Handle size range parsing
    if (formData.minSize && formData.minSize.includes(",")) {
      const [min, max] = formData.minSize.split(",");
      formData.minSize = min || "";
      formData.maxSize = max || "";
    }

    onSearch(formData);
    
    // Update active filters for display
    const filters: Record<string, string> = {};
    if (searchQuery) filters.search = searchQuery;
    if (formData.fileType) filters.fileType = FILE_TYPES.find(t => t.value === formData.fileType)?.label || formData.fileType;
    if (formData.dateRange) filters.dateRange = DATE_RANGES.find(d => d.value === formData.dateRange)?.label || formData.dateRange;
    if (formData.minSize || formData.maxSize) {
      const sizeLabel = SIZE_RANGES.find(s => s.value === `${formData.minSize || ""},${formData.maxSize || ""}`)?.label;
      if (sizeLabel) filters.size = sizeLabel;
    }
    if (formData.folderId && formData.folderId !== selectedFolder) {
      const folder = folders?.find(f => f.id === formData.folderId);
      if (folder) filters.folder = folder.name;
    }
    
    setActiveFilters(filters);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    form.reset({
      query: "",
      fileType: "",
      dateRange: "",
      minSize: "",
      maxSize: "",
      folderId: selectedFolder || "",
    });
    setActiveFilters({});
    onClear();
  };

  const handleQuickSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const removeFilter = (filterKey: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[filterKey];
    setActiveFilters(newFilters);

    // Reset the corresponding form field
    switch (filterKey) {
      case "search":
        setSearchQuery("");
        form.setValue("query", "");
        break;
      case "fileType":
        form.setValue("fileType", "");
        break;
      case "dateRange":
        form.setValue("dateRange", "");
        break;
      case "size":
        form.setValue("minSize", "");
        form.setValue("maxSize", "");
        break;
      case "folder":
        form.setValue("folderId", selectedFolder || "");
        break;
    }

    // Re-submit search with updated filters
    setTimeout(() => handleSearchSubmit(), 0);
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Main Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents by name or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleQuickSearch}
                className="pl-10"
              />
            </div>
            
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="px-3">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2 px-1 min-w-[1.2rem] h-5">
                      {Object.keys(activeFilters).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filters</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="h-6 px-2 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>

                  <Form {...form}>
                    <div className="space-y-3">
                      {/* File Type Filter */}
                      <FormField
                        control={form.control}
                        name="fileType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium flex items-center gap-1">
                              <FileType className="h-3 w-3" />
                              File Type
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Any type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Any type</SelectItem>
                                {FILE_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      {/* Date Range Filter */}
                      <FormField
                        control={form.control}
                        name="dateRange"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Date Range
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Any time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Any time</SelectItem>
                                {DATE_RANGES.map((range) => (
                                  <SelectItem key={range.value} value={range.value}>
                                    {range.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      {/* File Size Filter */}
                      <FormField
                        control={form.control}
                        name="minSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium">File Size</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Any size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Any size</SelectItem>
                                {SIZE_RANGES.map((size) => (
                                  <SelectItem key={size.value} value={size.value}>
                                    {size.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      {/* Folder Filter (only show if different from selected folder) */}
                      <FormField
                        control={form.control}
                        name="folderId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium flex items-center gap-1">
                              <FolderOpen className="h-3 w-3" />
                              Search in Folder
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Current location" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">All folders</SelectItem>
                                {folders?.map((folder) => (
                                  <SelectItem key={folder.id} value={folder.id}>
                                    {folder.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFilterOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="button" size="sm" onClick={handleSearchSubmit}>
                        Apply Filters
                      </Button>
                    </div>
                  </Form>
                </div>
              </PopoverContent>
            </Popover>

            <Button onClick={handleSearchSubmit} size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {Object.entries(activeFilters).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {value}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-auto p-0 hover:bg-transparent"
                    onClick={() => removeFilter(key)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs h-6 px-2"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}