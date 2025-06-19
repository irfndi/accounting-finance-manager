/**
 * AI Client for Web App
 * Provides a clean interface for AI features in the frontend
 */

export interface AIAnalysisRequest {
  type: 'transaction-analysis' | 'categorize-expense' | 'generate-insights' | 'analyze-document' | 'fraud-detection';
  data: any;
  options?: {
    temperature?: number;
    model?: string;
  };
}

export interface AIAnalysisResponse {
  success: boolean;
  result?: any;
  error?: string;
}

export class AIClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Analyze a transaction for accuracy and insights
   */
  async analyzeTransaction(transaction: any): Promise<AIAnalysisResponse> {
    return this.makeRequest({
      type: 'transaction-analysis',
      data: transaction
    });
  }

  /**
   * Categorize an expense automatically
   */
  async categorizeExpense(description: string, amount: number): Promise<AIAnalysisResponse> {
    return this.makeRequest({
      type: 'categorize-expense',
      data: { description, amount }
    });
  }

  /**
   * Generate financial insights from transaction data
   */
  async generateInsights(data: any): Promise<AIAnalysisResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/ai-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('AI Insights Client error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Analyze a financial document (OCR + classification)
   */
  async analyzeDocument(content: string, type: string): Promise<AIAnalysisResponse> {
    return this.makeRequest({
      type: 'analyze-document',
      data: { content, type }
    });
  }

  /**
   * Detect potential fraud in transactions
   */
  async detectFraud(transaction: any): Promise<AIAnalysisResponse> {
    return this.makeRequest({
      type: 'fraud-detection',
      data: { transaction }
    });
  }

  /**
   * Make API request to AI analysis endpoint
   */
  private async makeRequest(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/ai-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('AI Client error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const aiClient = new AIClient(); 