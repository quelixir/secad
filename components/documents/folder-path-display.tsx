"use client";

import { useMemo } from "react";
import { Home, FolderOpen, ChevronRight } from "lucide-react";
import { useFolders } from "@/lib/hooks/use-documents";
import { useEntity } from "@/lib/entity-context";

interface FolderPathDisplayProps {
  selectedFolder: string | null;
  showRoot?: boolean;
  className?: string;
}

export function FolderPathDisplay({ 
  selectedFolder, 
  showRoot = false,
  className 
}: FolderPathDisplayProps) {
  const { selectedEntity } = useEntity();
  const { data: folders } = useFolders(selectedEntity?.id || "");

  const folderPath = useMemo(() => {
    if (!folders || !selectedFolder) {
      return showRoot ? [{ id: null, name: "All Documents" }] : [];
    }

    const folderMap = new Map(folders.map(f => [f.id, f]));
    const path: Array<{ id: string | null; name: string }> = [];
    
    if (showRoot) {
      path.push({ id: null, name: "All Documents" });
    }

    let currentFolder = folderMap.get(selectedFolder);
    const folderHierarchy: typeof folders = [];
    
    while (currentFolder) {
      folderHierarchy.unshift(currentFolder);
      currentFolder = currentFolder.parentId ? folderMap.get(currentFolder.parentId) : undefined;
    }

    folderHierarchy.forEach(folder => {
      path.push({ id: folder.id, name: folder.name });
    });

    return path;
  }, [selectedFolder, folders, showRoot]);

  if (folderPath.length === 0) {
    return null;
  }

  if (folderPath.length === 1 && !showRoot) {
    return null;
  }

  return (
    <div className={`flex items-center text-sm text-muted-foreground ${className}`}>
      {folderPath.map((folder, index) => (
        <div key={folder.id || "root"} className="flex items-center">
          {index > 0 && <ChevronRight className="h-3 w-3 mx-1" />}
          <div className="flex items-center space-x-1">
            {folder.id === null ? (
              <Home className="h-3 w-3" />
            ) : (
              <FolderOpen className="h-3 w-3 text-blue-500" />
            )}
            <span className="truncate max-w-32">{folder.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}