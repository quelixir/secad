"use client";

import { useState, useEffect } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Home,
  FolderOpen,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useFolders } from "@/lib/hooks/use-documents";
import { useEntity } from "@/lib/entity-context";
import { BreadcrumbSkeleton } from "./loading-states";

interface BreadcrumbItem {
  id: string | null;
  name: string;
  description?: string;
  isClickable: boolean;
}

interface BreadcrumbNavigationProps {
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
  className?: string;
}

export function BreadcrumbNavigation({ 
  selectedFolder, 
  onFolderSelect, 
  className 
}: BreadcrumbNavigationProps) {
  const { selectedEntity } = useEntity();
  const { data: folders, isLoading } = useFolders(selectedEntity?.id || "");
  const [breadcrumbPath, setBreadcrumbPath] = useState<BreadcrumbItem[]>([]);

  // Build breadcrumb path whenever selectedFolder or folders change
  useEffect(() => {
    if (!folders) {
      setBreadcrumbPath([{ id: null, name: "All Documents", isClickable: true }]);
      return;
    }

    // Always start with root
    const path: BreadcrumbItem[] = [
      { id: null, name: "All Documents", isClickable: selectedFolder !== null }
    ];

    if (selectedFolder) {
      // Find the selected folder and build path to root
      const folderMap = new Map(folders.map(f => [f.id, f]));
      const folderPath: typeof folders = [];
      
      let currentFolder = folderMap.get(selectedFolder);
      while (currentFolder) {
        folderPath.unshift(currentFolder);
        currentFolder = currentFolder.parentId ? folderMap.get(currentFolder.parentId) : undefined;
      }

      // Add folder path to breadcrumb
      folderPath.forEach((folder, index) => {
        path.push({
          id: folder.id,
          name: folder.name,
          description: folder.description || undefined,
          isClickable: index < folderPath.length - 1, // Last item (current) is not clickable
        });
      });
    }

    setBreadcrumbPath(path);
  }, [selectedFolder, folders]);

  // Handle condensed breadcrumbs for long paths
  const getDisplayPath = () => {
    if (breadcrumbPath.length <= 4) {
      return breadcrumbPath;
    }

    // Show: Root + ... + Parent + Current
    return [
      breadcrumbPath[0], // Root
      { id: "ellipsis", name: "...", isClickable: false }, // Ellipsis
      ...breadcrumbPath.slice(-2), // Last two items
    ];
  };

  const getHiddenItems = () => {
    if (breadcrumbPath.length <= 4) {
      return [];
    }
    return breadcrumbPath.slice(1, -2); // Items between root and last two
  };

  const displayPath = getDisplayPath();
  const hiddenItems = getHiddenItems();

  if (isLoading) {
    return (
      <div className={cn("flex items-center space-x-1", className)}>
        <BreadcrumbSkeleton />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <TooltipProvider>
        <Breadcrumb>
          <BreadcrumbList>
          {displayPath.map((item, index) => (
            <BreadcrumbItem key={item.id || "root"}>
              {index > 0 && <BreadcrumbSeparator />}
              
              {item.id === "ellipsis" ? (
                // Dropdown for hidden items
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 text-muted-foreground hover:text-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {hiddenItems.map((hiddenItem) => (
                      <DropdownMenuItem
                        key={hiddenItem.id}
                        onClick={() => onFolderSelect(hiddenItem.id)}
                        className="flex items-center space-x-2"
                      >
                        <FolderOpen className="h-4 w-4 text-blue-500" />
                        <span className="truncate">{hiddenItem.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : item.isClickable ? (
                item.description ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <BreadcrumbLink
                        onClick={() => onFolderSelect(item.id)}
                        className="flex items-center space-x-1 cursor-pointer hover:text-foreground"
                      >
                        {item.id === null ? (
                          <Home className="h-4 w-4" />
                        ) : (
                          <FolderOpen className="h-4 w-4 text-blue-500" />
                        )}
                        <span>{item.name}</span>
                      </BreadcrumbLink>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <BreadcrumbLink
                    onClick={() => onFolderSelect(item.id)}
                    className="flex items-center space-x-1 cursor-pointer hover:text-foreground"
                  >
                    {item.id === null ? (
                      <Home className="h-4 w-4" />
                    ) : (
                      <FolderOpen className="h-4 w-4 text-blue-500" />
                    )}
                    <span>{item.name}</span>
                  </BreadcrumbLink>
                )
              ) : (
                item.description ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center space-x-1 text-foreground font-medium cursor-help">
                        {item.id === null ? (
                          <Home className="h-4 w-4" />
                        ) : (
                          <FolderOpen className="h-4 w-4 text-blue-500" />
                        )}
                        <span>{item.name}</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <span className="flex items-center space-x-1 text-foreground font-medium">
                    {item.id === null ? (
                      <Home className="h-4 w-4" />
                    ) : (
                      <FolderOpen className="h-4 w-4 text-blue-500" />
                    )}
                    <span>{item.name}</span>
                  </span>
                )
              )}
            </BreadcrumbItem>
          ))}
          </BreadcrumbList>
        </Breadcrumb>
      </TooltipProvider>
    </div>
  );
}