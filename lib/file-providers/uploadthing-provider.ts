import { UTApi } from 'uploadthing/server';
import {
  FileProvider,
  FileMetadata,
  PresignedUrlResponse,
  FileProviderType,
} from './types';

export class UploadThingProvider implements FileProvider {
  private utapi: UTApi;

  constructor() {
    this.utapi = new UTApi({
      token: process.env.UPLOADTHING_TOKEN,
    });
  }

  async generatePresignedUrl(
    key: string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<PresignedUrlResponse> {
    // Note: UploadThing doesn't use traditional presigned URLs
    // This is a placeholder for interface compatibility
    // In practice, we'll use the UploadThing React components for uploads
    throw new Error(
      'UploadThing uses component-based uploads, not presigned URLs'
    );
  }

  async confirmUpload(key: string): Promise<FileMetadata> {
    try {
      const fileData = await this.utapi.getFileUrls([key]);
      const fileUrl = fileData.data[0];

      if (!fileUrl) {
        throw new Error(`File not found: ${key}`);
      }

      // UploadThing doesn't provide detailed metadata via API
      // We'll need to get this info from the upload response
      return {
        key,
        size: 0, // Will be populated from upload response
        contentType: 'application/octet-stream', // Will be populated from upload response
        url: fileUrl.url,
      };
    } catch (error) {
      throw new Error(`Failed to confirm upload: ${error}`);
    }
  }

  async generateDownloadUrl(key: string, expiresIn?: number): Promise<string> {
    try {
      const fileData = await this.utapi.getFileUrls([key]);
      const fileUrl = fileData.data[0];

      if (!fileUrl) {
        throw new Error(`File not found: ${key}`);
      }

      // UploadThing URLs are already public and long-lived
      // Note: The actual filename will be set by the download endpoint
      // which will use the document's originalName for Content-Disposition
      return fileUrl.url;
    } catch (error) {
      throw new Error(`Failed to generate download URL: ${error}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.utapi.deleteFiles([key]);
    } catch (error) {
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  async getFileMetadata(key: string): Promise<FileMetadata> {
    try {
      const fileData = await this.utapi.getFileUrls([key]);
      const fileUrl = fileData.data[0];

      if (!fileUrl) {
        throw new Error(`File not found: ${key}`);
      }

      // UploadThing provides limited metadata
      return {
        key,
        size: 0, // Not available from UploadThing API
        contentType: 'application/octet-stream', // Not available from UploadThing API
        url: fileUrl.url,
      };
    } catch (error) {
      throw new Error(`Failed to get file metadata: ${error}`);
    }
  }

  getProviderName(): string {
    return FileProviderType.UPLOADTHING;
  }

  // UploadThing specific methods
  async listFiles(): Promise<any> {
    try {
      const result = await this.utapi.listFiles();
      return result.files;
    } catch (error) {
      throw new Error(`Failed to list files: ${error}`);
    }
  }

  async renameFile(key: string, newName: string): Promise<void> {
    try {
      await this.utapi.renameFiles([
        {
          fileKey: key,
          newName: newName,
        },
      ]);
    } catch (error) {
      throw new Error(`Failed to rename file: ${error}`);
    }
  }
}
