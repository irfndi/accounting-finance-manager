/**
 * Financial AI Service
 * Specialized AI service for financial operations and analysis
 */
import { AI_USE_CASES } from '../config.js';
export class FinancialAIService {
    aiService;
    constructor(aiService) {
        this.aiService = aiService;
    }
    /**
     * Analyze a financial transaction for accuracy and compliance
     */
    async analyzeTransaction(transaction) {
        const useCase = AI_USE_CASES.TRANSACTION_ANALYSIS;
        const messages = [
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
        }
        catch {
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
    async categorizeExpense(description, amount, merchant, existingCategories) {
        const useCase = AI_USE_CASES.EXPENSE_CATEGORIZATION;
        const categoriesContext = existingCategories
            ? `Available categories: ${existingCategories.join(', ')}`
            : 'Use standard accounting expense categories';
        const messages = [
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
        }
        catch {
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
    async generateInsights(data) {
        const useCase = AI_USE_CASES.FINANCIAL_INSIGHTS;
        const messages = [
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
        }
        catch {
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
    async checkCompliance(data, regulations) {
        const useCase = AI_USE_CASES.COMPLIANCE_CHECK;
        const regulationsContext = regulations
            ? `Focus on these regulations: ${regulations.join(', ')}`
            : 'Check against standard financial regulations and accounting principles';
        const messages = [
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
        }
        catch {
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
    async generateReportSummary(reportData, reportType) {
        const useCase = AI_USE_CASES.REPORT_GENERATION;
        const messages = [
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
    async extractDocumentData(ocrResult, documentType) {
        const messages = [
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
        }
        catch {
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
    async classifyDocument(ocrResult) {
        const messages = [
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
        }
        catch {
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
    async generateTransactionEntries(description, amount, availableAccounts) {
        const accountsContext = availableAccounts
            .map(acc => `${acc.code}: ${acc.name} (${acc.type})`)
            .join('\n');
        const messages = [
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
        }
        catch {
            // Fallback - return basic entries if parsing fails
            return [];
        }
    }
    /**
     * Analyze financial documents for data extraction and validation
     */
    async analyzeDocument(documentData) {
        const useCase = AI_USE_CASES.DOCUMENT_ANALYSIS || {
            maxTokens: 2048,
            temperature: 0.1
        };
        const messages = [
            {
                role: 'system',
                content: `You are a financial document analysis expert. Analyze the provided document and extract relevant financial data.
        
Extract:
- Document type (invoice, receipt, bank statement, etc.)
- Key financial data (amounts, dates, parties, account numbers)
- Validate data consistency and completeness
        
Respond with JSON:
{
  "extractedData": {...},
  "confidence": 0.0-1.0,
  "documentType": "...",
  "validation": {
    "isValid": boolean,
    "errors": [...],
    "warnings": [...]
  }
}`
            },
            {
                role: 'user',
                content: `Document to analyze:
${JSON.stringify(documentData, null, 2)}`
            }
        ];
        const response = await this.aiService.generateText(messages, {
            maxTokens: useCase.maxTokens,
            temperature: useCase.temperature
        });
        try {
            const parsed = JSON.parse(response.content);
            return {
                extractedData: parsed.extractedData || {},
                confidence: parsed.confidence || 0.7,
                documentType: parsed.documentType || 'unknown',
                validation: parsed.validation || {
                    isValid: true,
                    errors: [],
                    warnings: []
                }
            };
        }
        catch {
            return {
                extractedData: {},
                confidence: 0.3,
                documentType: 'unknown',
                validation: {
                    isValid: false,
                    errors: ['Failed to parse document'],
                    warnings: []
                }
            };
        }
    }
    /**
     * Detect potential fraud in financial transactions and patterns
     */
    async detectFraud(data) {
        const useCase = AI_USE_CASES.FRAUD_DETECTION || {
            maxTokens: 2048,
            temperature: 0.1
        };
        const messages = [
            {
                role: 'system',
                content: `You are a financial fraud detection expert. Analyze the provided data for potential fraud indicators.
        
Look for:
- Unusual transaction patterns
- Duplicate transactions
- Round number bias
- Timing anomalies
- Amount patterns
- Vendor/payee irregularities
        
Respond with JSON:
{
  "riskScore": 0.0-1.0,
  "riskLevel": "low|medium|high|critical",
  "findings": [{
    "type": "...",
    "description": "...",
    "severity": "...",
    "evidence": {...}
  }],
  "recommendations": [...]
}`
            },
            {
                role: 'user',
                content: `Data to analyze for fraud:
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
                riskScore: parsed.riskScore || 0,
                riskLevel: parsed.riskLevel || 'low',
                findings: parsed.findings || [],
                recommendations: parsed.recommendations || []
            };
        }
        catch {
            return {
                riskScore: 0,
                riskLevel: 'low',
                findings: [],
                recommendations: ['Unable to analyze data for fraud indicators']
            };
        }
    }
    /**
     * Get the health status of the underlying AI service
     */
    async getHealthStatus() {
        return this.aiService.getProvidersHealth();
    }
}
