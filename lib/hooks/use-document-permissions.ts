import { useMemo } from "react";
import { useEntity } from "@/lib/entity-context";
import { trpc } from "@/lib/trpc/client";

export interface DocumentPermissions {
  canView: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCreateFolders: boolean;
  canManageFolders: boolean;
  role: string | null;
  isLoading: boolean;
}

export function useDocumentPermissions(): DocumentPermissions {
  const { selectedEntity } = useEntity();

  // Get user's access level for the selected entity
  const { data: entityAccess, isLoading } = trpc.entities.getUserAccess.useQuery(
    { entityId: selectedEntity?.id || "" },
    { 
      enabled: !!selectedEntity?.id,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  const permissions = useMemo(() => {
    if (isLoading || !entityAccess) {
      return {
        canView: false,
        canUpload: false,
        canEdit: false,
        canDelete: false,
        canCreateFolders: false,
        canManageFolders: false,
        role: null,
        isLoading: true,
      };
    }

    const role = entityAccess.role;

    // Define permissions based on role
    const basePermissions = {
      role,
      isLoading: false,
    };

    switch (role) {
      case "Admin":
        return {
          ...basePermissions,
          canView: true,
          canUpload: true,
          canEdit: true,
          canDelete: true,
          canCreateFolders: true,
          canManageFolders: true,
        };

      case "Editor":
        return {
          ...basePermissions,
          canView: true,
          canUpload: true,
          canEdit: true,
          canDelete: true, // Editors can delete documents they have access to
          canCreateFolders: true,
          canManageFolders: true,
        };

      case "Viewer":
        return {
          ...basePermissions,
          canView: true,
          canUpload: false,
          canEdit: false,
          canDelete: false,
          canCreateFolders: false,
          canManageFolders: false,
        };

      default:
        // No access or unknown role
        return {
          ...basePermissions,
          canView: false,
          canUpload: false,
          canEdit: false,
          canDelete: false,
          canCreateFolders: false,
          canManageFolders: false,
        };
    }
  }, [entityAccess, isLoading]);

  return permissions;
}

// Hook to check specific document permissions
export function useDocumentActionPermissions(document?: any) {
  const permissions = useDocumentPermissions();

  return useMemo(() => {
    if (!document || !permissions.canView) {
      return {
        canView: false,
        canDownload: false,
        canEdit: false,
        canDelete: false,
        canMove: false,
      };
    }

    return {
      canView: permissions.canView,
      canDownload: permissions.canView, // Viewers can download
      canEdit: permissions.canEdit,
      canDelete: permissions.canDelete,
      canMove: permissions.canEdit, // Moving requires edit permissions
    };
  }, [permissions, document]);
}

// Hook to check folder permissions
export function useFolderPermissions() {
  const permissions = useDocumentPermissions();

  return {
    canRenameFolders: permissions.canManageFolders,
    canDeleteFolders: permissions.canManageFolders,
    canMoveFolders: permissions.canManageFolders,
    ...permissions,
  };
}