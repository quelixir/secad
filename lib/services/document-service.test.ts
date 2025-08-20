import { DocumentService } from './document-service';
import type { Document } from '@/lib/generated/prisma';

// Mock the file provider
jest.mock('@/lib/file-providers', () => ({
  getFileProvider: () => ({
    generateDownloadUrl: jest
      .fn()
      .mockResolvedValue('https://uploadthing.com/f/test-cuid2'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe('DocumentService', () => {
  let documentService: DocumentService;

  beforeEach(() => {
    documentService = new DocumentService();
  });

  describe('generateDownloadUrl', () => {
    it('should return custom download endpoint URL', async () => {
      const mockDocument = {
        id: 'clx1234567890',
        fileName: 'test-document.pdf',
        originalName: 'test-document.pdf',
        uploadKey: 'clx0987654321', // CUID2 without extension
      } as Document;

      const downloadUrl = await documentService.generateDownloadUrl(
        mockDocument
      );

      expect(downloadUrl).toBe('/api/documents/clx1234567890/download');
    });
  });

  describe('generateDirectDownloadUrl', () => {
    it('should return the direct UploadThing URL', async () => {
      const mockDocument = {
        id: 'clx1234567890',
        fileName: 'test-document.pdf',
        originalName: 'test-document.pdf',
        uploadKey: 'clx0987654321', // CUID2 without extension
      } as Document;

      const directUrl = await documentService.generateDirectDownloadUrl(
        mockDocument
      );

      expect(directUrl).toBe('https://uploadthing.com/f/test-cuid2');
    });
  });
});
