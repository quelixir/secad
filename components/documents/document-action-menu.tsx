"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Download,
  Edit,
  Trash2,
  Move,
  Eye,
} from "lucide-react";
import { useDocumentActionPermissions } from "@/lib/hooks/use-document-permissions";

interface DocumentActionMenuProps {
  document: any;
  onAction: (action: string, document: any) => void;
  trigger?: React.ReactNode;
}

export function DocumentActionMenu({ document, onAction, trigger }: DocumentActionMenuProps) {
  const permissions = useDocumentActionPermissions(document);

  // Don't show menu if user has no permissions
  if (!permissions.canView) {
    return null;
  }

  const hasAnyAction = permissions.canDownload || permissions.canEdit || permissions.canDelete || permissions.canMove;

  if (!hasAnyAction) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {permissions.canView && (
          <DropdownMenuItem onClick={() => onAction('view', document)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
        )}
        {permissions.canDownload && (
          <DropdownMenuItem onClick={() => onAction('download', document)}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
        )}
        {permissions.canEdit && (
          <DropdownMenuItem onClick={() => onAction('rename', document)}>
            <Edit className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
        )}
        {permissions.canMove && (
          <DropdownMenuItem onClick={() => onAction('move', document)}>
            <Move className="mr-2 h-4 w-4" />
            Move
          </DropdownMenuItem>
        )}
        {permissions.canDelete && (
          <DropdownMenuItem 
            onClick={() => onAction('delete', document)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}