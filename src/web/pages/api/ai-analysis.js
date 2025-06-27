/**
 * AI Analysis API Endpoint
 * Provides AI-powered financial analysis for transactions and insights
 */
import { createAIService, FinancialAIService } from '../../../ai/index.js';
export const prerender = false;
export const POST = async ({ request }) => {
    try {
        const { type, data } = await request.json();
        // Initialize AI service
        const aiService = createAIService();
        const financialAI = new FinancialAIService(aiService);
        let result;
        switch (type) {
            case 'transaction-analysis':
                result = await financialAI.analyzeTransaction(data);
                break;
            case 'categorize-expense':
                result = await financialAI.categorizeExpense(data.description, data.amount);
                break;
            case 'generate-insights':
                result = await financialAI.generateInsights({
                    transactions: data.transactions,
                    accounts: data.accounts,
                    timeframe: data.timeframe,
                    context: data.context
                });
                break;
            case 'analyze-document':
                result = await financialAI.analyzeDocument(data);
                break;
            case 'fraud-detection':
                result = await financialAI.detectFraud(data);
                break;
            default:
                return new Response(JSON.stringify({ error: 'Invalid analysis type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ success: true, result }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }
    catch (error) {
        console.error('AI Analysis error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
};
export const OPTIONS = async () => {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
};
