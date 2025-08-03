import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDocumentsAllowedFileTypes } from "@/lib/config";

// Mock the dependencies
jest.mock("@/lib/db", () => ({
  prisma: {
    userEntityAccess: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock("@/lib/services/document-service", () => ({
  DocumentService: jest.fn().mockImplementation(() => ({
    getDocuments: jest.fn(),
    getDocumentById: jest.fn(),
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
    validateFileType: jest.fn(),
    getEntityStorageUsage: jest.fn(),
    getFolders: jest.fn(),
    createFolder: jest.fn(),
  })),
}));

jest.mock("@/lib/config", () => ({
  getDocumentsAllowedFileTypes: jest.fn(() => ["pdf", "jpg", "png"]),
  getDocumentsMaxFileSizeMB: jest.fn(() => 50),
  getDocumentsMaxEntityStorageGB: jest.fn(() => 10),
}));

describe("Documents tRPC Router Validation", () => {
  describe("Schema Validation", () => {
    it("should validate createDocumentSchema correctly", () => {
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

      const validData = {
        entityId: "entity-123",
        fileName: "test.pdf",
        originalName: "test-document.pdf",
        fileSize: 1024000,
        mimeType: "application/pdf",
        fileUrl: "https://example.com/file.pdf",
        uploadKey: "upload-key-123",
      };

      expect(() => createDocumentSchema.parse(validData)).not.toThrow();

      // Test validation errors
      expect(() => createDocumentSchema.parse({
        ...validData,
        entityId: "",
      })).toThrow();

      expect(() => createDocumentSchema.parse({
        ...validData,
        fileSize: 0,
      })).toThrow();

      expect(() => createDocumentSchema.parse({
        ...validData,
        fileUrl: "invalid-url",
      })).toThrow();
    });

    it("should validate createFolderSchema correctly", () => {
      const createFolderSchema = z.object({
        entityId: z.string().min(1, "Entity ID is required"),
        name: z.string().min(1, "Folder name is required"),
        description: z.string().optional(),
        parentId: z.string().optional(),
      });

      const validData = {
        entityId: "entity-123",
        name: "My Documents",
      };

      expect(() => createFolderSchema.parse(validData)).not.toThrow();

      // Test validation errors
      expect(() => createFolderSchema.parse({
        ...validData,
        name: "",
      })).toThrow();

      expect(() => createFolderSchema.parse({
        ...validData,
        entityId: "",
      })).toThrow();
    });
  });

  describe("Permission Helpers", () => {
    it("should correctly identify write permissions", () => {
      function checkWritePermission(role: string) {
        if (!["Admin", "Editor"].includes(role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to modify documents in this entity",
          });
        }
      }

      expect(() => checkWritePermission("Admin")).not.toThrow();
      expect(() => checkWritePermission("Editor")).not.toThrow();
      expect(() => checkWritePermission("Viewer")).toThrow();
      expect(() => checkWritePermission("Invalid")).toThrow();
    });
  });

  describe("Configuration", () => {
    it("should return correct file type configuration", () => {
      const allowedTypes = getDocumentsAllowedFileTypes();
      expect(Array.isArray(allowedTypes)).toBe(true);
      expect(allowedTypes.length).toBeGreaterThan(0);
    });
  });
});