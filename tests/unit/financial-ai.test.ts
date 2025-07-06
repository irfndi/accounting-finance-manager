/**
 * Tests for Financial AI Service
 * Comprehensive test coverage for financial AI operations and analysis
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FinancialAIService } from '../../src/ai/services/financial-ai.js';
import type { AIService } from '../../src/ai/services/ai-service.js';
import type { OCRResult } from '../../src/ai/types.js';

vi.mock('../../src/ai/services/ai-service');

// Mock AI_USE_CASES to control prompts
vi.mock('../../src/ai/config.js', () => ({
  AI_USE_CASES: {
    TRANSACTION_ANALYSIS: {
      systemPrompt: 'Test transaction analysis prompt',
      maxTokens: 100,
      temperature: 0.5,
    },
    EXPENSE_CATEGORIZATION: {
      systemPrompt: 'Test expense categorization prompt',
      maxTokens: 50,
      temperature: 0.5,
    },
  },
}));

describe.skip('FinancialAIService', () => {
  let mockAIService: AIService;
  let financialAIService: FinancialAIService;
  const mockTransaction = { id: 'txn_1', amount: 100, description: 'Test', date: '2023-01-01', accountId: 'acc_1' };
  const mockOCRResult: OCRResult = {
    text: 'Invoice from Staples Inc. Amount: $150.50 Date: 2024-01-15',
    confidence: 0.9,
    boundingBoxes: []
  };
  const mockAccount = { id: 'acc_1', name: 'Test Account', type: 'expense', balance: 1000, code: 'ACC001' };

  beforeEach(() => {
    mockAIService = {
      generateText: vi.fn(),
      generateStream: vi.fn(),
      getProvidersHealth: vi.fn(),
    } as any;
    financialAIService = new FinancialAIService(mockAIService as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeTransaction', () => {
    it('should analyze a transaction successfully', async () => {
      const mockResponse = {
        analysis: 'Mocked analysis',
        confidence: 0.9,
        suggestions: ['suggestion1'],
        warnings: [],
      };
      vi.mocked(mockAIService.generateText).mockResolvedValue({
        content: JSON.stringify(mockResponse),
      });

      const result = await financialAIService.analyzeTransaction(mockTransaction);

      expect(mockAIService.generateText).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should throw an error if AI service fails', async () => {
      vi.mocked(mockAIService.generateText).mockRejectedValue(new Error('AI service unavailable'));

      await expect(financialAIService.analyzeTransaction(mockTransaction)).rejects.toThrow('AI service unavailable');
    });

    it('should throw an error for invalid JSON response', async () => {
      vi.mocked(mockAIService.generateText).mockResolvedValue({ content: 'invalid json' });

      await expect(financialAIService.analyzeTransaction(mockTransaction)).rejects.toThrow('Failed to parse AI response');
    });
  });

  describe('categorizeExpense', () => {
    it('should categorize an expense successfully', async () => {
      const mockResponse = { category: 'Office Supplies', confidence: 0.95 };
      vi.mocked(mockAIService.generateText).mockResolvedValue({
        content: JSON.stringify(mockResponse),
      });

      const result = await financialAIService.categorizeExpense('New stapler', 20.50);

      expect(mockAIService.generateText).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should throw an error if AI service fails during categorization', async () => {
      vi.mocked(mockAIService.generateText).mockRejectedValue(new Error('AI service error'));

      await expect(financialAIService.categorizeExpense('Test', 10)).rejects.toThrow('AI service error');
    });

    it('should throw an error for invalid JSON response during categorization', async () => {
      vi.mocked(mockAIService.generateText).mockResolvedValue({ content: 'invalid json' });
      
      await expect(financialAIService.categorizeExpense('Test', 10)).rejects.toThrow('Failed to parse AI response');
    });
  });

  describe('extractDocumentData', () => {
    it('should extract structured data from OCR result', async () => {
      const mockExtractionResponse = {
        content: JSON.stringify({
          vendor: 'Staples Inc.',
          amount: 150.50,
          date: '2024-01-15',
          invoiceNumber: 'INV-12345',
          items: [
            { description: 'Office supplies', amount: 150.50 }
          ]
        }),
        usage: { promptTokens: 200, completionTokens: 100, totalTokens: 300 }
      };

      vi.mocked(mockAIService.generateText).mockResolvedValue(mockExtractionResponse);

      const result = await financialAIService.extractDocumentData(mockOCRResult, 'invoice');

      expect(result).toEqual({
        vendor: 'Staples Inc.',
        amount: 150.50,
        date: '2024-01-15',
        invoiceNumber: 'INV-12345',
        items: [
          { description: 'Office supplies', amount: 150.50 }
        ]
      });

      expect(mockAIService.generateText).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('extracting structured financial data')
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('INVOICE')
          })
        ]),
        expect.objectContaining({
          temperature: 0.1,
          maxTokens: 3072
        })
      );
    });

    it('should handle low confidence OCR results', async () => {
      const lowConfidenceOCR: OCRResult = {
        ...mockOCRResult,
        confidence: 0.3
      };

      const mockResponse = {
        content: 'Unable to extract reliable data',
        usage: { promptTokens: 150, completionTokens: 75, totalTokens: 225 }
      };

      vi.mocked(mockAIService.generateText).mockResolvedValue(mockResponse);

      const result = await financialAIService.extractDocumentData(lowConfidenceOCR);

      expect(result).toEqual({
        raw_analysis: 'Unable to extract reliable data',
        confidence: 0.3
      });
    });
  });

  describe('classifyDocument', () => {
    it('should classify document type from OCR result', async () => {
      const mockClassificationResponse = {
        content: JSON.stringify({
          type: 'invoice',
          confidence: 0.98,
          subtype: 'vendor_invoice',
          extractedFields: {
            hasAmount: true,
            hasDate: false,
            hasVendor: false
          }
        }),
        usage: { promptTokens: 120, completionTokens: 60, totalTokens: 180 }
      };

      vi.mocked(mockAIService.generateText).mockResolvedValue(mockClassificationResponse);

      const result = await financialAIService.classifyDocument(mockOCRResult);

      expect(result).toEqual({
        type: 'invoice',
        confidence: 0.98,
        subtype: 'vendor_invoice',
        extractedFields: {
          hasAmount: true,
          hasDate: false,
          hasVendor: false
        }
      });

      expect(mockAIService.generateText).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('classifying financial documents')
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('INVOICE')
          })
        ]),
        expect.objectContaining({
          temperature: 0.1,
          maxTokens: 1024
        })
      );
    });

    it('should handle unknown document types', async () => {
      const unknownOCR: OCRResult = {
        text: 'Random text that is not a financial document',
        confidence: 0.5,
        boundingBoxes: []
      };
      
      const mockResponse = {
        content: JSON.stringify({
          type: 'other',
          confidence: 0.1,
          subtype: null,
          extractedFields: {}
        }),
        usage: { promptTokens: 100, completionTokens: 30, totalTokens: 130 }
      };

      vi.mocked(mockAIService.generateText).mockResolvedValue(mockResponse);

      const result = await financialAIService.classifyDocument(unknownOCR);

      expect(result.type).toBe('other');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('generateInsights', () => {
    it('should generate insights from financial data', async () => {
      const data = {
        transactions: [mockTransaction],
        accounts: [mockAccount],
        timeframe: '2024-01',
        context: 'Monthly analysis'
      };
      
      const mockInsightsResponse = {
        content: JSON.stringify({
          analysis: 'Office expenses have increased by 15% this month',
          confidence: 0.9,
          suggestions: [
            'Consider setting up a budget alert for office expenses'
          ],
          warnings: []
        }),
        usage: { promptTokens: 300, completionTokens: 150, totalTokens: 450 }
      };

      vi.mocked(mockAIService.generateText).mockResolvedValue(mockInsightsResponse);

      const result = await financialAIService.generateInsights(data);

      expect(result.analysis).toContain('Office expenses have increased');
      expect(result.confidence).toBe(0.9);
      expect(result.suggestions).toContain('Consider setting up a budget alert for office expenses');
      expect(result.warnings).toHaveLength(0);

      expect(mockAIService.generateText).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('financial advisor')
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Monthly analysis')
          })
        ]),
        expect.any(Object)
      );
    });

    it('should handle empty financial data', async () => {
      const mockResponse = {
        content: JSON.stringify({
          analysis: 'No transaction data available for analysis',
          confidence: 0.8,
          suggestions: [],
          warnings: []
        }),
        usage: { promptTokens: 50, completionTokens: 25, totalTokens: 75 }
      };

      vi.mocked(mockAIService.generateText).mockResolvedValue(mockResponse);

      const result = await financialAIService.generateInsights({});

      expect(result.analysis).toContain('No transaction data available');
      expect(result.confidence).toBe(0.8);
      expect(result.suggestions).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      vi.mocked(mockAIService.generateText).mockRejectedValue(new Error('Network error'));

      await expect(financialAIService.analyzeTransaction(mockTransaction))
        .rejects.toThrow('Network error');
    });

    it('should handle malformed AI responses', async () => {
      const malformedResponse = {
        content: '{ invalid json',
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
      };

      vi.mocked(mockAIService.generateText).mockResolvedValue(malformedResponse);

      const result = await financialAIService.analyzeTransaction(mockTransaction);
      
      // Should fallback gracefully
      expect(result.analysis).toBe('{ invalid json');
      expect(result.confidence).toBe(0.7);
    });

    it('should handle empty AI responses', async () => {
      const emptyResponse = {
        content: '',
        usage: { promptTokens: 100, completionTokens: 0, totalTokens: 100 }
      };

      vi.mocked(mockAIService.generateText).mockResolvedValue(emptyResponse);

      await expect(financialAIService.analyzeTransaction(mockTransaction))
        .rejects.toThrow('Failed to parse AI response');
    });
  });
});