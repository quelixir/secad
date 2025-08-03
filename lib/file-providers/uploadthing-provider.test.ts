import { UploadThingProvider } from "./uploadthing-provider";
import { FileProviderType } from "./types";

// Mock the UTApi to avoid actual API calls in tests
jest.mock("uploadthing/server", () => ({
  UTApi: jest.fn().mockImplementation(() => ({
    getFileUrls: jest.fn(),
    deleteFiles: jest.fn(),
    listFiles: jest.fn(),
    renameFiles: jest.fn(),
  })),
}));

describe("UploadThingProvider", () => {
  let provider: UploadThingProvider;

  beforeEach(() => {
    provider = new UploadThingProvider();
  });

  describe("getProviderName", () => {
    it("should return the correct provider name", () => {
      expect(provider.getProviderName()).toBe(FileProviderType.UPLOADTHING);
    });
  });

  describe("generatePresignedUrl", () => {
    it("should throw an error as UploadThing uses component-based uploads", async () => {
      await expect(
        provider.generatePresignedUrl("test-key", "image/jpeg")
      ).rejects.toThrow("UploadThing uses component-based uploads");
    });
  });

  describe("generateDownloadUrl", () => {
    it("should return a download URL for a valid key", async () => {
      const mockGetFileUrls = jest.fn().mockResolvedValue({
        data: [{ url: "https://uploadthing.com/f/test-key" }]
      });
      
      (provider as any).utapi.getFileUrls = mockGetFileUrls;

      const url = await provider.generateDownloadUrl("test-key");
      
      expect(url).toBe("https://uploadthing.com/f/test-key");
      expect(mockGetFileUrls).toHaveBeenCalledWith(["test-key"]);
    });

    it("should throw an error for a non-existent key", async () => {
      const mockGetFileUrls = jest.fn().mockResolvedValue({
        data: []
      });
      (provider as any).utapi.getFileUrls = mockGetFileUrls;

      await expect(
        provider.generateDownloadUrl("non-existent-key")
      ).rejects.toThrow("File not found: non-existent-key");
    });
  });

  describe("deleteFile", () => {
    it("should delete a file successfully", async () => {
      const mockDeleteFiles = jest.fn().mockResolvedValue(undefined);
      (provider as any).utapi.deleteFiles = mockDeleteFiles;

      await provider.deleteFile("test-key");
      
      expect(mockDeleteFiles).toHaveBeenCalledWith(["test-key"]);
    });

    it("should handle deletion errors", async () => {
      const mockDeleteFiles = jest.fn().mockRejectedValue(new Error("API Error"));
      (provider as any).utapi.deleteFiles = mockDeleteFiles;

      await expect(
        provider.deleteFile("test-key")
      ).rejects.toThrow("Failed to delete file: Error: API Error");
    });
  });
});