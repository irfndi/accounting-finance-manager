/**
 * AI Client for Web App
 * Provides a clean interface for AI features in the frontend
 */

export interface AIAnalysisRequest {
  type: 'transaction-analysis' | 'categorize-expense' | 'generate-insights' | 'analyze-document' | 'fraud-detection';
  data: any;
}

export interface CategorizationSuggestion {
  id: string;
  transactionId?: string;
  description: string;
  amount: number;
  suggestedCategory: string;
  suggestedAccountId: string;
  confidence: number;
  reasoning: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CategorizationResponse {
  success: boolean;
  suggestion?: CategorizationSuggestion;
  error?: string;
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
   * Categorize an expense automatically (legacy method)
   */
  async categorizeExpense(description: string, amount: number): Promise<AIAnalysisResponse> {
    return this.makeRequest({
      type: 'categorize-expense',
      data: { description, amount }
    });
  }

  /**
   * Generate categorization suggestion with approval workflow
   */
  async suggestCategorization(description: string, amount: number, transactionId?: string): Promise<CategorizationResponse> {
    try {
      const response = await fetch('/api/categorization/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description, amount, transactionId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json() as CategorizationResponse;
    } catch (error) {
      console.error('Categorization suggestion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get pending categorization suggestions
   */
  async getPendingSuggestions(): Promise<{ success: boolean; suggestions?: CategorizationSuggestion[]; error?: string }> {
    try {
      const response = await fetch('/api/categorization/pending');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json() as { success: boolean; suggestions?: CategorizationSuggestion[]; error?: string };
    } catch (error) {
      console.error('Failed to fetch pending suggestions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Approve a categorization suggestion
   */
  async approveSuggestion(suggestionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/categorization/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suggestionId, approved: true })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json() as { success: boolean; error?: string };
    } catch (error) {
      console.error('Failed to approve suggestion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Reject a categorization suggestion
   */
  async rejectSuggestion(suggestionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/categorization/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suggestionId, approved: false })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json() as { success: boolean; error?: string };
    } catch (error) {
      console.error('Failed to reject suggestion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get categorization history
   */
  async getCategorizationHistory(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch('/api/categorization/history');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json() as { success: boolean; data?: any; error?: string };
    } catch (error) {
      console.error('Failed to fetch categorization history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
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

      const result = await response.json() as AIAnalysisResponse;
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

      const result = await response.json() as AIAnalysisResponse;
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