// File provider interface types
export interface FileMetadata {
  key: string;
  size: number;
  contentType: string;
  etag?: string;
  lastModified?: Date;
  url?: string;
}

export interface PresignedUrlResponse {
  url: string;
  key: string;
  fields?: Record<string, string>; // For form uploads (S3 style)
  headers?: Record<string, string>; // For header-based uploads
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
  fileName: string;
}

export interface FileProvider {
  // Upload operations
  generatePresignedUrl(
    key: string, 
    contentType: string, 
    metadata?: Record<string, string>
  ): Promise<PresignedUrlResponse>;
  
  confirmUpload(key: string): Promise<FileMetadata>;
  
  // Download operations  
  generateDownloadUrl(key: string, expiresIn?: number): Promise<string>;
  
  // Management operations
  deleteFile(key: string): Promise<void>;
  getFileMetadata(key: string): Promise<FileMetadata>;
  
  // Provider info
  getProviderName(): string;
}

export enum FileProviderType {
  UPLOADTHING = "uploadthing",
  S3 = "s3",
  S3_COMPATIBLE = "s3-compatible"
}

export interface FileProviderConfig {
  type: FileProviderType;
  config: Record<string, any>;
}