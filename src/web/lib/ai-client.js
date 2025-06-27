/**
 * AI Client for Web App
 * Provides a clean interface for AI features in the frontend
 */
export class AIClient {
    baseUrl;
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
    }
    /**
     * Analyze a transaction for accuracy and insights
     */
    async analyzeTransaction(transaction) {
        return this.makeRequest({
            type: 'transaction-analysis',
            data: transaction
        });
    }
    /**
     * Categorize an expense automatically (legacy method)
     */
    async categorizeExpense(description, amount) {
        return this.makeRequest({
            type: 'categorize-expense',
            data: { description, amount }
        });
    }
    /**
     * Generate categorization suggestion with approval workflow
     */
    async suggestCategorization(description, amount, transactionId) {
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
            return await response.json();
        }
        catch (error) {
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
    async getPendingSuggestions() {
        try {
            const response = await fetch('/api/categorization/pending');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        }
        catch (error) {
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
    async approveSuggestion(suggestionId) {
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
            return await response.json();
        }
        catch (error) {
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
    async rejectSuggestion(suggestionId) {
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
            return await response.json();
        }
        catch (error) {
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
    async getCategorizationHistory() {
        try {
            const response = await fetch('/api/categorization/history');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        }
        catch (error) {
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
    async generateInsights(data) {
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
        }
        catch (error) {
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
    async analyzeDocument(content, type) {
        return this.makeRequest({
            type: 'analyze-document',
            data: { content, type }
        });
    }
    /**
     * Detect potential fraud in transactions
     */
    async detectFraud(transaction) {
        return this.makeRequest({
            type: 'fraud-detection',
            data: { transaction }
        });
    }
    /**
     * Make API request to AI analysis endpoint
     */
    async makeRequest(request) {
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
        }
        catch (error) {
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
