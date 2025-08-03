import { FileProvider, FileProviderType, FileProviderConfig } from "./types";
import { UploadThingProvider } from "./uploadthing-provider";

// Factory function to create file providers
export function createFileProvider(config?: FileProviderConfig): FileProvider {
  // Default to UploadThing if no config provided
  const providerType = config?.type || getDefaultProviderType();

  switch (providerType) {
    case FileProviderType.UPLOADTHING:
      return new UploadThingProvider();
    
    case FileProviderType.S3:
    case FileProviderType.S3_COMPATIBLE:
      // TODO: Implement S3Provider in Phase 3
      throw new Error(`Provider ${providerType} not yet implemented`);
    
    default:
      throw new Error(`Unknown provider type: ${providerType}`);
  }
}

// Get the default provider type from environment
function getDefaultProviderType(): FileProviderType {
  const provider = process.env.FILE_PROVIDER?.toLowerCase();
  
  switch (provider) {
    case "s3":
      return FileProviderType.S3;
    case "s3-compatible":
      return FileProviderType.S3_COMPATIBLE;
    case "uploadthing":
    default:
      return FileProviderType.UPLOADTHING;
  }
}

// Singleton instance for the application
let providerInstance: FileProvider | null = null;

export function getFileProvider(): FileProvider {
  if (!providerInstance) {
    providerInstance = createFileProvider();
  }
  return providerInstance;
}

// Reset the provider instance (useful for testing)
export function resetFileProvider(): void {
  providerInstance = null;
}