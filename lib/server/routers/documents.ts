import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/lib/trpc";
import { TRPCError } from "@trpc/server";
import { DocumentService } from "@/lib/services/document-service";
import { prisma } from "@/lib/db";
import { 
  getDocumentsAllowedFileTypes, 
  getDocumentsMaxFileSizeMB,
  getDocumentsMaxEntityStorageGB 
} from "@/lib/config";
import { 
  validateFile, 
  validateFilename, 
  isFileTypeAllowed, 
  isFileSizeValid,
  isMimeTypeValid,
  formatFileSize 
} from "@/lib/validation/file-validation";

// Initialize document service
const documentService = new DocumentService();

// Validation schemas
const createDocumentSchema = z.object({
  entityId: z.string().min(1, "Entity ID is required"),
  fileName: z.string().min(1, "File name is required"),
  originalName: z.string().min(1, "Original name is required"),
  fileSize: z.number().min(1, "File size must be greater than 0"),
  mimeType: z.string().min(1, "MIME type is required"),
  fileUrl: z.string().url("Valid file URL is required"),
  uploadKey: z.string().min(1, "Upload key is required"),
  folderId: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updateDocumentSchema = z.object({
  id: z.string().min(1, "Document ID is required"),
  fileName: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folderId: z.string().optional(),
});

const createFolderSchema = z.object({
  entityId: z.string().min(1, "Entity ID is required"),
  name: z.string().min(1, "Folder name is required").refine((name) => {
    const validation = validateFilename(name);
    return validation.isValid;
  }, {
    message: "Invalid folder name: contains invalid characters or reserved names",
  }),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

const updateFolderSchema = z.object({
  id: z.string().min(1, "Folder ID is required"),
  name: z.string().optional().refine((name) => {
    if (!name) return true; // Optional field
    const validation = validateFilename(name);
    return validation.isValid;
  }, {
    message: "Invalid folder name: contains invalid characters or reserved names",
  }),
  description: z.string().optional(),
});

// Helper function to check entity access
async function checkEntityAccess(userId: string, entityId: string) {
  const access = await prisma.userEntityAccess.findFirst({
    where: {
      userId,
      entityId,
    },
  });

  if (!access) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this entity",
    });
  }

  return access;
}

// Helper function to check write permissions
function checkWritePermission(role: string) {
  if (!["Admin", "Editor"].includes(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to modify documents in this entity",
    });
  }
}

