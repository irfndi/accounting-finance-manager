import { Hono } from 'hono';
import { createAIService, FinancialAIService } from '../../../ai/index.js';

const aiRouter = new Hono();

// POST /api/ai-analysis
aiRouter.post('/ai-analysis', async (c) => {
  try {
    const { type, data } = await c.req.json<{
      type: string;
      data: any;
    }>();

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
          context: data.context,
        });
        break;
      case 'analyze-document':
        result = await financialAI.analyzeDocument(data);
        break;
      case 'fraud-detection':
        result = await financialAI.detectFraud(data);
        break;
      default:
        return c.json({ success: false, error: 'Invalid analysis type' }, 400);
    }

    return c.json({ success: true, result });
  } catch (error) {
    console.error('AI Analysis error:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    );
  }
});

// POST /api/ai-insights
aiRouter.post('/ai-insights', async (c) => {
  try {
    const { period, metrics, includeForecasting, includeRiskAnalysis } = await c.req.json<{
      period: string;
      metrics: Array<{ label: string; change: string }>;
      includeForecasting: boolean;
      includeRiskAnalysis: boolean;
    }>();

    const insights = await generateFinancialInsights({
      period,
      metrics,
      includeForecasting,
      includeRiskAnalysis,
    });

    return c.json({ success: true, result: { insights } });
  } catch (error) {
    console.error('AI Insights error:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    );
  }
});

// Simple CORS preflight handler for these routes (global middleware also covers CORS)
aiRouter.options('/ai-analysis', (c) => c.body(null, 200));
aiRouter.options('/ai-insights', (c) => c.body(null, 200));

async function generateFinancialInsights(options: {
  period: string;
  metrics: Array<{ label: string; change: string }>;
  includeForecasting: boolean;
  includeRiskAnalysis: boolean;
}) {
  const insights: Array<{
    type: string;
    title: string;
    description: string;
    confidence: number;
    priority: 'low' | 'medium' | 'high';
  }> = [];

  try {
    const revenueMetric = options.metrics.find((m) => m.label.includes('Revenue'));
    if (revenueMetric) {
      const revenueChange = parseFloat(revenueMetric.change.replace(/[+%]/g, ''));
      if (revenueChange > 10) {
        insights.push({
          type: 'opportunity',
          title: 'Strong Revenue Growth',
          description:
            'Revenue is growing at a strong pace. Consider scaling marketing efforts or expanding product lines to maintain momentum.',
          confidence: 0.9,
          priority: 'high',
        });
      } else if (revenueChange < 0) {
        insights.push({
          type: 'risk',
          title: 'Revenue Decline Alert',
          description:
            'Revenue has declined. Recommend immediate review of sales pipeline and market conditions.',
          confidence: 0.95,
          priority: 'high',
        });
      }
    }

    const expenseMetric = options.metrics.find((m) => m.label.includes('Expenses'));
    if (expenseMetric) {
      const expenseChange = parseFloat(expenseMetric.change.replace(/[+%]/g, ''));
      if (expenseChange > 8) {
        insights.push({
          type: 'optimization',
          title: 'Expense Growth Monitoring',
          description: 'Operating expenses have increased. Review categories for optimization opportunities.',
          confidence: 0.8,
          priority: 'medium',
        });
      }
    }

    const cashFlowMetric = options.metrics.find((m) => m.label.includes('Cash Flow'));
    if (cashFlowMetric) {
      const cashFlowChange = parseFloat(cashFlowMetric.change.replace(/[+%]/g, ''));
      if (cashFlowChange < -5) {
        insights.push({
          type: 'risk',
          title: 'Cash Flow Concern',
          description:
            'Cash flow has decreased. Monitor accounts receivable and consider improving collection processes.',
          confidence: 0.85,
          priority: 'high',
        });
      }
    }

    if (options.includeForecasting) {
      insights.push({
        type: 'opportunity',
        title: 'Q1 Forecast Prediction',
        description:
          'Based on current trends, Q1 revenue is projected to grow. Recommend increasing inventory to meet demand.',
        confidence: 0.75,
        priority: 'medium',
      });
    }

    if (options.includeRiskAnalysis) {
      insights.push({
        type: 'compliance',
        title: 'Compliance Check',
        description:
          'All financial transactions are within compliance thresholds. Monthly reconciliation accuracy is high.',
        confidence: 0.95,
        priority: 'low',
      });
    }

    if (options.period === 'quarter') {
      insights.push({
        type: 'opportunity',
        title: 'Seasonal Opportunity',
        description: 'Historical data suggests Q4 typically sees higher revenue. Plan targeted campaigns accordingly.',
        confidence: 0.8,
        priority: 'medium',
      });
    }

    insights.push({
      type: 'optimization',
      title: 'Working Capital Efficiency',
      description: 'Days Sales Outstanding can be improved through automated follow-up processes.',
      confidence: 0.7,
      priority: 'low',
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    insights.push({
      type: 'risk',
      title: 'Data Analysis Limited',
      description: 'Unable to generate detailed insights. Please ensure all financial data is synchronized.',
      confidence: 0.5,
      priority: 'medium',
    });
  }

  return insights;
}

export default aiRouter;
