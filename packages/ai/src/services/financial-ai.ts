/**
 * Financial AI Service
 * Specialized AI service for financial operations and analysis
 */

import { AIService } from './ai-service.js';
import type { AIMessage, FinancialAnalysisResponse, OCRResult, DocumentClassification } from '../types.js';
import { AI_USE_CASES } from '../config.js';
// Using any for now to avoid cross-package imports during build
// In production, these would be properly typed via the main app
interface Transaction {
  id: string;
  amount: number;
  description: string;
  category?: string;
  date: string;
  accountId: string;
}

interface TransactionEntry {
  id: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  accountId: number;
  debitAmount?: number;
  creditAmount?: number;
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  code: string;
}

export class FinancialAIService {
  constructor(private aiService: AIService) {}

  /**
   * Analyze a financial transaction for accuracy and compliance
   */
  async analyzeTransaction(transaction: Transaction): Promise<FinancialAnalysisResponse> {
    const useCase = AI_USE_CASES.TRANSACTION_ANALYSIS;
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are a financial analyst specializing in transaction analysis. ${useCase.prompt}
        
Analyze the transaction for:
- Completeness and accuracy
- Compliance with double-entry accounting principles
- Potential errors or inconsistencies
- Missing information

Respond with a JSON object containing:
- analysis: Detailed analysis text
- confidence: Confidence score (0-1)
- suggestions: Array of improvement suggestions
- warnings: Array of potential issues`
      },
      {
        role: 'user',
        content: `Transaction to analyze:\n${JSON.stringify(transaction, null, 2)}`
      }
    ];

    const response = await this.aiService.generateText(messages, {
      maxTokens: useCase.maxTokens,
      temperature: useCase.temperature
    });

    try {
      const parsed = JSON.parse(response.content);
      return {
        analysis: parsed.analysis || response.content,
        confidence: parsed.confidence || 0.8,
        suggestions: parsed.suggestions || [],
        warnings: parsed.warnings || []
      };
    } catch {
      // Fallback if JSON parsing fails
      return {
        analysis: response.content,
        confidence: 0.7,
        suggestions: [],
        warnings: []
      };
    }
  }

  /**
   * Categorize expenses automatically
   */
  async categorizeExpense(
    description: string, 
    amount: number, 
    merchant?: string,
    existingCategories?: string[]
  ): Promise<{ category: string; subcategory?: string; confidence: number }> {
    const useCase = AI_USE_CASES.EXPENSE_CATEGORIZATION;
    
    const categoriesContext = existingCategories 
      ? `Available categories: ${existingCategories.join(', ')}`
      : 'Use standard accounting expense categories';

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert accountant specializing in expense categorization. ${useCase.prompt}
        
${categoriesContext}

Analyze the expense and provide:
- Primary category (e.g., "Office Supplies", "Travel", "Marketing")
- Optional subcategory for more specific classification
- Confidence level (0-1)

Respond with JSON: {"category": "...", "subcategory": "...", "confidence": 0.95}`
      },
      {
        role: 'user',
        content: `Expense Details:
Description: ${description}
Amount: ${amount}
${merchant ? `Merchant: ${merchant}` : ''}`
      }
    ];

    const response = await this.aiService.generateText(messages, {
      maxTokens: useCase.maxTokens,
      temperature: useCase.temperature
    });

    try {
      const parsed = JSON.parse(response.content);
      return {
        category: parsed.category,
        subcategory: parsed.subcategory,
        confidence: parsed.confidence || 0.8
      };
    } catch {
      // Fallback categorization
      return {
        category: 'General Expense',
        confidence: 0.5
      };
    }
  }

  /**
   * Generate financial insights and recommendations
   */
  async generateInsights(
    data: {
      transactions?: Transaction[];
      accounts?: Account[];
      timeframe?: string;
      context?: string;
    }
  ): Promise<FinancialAnalysisResponse> {
    const useCase = AI_USE_CASES.FINANCIAL_INSIGHTS;
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are a senior financial advisor with expertise in business financial analysis. ${useCase.prompt}
        
Provide insights on:
- Spending patterns and trends
- Cash flow analysis
- Cost optimization opportunities
- Financial health indicators
- Actionable recommendations

Format as JSON with analysis, confidence, suggestions, and warnings arrays.`
      },
      {
        role: 'user',
        content: `Financial Data Analysis Request:
${data.context ? `Context: ${data.context}\n` : ''}
${data.timeframe ? `Timeframe: ${data.timeframe}\n` : ''}

Data:
${JSON.stringify(data, null, 2)}`
      }
    ];

    const response = await this.aiService.generateText(messages, {
      maxTokens: useCase.maxTokens,
      temperature: useCase.temperature
    });

    try {
      const parsed = JSON.parse(response.content);
      return {
        analysis: parsed.analysis || response.content,
        confidence: parsed.confidence || 0.8,
        suggestions: parsed.suggestions || [],
        warnings: parsed.warnings || []
      };
    } catch {
      return {
        analysis: response.content,
        confidence: 0.7,
        suggestions: [],
        warnings: []
      };
    }
  }

  /**
   * Check financial data for compliance issues
   */
  async checkCompliance(
    data: any,
    regulations?: string[]
  ): Promise<FinancialAnalysisResponse> {
    const useCase = AI_USE_CASES.COMPLIANCE_CHECK;
    
    const regulationsContext = regulations
      ? `Focus on these regulations: ${regulations.join(', ')}`
      : 'Check against standard financial regulations and accounting principles';

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are a compliance officer with expertise in financial regulations. ${useCase.prompt}
        
${regulationsContext}

Check for:
- Regulatory compliance issues
- Accounting standard violations
- Missing required documentation
- Potential audit flags
- Risk indicators

Provide detailed findings with specific recommendations.`
      },
      {
        role: 'user',
        content: `Compliance Check Request:
${JSON.stringify(data, null, 2)}`
      }
    ];

    const response = await this.aiService.generateText(messages, {
      maxTokens: useCase.maxTokens,
      temperature: useCase.temperature
    });

    try {
      const parsed = JSON.parse(response.content);
      return {
        analysis: parsed.analysis || response.content,
        confidence: parsed.confidence || 0.9,
        suggestions: parsed.suggestions || [],
        warnings: parsed.warnings || []
      };
    } catch {
      return {
        analysis: response.content,
        confidence: 0.8,
        suggestions: [],
        warnings: []
      };
    }
  }

  /**
   * Generate a financial report summary
   */
  async generateReportSummary(
    reportData: any,
    reportType: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance'
  ): Promise<string> {
    const useCase = AI_USE_CASES.REPORT_GENERATION;
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are a financial analyst creating executive summaries. ${useCase.prompt}
        
Create a clear, concise summary for a ${reportType} that highlights:
- Key financial metrics and their implications
- Notable changes or trends
- Areas of concern or opportunity
- Executive-level insights

Write in professional, business-appropriate language.`
      },
      {
        role: 'user',
        content: `Generate summary for ${reportType}:
${JSON.stringify(reportData, null, 2)}`
      }
    ];

    const response = await this.aiService.generateText(messages, {
      maxTokens: useCase.maxTokens,
      temperature: useCase.temperature
    });

    return response.content;
  }

  /**
   * Extract structured data from financial documents
   */
  async extractDocumentData(
    ocrResult: OCRResult,
    documentType?: 'receipt' | 'invoice' | 'bank_statement'
  ): Promise<any> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert at extracting structured financial data from documents.
        
Extract relevant financial information from the OCR text and return it as structured JSON.

For receipts/invoices, extract:
- vendor/merchant name
- date
- total amount
- line items with descriptions and amounts
- tax information
- payment method

For bank statements, extract:
- account information
- transactions with dates, descriptions, amounts
- running balance
- fee information

Return clean, structured JSON that can be used to create accounting entries.`
      },
      {
        role: 'user',
        content: `Document Type: ${documentType || 'unknown'}
OCR Confidence: ${ocrResult.confidence}
Text Content:
${ocrResult.text}`
      }
    ];

    const response = await this.aiService.generateText(messages, {
      maxTokens: 3072,
      temperature: 0.1
    });

    try {
      return JSON.parse(response.content);
    } catch {
      // Return raw analysis if JSON parsing fails
      return {
        raw_analysis: response.content,
        confidence: ocrResult.confidence
      };
    }
  }

  /**
   * Classify financial documents
   */
  async classifyDocument(ocrResult: OCRResult): Promise<DocumentClassification> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert at classifying financial documents.
        
