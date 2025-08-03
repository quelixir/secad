import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { getDocumentsAllowedFileTypes, getDocumentsMaxFileSizeMB } from "@/lib/config";
import { 
  validateFilename, 
  isFileTypeAllowed, 
  isFileSizeValid, 
  isMimeTypeValid,
  getFileExtension 
} from "@/lib/validation/file-validation";

const f = createUploadthing();

// Helper function to check user permissions for entity (for future use)
// async function checkEntityPermission(userId: string, entityId: string) {
//   const access = await prisma.userEntityAccess.findFirst({
//     where: {
//       userId,
//       entityId,
//       role: {
//         in: ["Admin", "Editor"], // Only Admin and Editor can upload
//       },
//     },
//   });
//
//   return !!access;
// }

// Enhanced file validation using our validation utility
function validateUploadedFile(fileName: string, fileSize: number, mimeType?: string): { isValid: boolean; error?: string } {
  // Validate filename
  const filenameValidation = validateFilename(fileName);
  if (!filenameValidation.isValid) {
    return {
      isValid: false,
      error: `Invalid filename: ${filenameValidation.errors.join(', ')}`
    };
  }

  // Validate file type
  if (!isFileTypeAllowed(fileName)) {
    const extension = getFileExtension(fileName);
    const allowedTypes = getDocumentsAllowedFileTypes();
    return {
      isValid: false,
      error: extension 
        ? `File type '${extension}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`
        : `Files without extensions are not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  // Validate file size
  if (!isFileSizeValid(fileSize)) {
    const maxSizeMB = getDocumentsMaxFileSizeMB();
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
    };
  }

  // Validate MIME type consistency if provided
  if (mimeType && !isMimeTypeValid(fileName, mimeType)) {
    return {
      isValid: false,
      error: `File MIME type '${mimeType}' does not match extension '${getFileExtension(fileName)}'`
    };
  }

  return { isValid: true };
}

// Get max file size as a valid UploadThing size string
function getMaxFileSize() {
  const sizeMB = getDocumentsMaxFileSizeMB();
  // UploadThing expects specific size strings, so we'll use "32MB" as the max supported
  if (sizeMB <= 1) return "1MB";
  if (sizeMB <= 2) return "2MB";
  if (sizeMB <= 4) return "4MB";
  if (sizeMB <= 8) return "8MB";
  if (sizeMB <= 16) return "16MB";
  if (sizeMB <= 32) return "32MB";
  if (sizeMB <= 64) return "64MB";
  return "64MB"; // Max fallback
}

export const ourFileRouter = {
  // Document uploader for the Documents module
  documentUploader: f({
    "application/pdf": { maxFileSize: getMaxFileSize() },
    "application/msword": { maxFileSize: getMaxFileSize() },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: getMaxFileSize() },
    "text/plain": { maxFileSize: getMaxFileSize() },
    "application/rtf": { maxFileSize: getMaxFileSize() },
    "image/jpeg": { maxFileSize: getMaxFileSize() },
    "image/png": { maxFileSize: getMaxFileSize() },
    "image/gif": { maxFileSize: getMaxFileSize() },
    "image/webp": { maxFileSize: getMaxFileSize() },
    "application/vnd.ms-excel": { maxFileSize: getMaxFileSize() },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { maxFileSize: getMaxFileSize() },
    "text/csv": { maxFileSize: getMaxFileSize() },
    "application/zip": { maxFileSize: getMaxFileSize() },
    "application/x-rar-compressed": { maxFileSize: getMaxFileSize() },
  })
    .middleware(async ({ req }) => {
      // Get the current user session
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      if (!session?.user) {
        throw new UploadThingError("Unauthorized");
      }

      // For now, just return the user ID - we'll handle entity validation in the UI
      return {
        userId: session.user.id,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Enhanced validation using our validation utility
      const validation = validateUploadedFile(file.name, file.size, file.type);
      
      if (!validation.isValid) {
        console.error("File validation failed:", validation.error);
        throw new UploadThingError(validation.error || "File validation failed");
      }

      console.log("File upload completed:", file.name);

      // Return basic file info - we'll create the database record via tRPC
      return {
        fileName: file.name,
        fileKey: file.key,
        fileSize: file.size,
        fileType: file.type,
        uploadedBy: metadata.userId,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;