import { describe, it, expect, beforeEach, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import {
  getRawDocByFileId,
  createRawDoc,
  updateRawDocOCR,
  updateRawDoc,
  generateSearchableText,
  parseTags,
  getUploadStats
} from '../../src/db/raw-docs';
import { rawDocs } from '../../src/db/schema/documents';

// Mock the database
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  values: vi.fn(),
  returning: vi.fn(),
  set: vi.fn(),
  count: vi.fn(),
  sum: vi.fn(),
  avg: vi.fn(),
  min: vi.fn(),
  max: vi.fn(),
  query: {
    rawDocs: {
      findFirst: vi.fn()
    }
  }
};

// Create chainable mock methods
const createChainableMock = () => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  count: vi.fn().mockReturnThis(),
  sum: vi.fn().mockReturnThis(),
  avg: vi.fn().mockReturnThis(),
  min: vi.fn().mockReturnThis(),
  max: vi.fn().mockReturnThis()
});

describe('Raw Documents Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockDb, createChainableMock());
  });

  describe('getRawDocByFileId', () => {
    it('should retrieve a raw document by file ID', async () => {
      const mockDoc = {
        id: 1,
        fileId: 'test-file-id',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        r2Key: 'documents/test-file-id.pdf',
        uploadedBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDb.query.rawDocs.findFirst.mockResolvedValue(mockDoc);

      const result = await getRawDocByFileId(mockDb as any, 'test-file-id');

      expect(mockDb.query.rawDocs.findFirst).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });

    it('should return undefined if document not found', async () => {
      mockDb.query.rawDocs.findFirst.mockResolvedValue(undefined);

      const result = await getRawDocByFileId(mockDb as any, 'non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('createRawDoc', () => {
    it('should create a new raw document', async () => {
      const newDoc = {
        fileId: 'new-file-id',
        originalName: 'new-test.pdf',
        mimeType: 'application/pdf',
        fileSize: 2048,
        r2Key: 'documents/new-file-id.pdf',
        uploadedBy: 'user-1'
      };

      const createdDoc = { id: 2, ...newDoc, createdAt: new Date(), updatedAt: new Date() };

      mockDb.insert.mockReturnValue(mockDb);
      mockDb.values.mockReturnValue(mockDb);
      mockDb.returning.mockResolvedValue([createdDoc]);

      const result = await createRawDoc(mockDb as any, newDoc);

      expect(mockDb.insert).toHaveBeenCalledWith(rawDocs);
      expect(mockDb.values).toHaveBeenCalledWith(newDoc);
      expect(mockDb.returning).toHaveBeenCalled();
      expect(result).toEqual([createdDoc]);
    });
  });

  describe('updateRawDocOCR', () => {
    it('should update OCR data for a raw document', async () => {
      const ocrData = {
        extractedText: 'Extracted text content',
        ocrConfidence: 0.95,
        ocrProcessedAt: new Date()
      };

      const updatedDoc = {
        id: '1',
        fileId: 'test-file-id',
        ...ocrData
      };

      mockDb.update.mockReturnValue(mockDb);
      mockDb.set.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.returning.mockResolvedValue([updatedDoc]);

      const result = await updateRawDocOCR(mockDb as any, 'test-file-id', ocrData);

      expect(mockDb.update).toHaveBeenCalledWith(rawDocs);
      expect(mockDb.set).toHaveBeenCalledWith(ocrData);
      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toEqual([updatedDoc]);
    });
  });

  describe('updateRawDoc', () => {
    it('should update a raw document', async () => {
      const updateData = {
        originalName: 'updated-name.pdf',
        tags: '["invoice","expense"]'
      };

      const updatedDoc = {
        id: '1',
        fileId: 'test-file-id',
        ...updateData
      };

      mockDb.update.mockReturnValue(mockDb);
      mockDb.set.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.returning.mockResolvedValue([updatedDoc]);

      const result = await updateRawDoc(mockDb as any, 'test-file-id', updateData);

      expect(mockDb.update).toHaveBeenCalledWith(rawDocs);
      expect(mockDb.set).toHaveBeenCalledWith(updateData);
      expect(result).toEqual([updatedDoc]);
    });
  });

  describe('generateSearchableText', () => {
    it('should generate searchable text from input', () => {
      const input = 'Invoice #12345 - Amount: $1,234.56';
      const result = generateSearchableText(input);

      expect(result).toBe('invoice 12345  amount 123456');
    });

    it('should handle empty input', () => {
      const result = generateSearchableText('');
      expect(result).toBe('');
    });
  });

  describe('parseTags', () => {
    it('should parse JSON array tags', () => {
      const tags = '["invoice", "expense", "business"]';
      const result = parseTags(tags);

      expect(result).toEqual(['invoice', 'expense', 'business']);
    });

    it('should handle empty tags', () => {
      const result = parseTags('');
      expect(result).toEqual([]);
    });

    it('should handle invalid JSON', () => {
      const tags = 'invalid json';
      const result = parseTags(tags);

      expect(result).toEqual([]);
    });

    it('should handle non-array JSON', () => {
      const tags = '{"key": "value"}';
      const result = parseTags(tags);

      expect(result).toEqual([]);
    });
  });

  describe('getUploadStats', () => {
    it('should return upload statistics for a user', async () => {
      const mockStats = {
        count: 10,
        totalSize: 1024000
      };

      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockResolvedValue([mockStats]);

      const result = await getUploadStats(mockDb as any, 'user-1');

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalledWith(rawDocs);
      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });

    it('should handle user with no uploads', async () => {
      const emptyStats = {
        count: 0,
        totalSize: 0
      };

      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockResolvedValue([emptyStats]);

      const result = await getUploadStats(mockDb as any, 'user-no-uploads');

      expect(result).toEqual(emptyStats);
    });
  });
});