Analyze the OCR text and classify the document type. Return JSON with:
- type: 'receipt', 'invoice', 'bank_statement', 'tax_document', or 'other'
- confidence: confidence level (0-1)
- subtype: more specific classification if applicable
- extractedFields: key fields that indicate the document type

Base your classification on document structure, headers, formatting patterns, and key phrases typically found in each document type.`
      },
      {
        role: 'user',
        content: `OCR Text (confidence: ${ocrResult.confidence}):
${ocrResult.text}`
      }
    ];

    const response = await this.aiService.generateText(messages, {
      maxTokens: 1024,
      temperature: 0.1
    });

    try {
      const parsed = JSON.parse(response.content);
      return {
        type: parsed.type || 'other',
        confidence: parsed.confidence || 0.5,
        subtype: parsed.subtype,
        extractedFields: parsed.extractedFields || {}
      };
    } catch {
      // Fallback classification
      return {
        type: 'other',
        confidence: 0.3
      };
    }
  }

  /**
   * Generate transaction entries from natural language description
   */
  async generateTransactionEntries(
    description: string,
    amount: number,
    availableAccounts: Account[]
  ): Promise<TransactionEntry[]> {
    const accountsContext = availableAccounts
      .map(acc => `${acc.code}: ${acc.name} (${acc.type})`)
      .join('\n');

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert accountant who creates double-entry transaction entries.
        
Based on the description and amount, create appropriate transaction entries using the available accounts.

Available Accounts:
${accountsContext}

Rules:
- Debits must equal credits
- Use appropriate accounts based on the transaction type
- Follow standard accounting principles
- Return JSON array of entries with accountId, description, debitAmount, creditAmount

Format: [{"accountId": 123, "description": "...", "debitAmount": 100, "creditAmount": 0}, ...]`
      },
      {
        role: 'user',
        content: `Transaction Description: ${description}
Amount: ${amount}

Generate the appropriate journal entries.`
      }
    ];

    const response = await this.aiService.generateText(messages, {
      maxTokens: 2048,
      temperature: 0.1
    });

    try {
      const entries = JSON.parse(response.content);
      return Array.isArray(entries) ? entries : [];
    } catch {
      // Fallback - return basic entries if parsing fails
      return [];
    }
  }

  /**
   * Get the health status of the underlying AI service
   */
  async getHealthStatus() {
    return this.aiService.getProvidersHealth();
  }
}