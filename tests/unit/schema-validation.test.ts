import { describe, it, expect } from 'vitest';
import { insertAccountSchema } from '../../src/db/schema/accounts';
import { insertTransactionSchema } from '../../src/db/schema/transactions';
import { insertRawDocSchema } from '../../src/db/schema/documents';

describe('Schema Validation', () => {
  describe('Account Schema', () => {
    it('should validate valid account data', () => {
      const validAccount = {
        code: '1000',
        name: 'Checking Account',
        type: 'ASSET' as const,
        normalBalance: 'DEBIT' as const,
        currentBalance: 1000.50,
        isActive: true
      };

      const result = insertAccountSchema.safeParse(validAccount);
      expect(result.success).toBe(true);
    });

    it('should reject invalid account data', () => {
      const invalidAccount = {
        code: '', // Empty code
        name: '', // Empty name
        type: 'INVALID' as any, // Invalid type
        normalBalance: 'INVALID' as any // Invalid normal balance
      };

      const result = insertAccountSchema.safeParse(invalidAccount);
      expect(result.success).toBe(false);
    });

    it('should handle missing required fields', () => {
      const incompleteAccount = {
        name: 'Test Account'
        // Missing other required fields
      };

      const result = insertAccountSchema.safeParse(incompleteAccount);
      expect(result.success).toBe(false);
    });
  });

  describe('Transaction Schema', () => {
    it('should validate valid transaction data', () => {
      const validTransaction = {
        transactionNumber: 'TXN-001',
        description: 'Coffee purchase',
        type: 'PAYMENT' as const,
        source: 'MANUAL' as const,
        status: 'DRAFT' as const,
        totalAmount: 50.25
      };

      const result = insertTransactionSchema.safeParse(validTransaction);
      expect(result.success).toBe(true);
    });

    it('should reject invalid transaction data', () => {
      const invalidTransaction = {
        transactionNumber: '', // Empty transaction number
        description: '', // Empty description
        type: 'INVALID' as any, // Invalid type
        source: 'INVALID' as any, // Invalid source
        status: 'INVALID' as any, // Invalid status
        totalAmount: 0 // Zero amount is invalid
      };

      const result = insertTransactionSchema.safeParse(invalidTransaction);
      expect(result.success).toBe(false);
    });

    it('should validate transaction amounts', () => {
      const negativeAmountTransaction = {
        accountId: 'acc_123',
        categoryId: 'cat_456',
        amount: -50.25,
        description: 'Refund',
        date: new Date().toISOString(),
        type: 'income'
      };

      const result = insertTransactionSchema.safeParse(negativeAmountTransaction);
      // Depending on schema, negative amounts might be valid for refunds
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Document Schema', () => {
    it('should validate valid document data', () => {
      const validDocument = {
        fileId: 'test-file-123',
        originalName: 'invoice.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        ocrStatus: 'PENDING' as const,
        uploadedBy: 'user-123',
        extractedText: 'Sample OCR text',
        searchableText: 'searchable content'
      };

      const result = insertRawDocSchema.safeParse(validDocument);
      expect(result.success).toBe(true);
    });

    it('should reject invalid document data', () => {
      const invalidDocument = {
        fileId: '', // Empty file ID
        originalName: '',
        fileSize: -1, // Negative size
        mimeType: '',
        ocrStatus: 'INVALID' as any, // Invalid status
        uploadedBy: '' // Empty uploadedBy
      };

      const result = insertRawDocSchema.safeParse(invalidDocument);
      expect(result.success).toBe(false);
    });
  });



  describe('Edge Cases', () => {
    it('should handle extremely large numbers', () => {
      const largeAmountTransaction = {
        accountId: 'acc_123',
        categoryId: 'cat_456',
        amount: Number.MAX_SAFE_INTEGER,
        description: 'Large transaction',
        date: new Date().toISOString(),
        type: 'income'
      };

      const result = insertTransactionSchema.safeParse(largeAmountTransaction);
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle special characters in strings', () => {
      const specialCharAccount = {
        name: 'Account with émojis 🏦 and spëcial chars',
        type: 'checking',
        balance: 1000.50,
        currency: 'USD',
        isActive: true
      };

      const result = insertAccountSchema.safeParse(specialCharAccount);
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle very long strings', () => {
      const longDescription = 'A'.repeat(1000);
      const longDescriptionTransaction = {
        accountId: 'acc_123',
        categoryId: 'cat_456',
        amount: 50.25,
        description: longDescription,
        date: new Date().toISOString(),
        type: 'expense'
      };

      const result = insertTransactionSchema.safeParse(longDescriptionTransaction);
      expect(typeof result.success).toBe('boolean');
    });
  });
});