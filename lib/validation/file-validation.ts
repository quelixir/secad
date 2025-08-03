import { getDocumentsMaxFileSizeMB, getDocumentsAllowedFileTypes } from "@/lib/config";

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FileValidationOptions {
  allowedTypes?: string[];
  maxSizeMB?: number;
  maxFiles?: number;
  requireFileExtension?: boolean;
  checkMimeType?: boolean;
}

// MIME type mappings for common file types
const MIME_TYPE_MAP: Record<string, string[]> = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  txt: ["text/plain"],
  rtf: ["application/rtf", "text/rtf"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  gif: ["image/gif"],
  webp: ["image/webp"],
  xls: ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  csv: ["text/csv"],
  zip: ["application/zip", "application/x-zip-compressed"],
  rar: ["application/x-rar-compressed", "application/vnd.rar"],
};

// Get file extension from filename
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) {
    return '';
  }
  return filename.slice(lastDot + 1).toLowerCase();
}

// Check if file extension is allowed
export function isFileTypeAllowed(filename: string, allowedTypes?: string[]): boolean {
  const extension = getFileExtension(filename);
  if (!extension) return false;

  const types = allowedTypes || getDocumentsAllowedFileTypes();
  return types.includes(extension);
}

// Check if MIME type matches file extension
export function isMimeTypeValid(filename: string, mimeType: string): boolean {
  const extension = getFileExtension(filename);
  if (!extension || !mimeType) return false;

  const expectedMimeTypes = MIME_TYPE_MAP[extension];
  if (!expectedMimeTypes) return false;

  return expectedMimeTypes.includes(mimeType);
}

// Check file size
export function isFileSizeValid(sizeBytes: number, maxSizeMB?: number): boolean {
  const maxSize = maxSizeMB || getDocumentsMaxFileSizeMB();
  const maxSizeBytes = maxSize * 1024 * 1024;
  return sizeBytes <= maxSizeBytes;
}

// Validate filename for security and compatibility
export function validateFilename(filename: string): FileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for empty filename
  if (!filename || filename.trim() === '') {
    errors.push('Filename cannot be empty');
    return { isValid: false, errors, warnings };
  }

  // Check filename length
  if (filename.length > 255) {
    errors.push('Filename is too long (maximum 255 characters)');
  }

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(filename)) {
    errors.push('Filename contains invalid characters (< > : " / \\ | ? * or control characters)');
  }

  // Check for reserved names (Windows)
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
  if (reservedNames.test(filename)) {
    errors.push('Filename uses a reserved system name');
  }

  // Check for leading/trailing spaces or dots
  if (filename !== filename.trim()) {
    warnings.push('Filename has leading or trailing spaces');
  }

  if (filename.endsWith('.')) {
    warnings.push('Filename ends with a dot');
  }

  // Check for multiple consecutive dots
  if (filename.includes('..')) {
    warnings.push('Filename contains consecutive dots');
  }

  // Check for file extension
  const extension = getFileExtension(filename);
  if (!extension) {
    warnings.push('File has no extension');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Validate file content (basic checks)
export function validateFileContent(file: File): FileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if file is empty
  if (file.size === 0) {
    errors.push('File is empty');
  }

  // Check for potentially malicious file signatures
  const filename = file.name.toLowerCase();
  
  // Check for double extensions (potential security risk)
  const parts = filename.split('.');
  if (parts.length > 2) {
    const secondToLast = parts[parts.length - 2];
    const suspiciousExtensions = ['exe', 'bat', 'cmd', 'scr', 'pif', 'com', 'vbs', 'js', 'jar'];
    if (suspiciousExtensions.includes(secondToLast)) {
      errors.push('File has suspicious double extension');
    }
  }

  // Check MIME type consistency
  if (!isMimeTypeValid(file.name, file.type)) {
    warnings.push('File MIME type does not match extension');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Comprehensive file validation
export function validateFile(
  file: File, 
  options: FileValidationOptions = {}
): FileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate filename
  const filenameValidation = validateFilename(file.name);
  errors.push(...filenameValidation.errors);
  warnings.push(...filenameValidation.warnings);

  // Validate file content
  const contentValidation = validateFileContent(file);
  errors.push(...contentValidation.errors);
  warnings.push(...contentValidation.warnings);

  // Check file type
  const allowedTypes = options.allowedTypes || getDocumentsAllowedFileTypes();
  if (!isFileTypeAllowed(file.name, allowedTypes)) {
    const extension = getFileExtension(file.name);
    errors.push(
      extension 
        ? `File type '${extension}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`
        : `Files without extensions are not allowed. Allowed types: ${allowedTypes.join(', ')}`
    );
  }

  // Check file size
  const maxSizeMB = options.maxSizeMB || getDocumentsMaxFileSizeMB();
  if (!isFileSizeValid(file.size, maxSizeMB)) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    errors.push(`File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`);
  }

  // Check MIME type if requested
  if (options.checkMimeType !== false && file.type) {
    if (!isMimeTypeValid(file.name, file.type)) {
      warnings.push(`File MIME type '${file.type}' does not match extension '${getFileExtension(file.name)}'`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Validate multiple files
export function validateFiles(
  files: File[], 
  options: FileValidationOptions = {}
): { results: FileValidationResult[]; globalErrors: string[] } {
  const results: FileValidationResult[] = [];
  const globalErrors: string[] = [];

  // Check total number of files
  if (options.maxFiles && files.length > options.maxFiles) {
    globalErrors.push(`Too many files selected. Maximum allowed: ${options.maxFiles}`);
  }

  // Check for duplicate filenames
  const filenames = new Set<string>();
  const duplicates = new Set<string>();
  
  files.forEach(file => {
    const normalizedName = file.name.toLowerCase();
    if (filenames.has(normalizedName)) {
      duplicates.add(file.name);
    }
    filenames.add(normalizedName);
  });

  if (duplicates.size > 0) {
    globalErrors.push(`Duplicate filenames detected: ${Array.from(duplicates).join(', ')}`);
  }

  // Validate each file
  files.forEach(file => {
    results.push(validateFile(file, options));
  });

  return { results, globalErrors };
}

// Get human-readable file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Check if file is an image
export function isImageFile(filename: string): boolean {
  const extension = getFileExtension(filename);
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  return imageExtensions.includes(extension);
}

// Check if file is a document
export function isDocumentFile(filename: string): boolean {
  const extension = getFileExtension(filename);
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
  return documentExtensions.includes(extension);
}

// Check if file is a spreadsheet
export function isSpreadsheetFile(filename: string): boolean {
  const extension = getFileExtension(filename);
  const spreadsheetExtensions = ['xls', 'xlsx', 'csv', 'ods'];
  return spreadsheetExtensions.includes(extension);
}