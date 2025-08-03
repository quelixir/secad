import { prisma } from "@/lib/db";
import { getFileProvider } from "@/lib/file-providers";
import { getDocumentsAllowedFileTypes } from "@/lib/config";
import type { Document, DocumentFolder } from "@/lib/generated/prisma";

export interface CreateDocumentData {
  entityId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  uploadKey: string;
  folderId?: string;
  description?: string;
  tags?: string[];
  uploadedBy: string;
}

export interface CreateFolderData {
  entityId: string;
  name: string;
  description?: string;
  parentId?: string;
  createdBy: string;
}

export class DocumentService {
  private fileProvider = getFileProvider();

  // Document operations
  async createDocument(data: CreateDocumentData): Promise<Document> {
    return await prisma.document.create({
      data: {
        entityId: data.entityId,
        fileName: data.fileName,
        originalName: data.originalName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        fileUrl: data.fileUrl,
        uploadKey: data.uploadKey,
        folderId: data.folderId || null,
        description: data.description || null,
        tags: data.tags || [],
        uploadedBy: data.uploadedBy,
      },
    });
  }

  async getDocuments(entityId: string, folderId?: string): Promise<Document[]> {
    return await prisma.document.findMany({
      where: {
        entityId,
        folderId: folderId || null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getDocumentById(id: string): Promise<Document | null> {
    return await prisma.document.findUnique({
      where: { id },
    });
  }

  async updateDocument(
    id: string, 
    data: Partial<Pick<Document, "fileName" | "description" | "tags" | "folderId">>
  ): Promise<Document> {
    return await prisma.document.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async deleteDocument(id: string): Promise<void> {
    const document = await this.getDocumentById(id);
    if (!document) {
      throw new Error("Document not found");
    }

    // Delete from file provider
    try {
      await this.fileProvider.deleteFile(document.uploadKey);
    } catch (error) {
      console.warn(`Failed to delete file from provider: ${error}`);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.document.delete({
      where: { id },
    });
  }

  async moveDocument(id: string, targetFolderId?: string): Promise<Document> {
    return await this.updateDocument(id, { folderId: targetFolderId || null });
  }

  async searchDocuments(
    entityId: string, 
    query: string,
    folderId?: string
  ): Promise<Document[]> {
    return await prisma.document.findMany({
      where: {
        entityId,
        folderId: folderId || null,
        OR: [
          { fileName: { contains: query, mode: "insensitive" } },
          { originalName: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { tags: { has: query } },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // Folder operations
  async createFolder(data: CreateFolderData): Promise<DocumentFolder> {
    // Check for duplicate folder names in the same parent
    const existing = await prisma.documentFolder.findFirst({
      where: {
        entityId: data.entityId,
        parentId: data.parentId || null,
        name: data.name,
      },
    });

    if (existing) {
      throw new Error("A folder with this name already exists in this location");
    }

    return await prisma.documentFolder.create({
      data: {
        entityId: data.entityId,
        name: data.name,
        description: data.description || null,
        parentId: data.parentId || null,
        createdBy: data.createdBy,
      },
    });
  }

  async getFolders(entityId: string, parentId?: string): Promise<DocumentFolder[]> {
    return await prisma.documentFolder.findMany({
      where: {
        entityId,
        parentId: parentId || null,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async getFolderById(id: string): Promise<DocumentFolder | null> {
    return await prisma.documentFolder.findUnique({
      where: { id },
    });
  }

  async updateFolder(
    id: string, 
    data: Partial<Pick<DocumentFolder, "name" | "description">>
  ): Promise<DocumentFolder> {
    return await prisma.documentFolder.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async deleteFolder(id: string): Promise<void> {
    // Check if folder has contents
    const [documents, subfolders] = await Promise.all([
      prisma.document.findMany({ where: { folderId: id } }),
      prisma.documentFolder.findMany({ where: { parentId: id } }),
    ]);

    if (documents.length > 0 || subfolders.length > 0) {
      throw new Error("Cannot delete folder that contains documents or subfolders");
    }

    await prisma.documentFolder.delete({
      where: { id },
    });
  }

  async moveFolder(id: string, targetParentId?: string): Promise<DocumentFolder> {
    const folder = await this.getFolderById(id);
    if (!folder) {
      throw new Error("Folder not found");
    }

    // Prevent moving folder into itself or its descendants
    if (targetParentId && await this.isDescendantFolder(id, targetParentId)) {
      throw new Error("Cannot move folder into itself or its descendants");
    }

    return await prisma.documentFolder.update({
      where: { id },
      data: {
        parentId: targetParentId || null,
        updatedAt: new Date(),
      },
    });
  }

  async getFolderHierarchy(entityId: string): Promise<DocumentFolder[]> {
    return await prisma.documentFolder.findMany({
      where: { entityId },
      orderBy: [
        { parentId: "asc" },
        { name: "asc" },
      ],
    });
  }

  // Utility methods
  async isDescendantFolder(ancestorId: string, descendantId: string): Promise<boolean> {
    const descendant = await this.getFolderById(descendantId);
    if (!descendant) return false;
    
    if (descendant.parentId === ancestorId) return true;
    if (!descendant.parentId) return false;
    
    return await this.isDescendantFolder(ancestorId, descendant.parentId);
  }

  async validateFileType(fileName: string): Promise<boolean> {
    const allowedTypes = getDocumentsAllowedFileTypes();
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    
    if (!fileExtension) {
      return false;
    }
    
    return allowedTypes.includes(fileExtension);
  }

  async generateDownloadUrl(document: Document): Promise<string> {
    return await this.fileProvider.generateDownloadUrl(document.uploadKey);
  }

  async getEntityStorageUsage(entityId: string): Promise<number> {
    const result = await prisma.document.aggregate({
      where: { entityId },
      _sum: {
        fileSize: true,
      },
    });

    return result._sum.fileSize || 0;
  }
}