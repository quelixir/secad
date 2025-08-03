import { useState, useEffect, useMemo } from "react";
import { useSearchDocuments, useDocuments } from "./use-documents";

export interface SearchFilters {
  query?: string;
  fileType?: string;
  dateRange?: string;
  minSize?: string;
  maxSize?: string;
  folderId?: string;
}

export function useDocumentSearch(entityId: string, currentFolderId?: string) {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isSearching, setIsSearching] = useState(false);

  // Use search query when we have a text query
  const searchQuery = filters.query && filters.query.trim().length > 0 ? filters.query.trim() : "";
  
  const { data: searchResults, isLoading: searchLoading } = useSearchDocuments(
    entityId,
    searchQuery,
    filters.folderId || currentFolderId
  );

  // Use regular document list when no search query
  const { data: allDocuments, isLoading: documentsLoading } = useDocuments(
    entityId,
    filters.folderId || currentFolderId
  );

  // Determine which data source to use
  const rawDocuments = searchQuery ? searchResults : allDocuments;
  const isLoading = searchQuery ? searchLoading : documentsLoading;

  // Apply client-side filters to the results
  const filteredDocuments = useMemo(() => {
    if (!rawDocuments) return [];

    let filtered = [...rawDocuments];

    // File type filter
    if (filters.fileType) {
      const allowedTypes = filters.fileType.split(',').map(t => t.trim().toLowerCase());
      filtered = filtered.filter(doc => {
        const extension = doc.fileName.split('.').pop()?.toLowerCase() || '';
        return allowedTypes.includes(extension) || 
               allowedTypes.some(type => doc.mimeType.toLowerCase().includes(type));
      });
    }

    // Date range filter
    if (filters.dateRange) {
      const now = new Date();
      let cutoffDate: Date;

      switch (filters.dateRange) {
        case 'today':
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarterStart = Math.floor(now.getMonth() / 3) * 3;
          cutoffDate = new Date(now.getFullYear(), quarterStart, 1);
          break;
        case 'year':
          cutoffDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          cutoffDate = new Date(0);
      }

      filtered = filtered.filter(doc => new Date(doc.createdAt) >= cutoffDate);
    }

    // File size filter
    if (filters.minSize || filters.maxSize) {
      const minBytes = filters.minSize ? parseFloat(filters.minSize) * 1024 * 1024 : 0;
      const maxBytes = filters.maxSize ? parseFloat(filters.maxSize) * 1024 * 1024 : Infinity;

      filtered = filtered.filter(doc => {
        return doc.fileSize >= minBytes && doc.fileSize <= maxBytes;
      });
    }

    return filtered;
  }, [rawDocuments, filters]);

  const applyFilters = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setIsSearching(Object.keys(newFilters).some(key => 
      newFilters[key as keyof SearchFilters] && 
      newFilters[key as keyof SearchFilters] !== ""
    ));
  };

  const clearFilters = () => {
    setFilters({});
    setIsSearching(false);
  };

  return {
    documents: filteredDocuments,
    isLoading,
    isSearching,
    filters,
    applyFilters,
    clearFilters,
    totalResults: filteredDocuments.length,
  };
}