export const documentsRouter = createTRPCRouter({
  // Document operations
  list: protectedProcedure
    .input(z.object({
      entityId: z.string(),
      folderId: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const access = await checkEntityAccess(ctx.session.user.id, input.entityId);
      
      const documents = await documentService.getDocuments(
        input.entityId,
        input.folderId
      );

      return documents;
    }),

  getById: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const document = await documentService.getDocumentById(input.id);
      
      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      // Check entity access
      await checkEntityAccess(ctx.session.user.id, document.entityId);

      return document;
    }),

  create: protectedProcedure
    .input(createDocumentSchema)
    .mutation(async ({ input, ctx }) => {
      const access = await checkEntityAccess(ctx.session.user.id, input.entityId);
      checkWritePermission(access.role);

      // Enhanced file validation using our validation utility
      const filenameValidation = validateFilename(input.fileName);
      if (!filenameValidation.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid filename: ${filenameValidation.errors.join(', ')}`,
        });
      }

      // Validate file type
      if (!isFileTypeAllowed(input.fileName)) {
        const allowedTypes = getDocumentsAllowedFileTypes();
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`,
        });
      }

      // Validate file size
      if (!isFileSizeValid(input.fileSize)) {
        const maxSizeMB = getDocumentsMaxFileSizeMB();
        const fileSizeMB = (input.fileSize / (1024 * 1024)).toFixed(2);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
        });
      }

      // Validate MIME type consistency
      if (!isMimeTypeValid(input.fileName, input.mimeType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `File MIME type '${input.mimeType}' does not match file extension. This could indicate a security risk.`,
        });
      }

      // Check entity storage limit
      const currentUsage = await documentService.getEntityStorageUsage(input.entityId);
      const maxStorageBytes = getDocumentsMaxEntityStorageGB() * 1024 * 1024 * 1024;
      
      if (currentUsage + input.fileSize > maxStorageBytes) {
        const currentUsageFormatted = formatFileSize(currentUsage);
        const fileSizeFormatted = formatFileSize(input.fileSize);
        const maxStorageGB = getDocumentsMaxEntityStorageGB();
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Entity storage limit exceeded. Current usage: ${currentUsageFormatted}, file size: ${fileSizeFormatted}, maximum allowed: ${maxStorageGB}GB`,
        });
      }

      // If folderId is provided, verify it exists and belongs to the entity
      if (input.folderId) {
        const folder = await documentService.getFolderById(input.folderId);
        if (!folder || folder.entityId !== input.entityId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid folder ID",
          });
        }
      }

      const document = await documentService.createDocument({
        ...input,
        uploadedBy: ctx.session.user.id,
      });

      return document;
    }),

  update: protectedProcedure
    .input(updateDocumentSchema)
    .mutation(async ({ input, ctx }) => {
      const document = await documentService.getDocumentById(input.id);
      
      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      const access = await checkEntityAccess(ctx.session.user.id, document.entityId);
      checkWritePermission(access.role);

      // If folderId is being updated, verify it exists and belongs to the entity
      if (input.folderId !== undefined) {
        if (input.folderId) {
          const folder = await documentService.getFolderById(input.folderId);
          if (!folder || folder.entityId !== document.entityId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid folder ID",
            });
          }
        }
      }

      const updatedDocument = await documentService.updateDocument(input.id, {
        fileName: input.fileName,
        description: input.description,
        tags: input.tags,
        folderId: input.folderId,
      });

      return updatedDocument;
    }),

  delete: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const document = await documentService.getDocumentById(input.id);
      
      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      const access = await checkEntityAccess(ctx.session.user.id, document.entityId);
      checkWritePermission(access.role);

      await documentService.deleteDocument(input.id);

      return { success: true };
    }),

  move: protectedProcedure
    .input(z.object({
      id: z.string(),
      targetFolderId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const document = await documentService.getDocumentById(input.id);
      
      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      const access = await checkEntityAccess(ctx.session.user.id, document.entityId);
      checkWritePermission(access.role);

      // If targetFolderId is provided, verify it exists and belongs to the entity
      if (input.targetFolderId) {
        const folder = await documentService.getFolderById(input.targetFolderId);
        if (!folder || folder.entityId !== document.entityId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid target folder ID",
          });
        }
      }

      const updatedDocument = await documentService.moveDocument(
        input.id,
        input.targetFolderId
      );

      return updatedDocument;
    }),

  search: protectedProcedure
    .input(z.object({
      entityId: z.string(),
      query: z.string().min(1, "Search query is required"),
      folderId: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const access = await checkEntityAccess(ctx.session.user.id, input.entityId);

      const documents = await documentService.searchDocuments(
        input.entityId,
        input.query,
        input.folderId
      );

      return documents;
    }),

  generateDownloadUrl: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const document = await documentService.getDocumentById(input.id);
      
      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      await checkEntityAccess(ctx.session.user.id, document.entityId);

      const downloadUrl = await documentService.generateDownloadUrl(document);

      return { url: downloadUrl };
    }),

  // Folder operations
  folders: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({
        entityId: z.string(),
        parentId: z.string().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const access = await checkEntityAccess(ctx.session.user.id, input.entityId);

        const folders = await documentService.getFolders(
          input.entityId,
          input.parentId
        );

        return folders;
      }),

    getById: protectedProcedure
      .input(z.object({
        id: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const folder = await documentService.getFolderById(input.id);
        
        if (!folder) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Folder not found",
          });
        }

        await checkEntityAccess(ctx.session.user.id, folder.entityId);

        return folder;
      }),

    create: protectedProcedure
      .input(createFolderSchema)
      .mutation(async ({ input, ctx }) => {
        const access = await checkEntityAccess(ctx.session.user.id, input.entityId);
        checkWritePermission(access.role);

        // If parentId is provided, verify it exists and belongs to the entity
        if (input.parentId) {
          const parentFolder = await documentService.getFolderById(input.parentId);
          if (!parentFolder || parentFolder.entityId !== input.entityId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid parent folder ID",
            });
          }
        }

        try {
          const folder = await documentService.createFolder({
            ...input,
            createdBy: ctx.session.user.id,
          });

          return folder;
        } catch (error) {
          if (error instanceof Error && error.message.includes("already exists")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: error.message,
            });
          }
          throw error;
        }
      }),

    update: protectedProcedure
      .input(updateFolderSchema)
      .mutation(async ({ input, ctx }) => {
        const folder = await documentService.getFolderById(input.id);
        
        if (!folder) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Folder not found",
          });
        }

        const access = await checkEntityAccess(ctx.session.user.id, folder.entityId);
        checkWritePermission(access.role);

        const updatedFolder = await documentService.updateFolder(input.id, {
          name: input.name,
          description: input.description,
        });

        return updatedFolder;
      }),

    delete: protectedProcedure
      .input(z.object({
        id: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const folder = await documentService.getFolderById(input.id);
        
        if (!folder) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Folder not found",
          });
        }

        const access = await checkEntityAccess(ctx.session.user.id, folder.entityId);
        checkWritePermission(access.role);

        try {
          await documentService.deleteFolder(input.id);
          return { success: true };
        } catch (error) {
          if (error instanceof Error && error.message.includes("contains")) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            });
          }
          throw error;
        }
      }),

    move: protectedProcedure
      .input(z.object({
        id: z.string(),
        targetParentId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const folder = await documentService.getFolderById(input.id);
        
        if (!folder) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Folder not found",
          });
        }

        const access = await checkEntityAccess(ctx.session.user.id, folder.entityId);
        checkWritePermission(access.role);

        // If targetParentId is provided, verify it exists and belongs to the entity
        if (input.targetParentId) {
          const parentFolder = await documentService.getFolderById(input.targetParentId);
          if (!parentFolder || parentFolder.entityId !== folder.entityId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid target parent folder ID",
            });
          }
        }

        try {
          const updatedFolder = await documentService.moveFolder(
            input.id,
            input.targetParentId
          );

          return updatedFolder;
        } catch (error) {
          if (error instanceof Error && error.message.includes("descendants")) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            });
          }
          throw error;
        }
      }),

    getHierarchy: protectedProcedure
      .input(z.object({
        entityId: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const access = await checkEntityAccess(ctx.session.user.id, input.entityId);

        const folders = await documentService.getFolderHierarchy(input.entityId);

        return folders;
      }),
  }),

  // Utility operations
  getStorageUsage: protectedProcedure
    .input(z.object({
      entityId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const access = await checkEntityAccess(ctx.session.user.id, input.entityId);

      const usageBytes = await documentService.getEntityStorageUsage(input.entityId);
      const maxStorageBytes = getDocumentsMaxEntityStorageGB() * 1024 * 1024 * 1024;

      return {
        usageBytes,
        maxStorageBytes,
        usagePercentage: (usageBytes / maxStorageBytes) * 100,
        usageMB: Math.round(usageBytes / (1024 * 1024)),
        maxStorageGB: getDocumentsMaxEntityStorageGB(),
      };
    }),

  getConfig: protectedProcedure
    .query(() => {
      return {
        allowedFileTypes: getDocumentsAllowedFileTypes(),
        maxFileSizeMB: getDocumentsMaxFileSizeMB(),
        maxEntityStorageGB: getDocumentsMaxEntityStorageGB(),
      };
    }),
});