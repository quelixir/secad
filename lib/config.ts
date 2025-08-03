/**
 * Get the default country for new entities and members
 *
 * Configure this by setting the DEFAULT_COUNTRY environment variable in your .env file.
 *
 * @returns The configured default country or 'United States' as fallback
 */
export function getDefaultCountry(): string {
  return process.env.DEFAULT_COUNTRY || "United States";
}

/**
 * Get the default currency for transactions and securities
 *
 * Configure this by setting the DEFAULT_CURRENCY environment variable in your .env file.
 *
 * @returns The configured default currency or 'USD' as fallback
 */
export function getDefaultCurrencyCode(): string {
  return process.env.DEFAULT_CURRENCY || "USD";
}

/**
 * Documents module configuration
 */

/**
 * Get maximum file size for document uploads in MB
 *
 * Configure this by setting the DOCUMENTS_MAX_FILE_SIZE_MB environment variable in your .env file.
 *
 * @returns The configured max file size in MB or 50 as fallback
 */
export function getDocumentsMaxFileSizeMB(): number {
  return parseInt(process.env.DOCUMENTS_MAX_FILE_SIZE_MB || "50", 10);
}

/**
 * Get maximum storage limit per entity in GB
 *
 * Configure this by setting the DOCUMENTS_MAX_ENTITY_STORAGE_GB environment variable in your .env file.
 *
 * @returns The configured max entity storage in GB or 10 as fallback
 */
export function getDocumentsMaxEntityStorageGB(): number {
  return parseInt(process.env.DOCUMENTS_MAX_ENTITY_STORAGE_GB || "10", 10);
}

/**
 * Get maximum number of files in bulk upload
 *
 * Configure this by setting the DOCUMENTS_MAX_BULK_UPLOAD_COUNT environment variable in your .env file.
 *
 * @returns The configured max bulk upload count or 20 as fallback
 */
export function getDocumentsMaxBulkUploadCount(): number {
  return parseInt(process.env.DOCUMENTS_MAX_BULK_UPLOAD_COUNT || "20", 10);
}

/**
 * Get allowed file types for document uploads
 *
 * Configure this by setting the DOCUMENTS_ALLOWED_FILE_TYPES environment variable in your .env file.
 * Also set DOCUMENTS_FILE_TYPE_MODE to either "ADD" (extend defaults) or "OVERRIDE" (replace defaults).
 *
 * @returns Array of allowed file extensions (lowercase)
 */
export function getDocumentsAllowedFileTypes(): string[] {
  const defaultTypes = [
    // Documents
    "pdf", "doc", "docx", "txt", "rtf",
    // Images
    "jpg", "jpeg", "png", "gif", "webp",
    // Spreadsheets
    "xls", "xlsx", "csv",
    // Archives
    "zip", "rar"
  ];

  const envTypes = process.env.DOCUMENTS_ALLOWED_FILE_TYPES;
  const mode = process.env.DOCUMENTS_FILE_TYPE_MODE || "ADD";

  if (!envTypes) {
    return defaultTypes;
  }

  const customTypes = envTypes
    .split(",")
    .map(type => type.trim().toLowerCase())
    .filter(type => type.length > 0);

  if (mode.toUpperCase() === "OVERRIDE") {
    return customTypes;
  } else {
    // ADD mode - extend defaults with custom types
    return [...new Set([...defaultTypes, ...customTypes])];
  }
}
