import type { APIRoute } from 'astro';
import { validateToken } from '../../../lib/auth/index.ts';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Validate authentication
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authorization token required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const tokenValidation = await validateToken(token);
    if (!tokenValidation.valid) {
      return new Response(
        JSON.stringify({ error: tokenValidation.error || 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // For now, return mock insights until we implement full AI analysis
    const mockInsights = {
      summary: {
        totalRevenue: 125000,
        totalExpenses: 87500,
        netIncome: 37500,
        profitMargin: 30,
        trend: 'positive'
      },
      insights: [
        {
          type: 'trend',
          title: 'Revenue Growth',
          description: 'Revenue has increased by 15% compared to last month',
          impact: 'positive',
          confidence: 0.85
        },
        {
          type: 'alert',
          title: 'High Office Expenses',
          description: 'Office expenses are 20% above budget this month',
          impact: 'negative',
          confidence: 0.92
        },
        {
          type: 'opportunity',
          title: 'Cash Flow Optimization',
          description: 'Consider negotiating better payment terms with suppliers',
          impact: 'neutral',
          confidence: 0.78
        }
      ],
      recommendations: [
        'Review office expense categories for potential savings',
        'Maintain current revenue growth strategies',
        'Consider increasing marketing budget based on positive ROI'
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        dataPoints: body.transactions?.length || 0,
        analysisType: 'financial_overview'
      }
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: mockInsights,
        message: 'AI insights generated successfully (mock data)'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating AI insights:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate AI insights',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};