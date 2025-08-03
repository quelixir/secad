import { trpc } from "@/lib/trpc/client";
import type { Document, DocumentFolder } from "@/lib/generated/prisma";

// Document hooks
export function useDocuments(entityId: string, folderId?: string) {
  return trpc.documents.list.useQuery(
    { entityId, folderId },
    { 
      enabled: !!entityId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );
}

export function useDocument(id: string) {
  return trpc.documents.getById.useQuery(
    { id },
    { enabled: !!id }
  );
}

export function useCreateDocument() {
  const utils = trpc.useUtils();
  
  return trpc.documents.create.useMutation({
    onSuccess: (data: Document) => {
      // Invalidate documents list for the entity
      utils.documents.list.invalidate({ entityId: data.entityId });
      
      // Invalidate storage usage
      utils.documents.getStorageUsage.invalidate({ entityId: data.entityId });
    },
  });
}

export function useUpdateDocument() {
  const utils = trpc.useUtils();
  
  return trpc.documents.update.useMutation({
    onSuccess: (data: Document) => {
      // Invalidate documents list
      utils.documents.list.invalidate({ entityId: data.entityId });
      
      // Update the specific document in cache
      utils.documents.getById.setData({ id: data.id }, data);
    },
  });
}

export function useDeleteDocument() {
  const utils = trpc.useUtils();
  
  return trpc.documents.delete.useMutation({
    onSuccess: (_: any, variables: { id: string }) => {
      // Invalidate all documents lists
      utils.documents.list.invalidate();
      
      // Invalidate the specific document cache
      utils.documents.getById.invalidate({ id: variables.id });
      
      // Invalidate storage usage for all entities
      utils.documents.getStorageUsage.invalidate();
    },
  });
}

export function useMoveDocument() {
  const utils = trpc.useUtils();
  
  return trpc.documents.move.useMutation({
    onSuccess: (data: Document) => {
      // Invalidate documents list for the entity
      utils.documents.list.invalidate({ entityId: data.entityId });
      
      // Update the specific document in cache
      utils.documents.getById.setData({ id: data.id }, data);
    },
  });
}

export function useSearchDocuments(entityId: string, query: string, folderId?: string) {
  return trpc.documents.search.useQuery(
    { entityId, query, folderId },
    { 
      enabled: !!entityId && !!query && query.length > 0,
      staleTime: 1000 * 60 * 2, // 2 minutes
    }
  );
}

export function useGenerateDownloadUrl() {
  return trpc.documents.generateDownloadUrl.useMutation();
}

// Folder hooks
export function useFolders(entityId: string, parentId?: string) {
  return trpc.documents.folders.list.useQuery(
    { entityId, parentId },
    { 
      enabled: !!entityId,
      staleTime: 1000 * 60 * 10, // 10 minutes
    }
  );
}

export function useFolder(id: string) {
  return trpc.documents.folders.getById.useQuery(
    { id },
    { enabled: !!id }
  );
}

export function useCreateFolder() {
  const utils = trpc.useUtils();
  
  return trpc.documents.folders.create.useMutation({
    onSuccess: (data: DocumentFolder) => {
      // Invalidate folders list for the entity
      utils.documents.folders.list.invalidate({ entityId: data.entityId });
      
      // Invalidate hierarchy
      utils.documents.folders.getHierarchy.invalidate({ entityId: data.entityId });
    },
  });
}

export function useUpdateFolder() {
  const utils = trpc.useUtils();
  
  return trpc.documents.folders.update.useMutation({
    onSuccess: (data: DocumentFolder) => {
      // Invalidate folders list
      utils.documents.folders.list.invalidate({ entityId: data.entityId });
      
      // Update the specific folder in cache
      utils.documents.folders.getById.setData({ id: data.id }, data);
      
      // Invalidate hierarchy
      utils.documents.folders.getHierarchy.invalidate({ entityId: data.entityId });
    },
  });
}

export function useDeleteFolder() {
  const utils = trpc.useUtils();
  
  return trpc.documents.folders.delete.useMutation({
    onSuccess: (_: any, variables: { id: string }) => {
      // Invalidate all folders lists
      utils.documents.folders.list.invalidate();
      
      // Invalidate the specific folder cache
      utils.documents.folders.getById.invalidate({ id: variables.id });
      
      // Invalidate hierarchy for all entities
      utils.documents.folders.getHierarchy.invalidate();
    },
  });
}

export function useMoveFolder() {
  const utils = trpc.useUtils();
  
  return trpc.documents.folders.move.useMutation({
    onSuccess: (data: DocumentFolder) => {
      // Invalidate folders list for the entity
      utils.documents.folders.list.invalidate({ entityId: data.entityId });
      
      // Update the specific folder in cache
      utils.documents.folders.getById.setData({ id: data.id }, data);
      
      // Invalidate hierarchy
      utils.documents.folders.getHierarchy.invalidate({ entityId: data.entityId });
    },
  });
}

export function useFolderHierarchy(entityId: string) {
  return trpc.documents.folders.getHierarchy.useQuery(
    { entityId },
    { 
      enabled: !!entityId,
      staleTime: 1000 * 60 * 15, // 15 minutes
    }
  );
}

// Utility hooks
export function useStorageUsage(entityId: string) {
  return trpc.documents.getStorageUsage.useQuery(
    { entityId },
    { 
      enabled: !!entityId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );
}

export function useDocumentsConfig() {
  return trpc.documents.getConfig.useQuery(
    undefined,
    { 
      staleTime: 1000 * 60 * 60, // 1 hour
    }
  );
}