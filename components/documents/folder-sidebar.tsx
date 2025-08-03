"use client";

import { useState } from "react";
import {
  FolderOpen,
  FolderPlus,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CreateFolderDialog } from "./create-folder-dialog";
import { RenameFolderDialog } from "./rename-folder-dialog";
import { DeleteFolderDialog } from "./delete-folder-dialog";
import { useFolders, useCreateFolder, useUpdateFolder, useDeleteFolder } from "@/lib/hooks/use-documents";
import { useEntity } from "@/lib/entity-context";
import { useFolderPermissions } from "@/lib/hooks/use-document-permissions";
import { FolderSidebarSkeleton, InlineLoading } from "./loading-states";

interface FolderSidebarProps {
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

interface FolderTreeItemProps {
  folder: any;
  level: number;
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onRename: (folder: any) => void;
  onDelete: (folder: any) => void;
  permissions: any;
}

function FolderTreeItem({
  folder,
  level,
  selectedFolder,
  onFolderSelect,
  onRename,
  onDelete,
  permissions,
}: FolderTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center justify-between hover:bg-accent hover:text-accent-foreground transition-colors",
          selectedFolder === folder.id && "bg-accent text-accent-foreground"
        )}
        style={{ paddingLeft: `${level * 12 + 16}px` }}
      >
        <button
          onClick={() => onFolderSelect(folder.id)}
          className="flex-1 flex items-center gap-2 py-2 text-left text-sm"
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          <FolderOpen className="h-4 w-4 text-blue-500" />
          <span className="truncate">{folder.name}</span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 mr-2"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {permissions.canRenameFolders && (
              <DropdownMenuItem onClick={() => onRename(folder)}>
                <Edit className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
            )}
            {permissions.canDeleteFolders && (
              <DropdownMenuItem
                onClick={() => onDelete(folder)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {folder.children.map((child: any) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              level={level + 1}
              selectedFolder={selectedFolder}
              onFolderSelect={onFolderSelect}
              onRename={onRename}
              onDelete={onDelete}
              permissions={permissions}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderSidebar({ selectedFolder, onFolderSelect }: FolderSidebarProps) {
  const { selectedEntity } = useEntity();
  const permissions = useFolderPermissions();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFolderForAction, setSelectedFolderForAction] = useState<any>(null);

  const { data: folders, isLoading: foldersLoading } = useFolders(
    selectedEntity?.id || ""
  );

  const handleRename = (folder: any) => {
    setSelectedFolderForAction(folder);
    setRenameDialogOpen(true);
  };

  const handleDelete = (folder: any) => {
    setSelectedFolderForAction(folder);
    setDeleteDialogOpen(true);
  };

  const buildFolderTree = (folders: any[]) => {
    const folderMap = new Map();
    const rootFolders: any[] = [];

    // Create folder map
    folders.forEach((folder) => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Build tree structure
    folders.forEach((folder) => {
      const folderWithChildren = folderMap.get(folder.id);
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children.push(folderWithChildren);
        }
      } else {
        rootFolders.push(folderWithChildren);
      }
    });

    return rootFolders;
  };

  const folderTree = folders ? buildFolderTree(folders) : [];

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Folders
            </CardTitle>
            {permissions.canCreateFolders && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
                className="h-6 w-6 p-0"
              >
                <FolderPlus className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1">
            {/* Root folder */}
            <button
              onClick={() => onFolderSelect(null)}
              className={cn(
                "w-full px-4 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2",
                selectedFolder === null && "bg-accent text-accent-foreground"
              )}
            >
              <FolderOpen className="h-4 w-4" />
              All Documents
            </button>

            {/* Custom folders */}
            {foldersLoading ? (
              <div className="px-4 py-2 text-xs text-muted-foreground flex items-center gap-2">
                <InlineLoading size="xs" />
                Loading folders...
              </div>
            ) : folderTree.length > 0 ? (
              folderTree.map((folder) => (
                <FolderTreeItem
                  key={folder.id}
                  folder={folder}
                  level={0}
                  selectedFolder={selectedFolder}
                  onFolderSelect={onFolderSelect}
                  onRename={handleRename}
                  onDelete={handleDelete}
                  permissions={permissions}
                />
              ))
            ) : (
              <div className="px-4 py-2 text-xs text-muted-foreground">
                No custom folders yet
              </div>
            )}

            {/* Create folder button */}
            <div className="px-4 py-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setCreateDialogOpen(true)}
              >
                <FolderPlus className="mr-1 h-3 w-3" />
                Create Folder
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateFolderDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        parentId={selectedFolder}
      />

      <RenameFolderDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        folder={selectedFolderForAction}
      />

      <DeleteFolderDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        folder={selectedFolderForAction}
      />
    </>
  );
}