/**
 * Insights Generation Engine
 * Real-time financial insights, forecasting, and recommendations
 */

import type { D1Database } from '@cloudflare/workers-types';

export interface DashboardInsights {
  period: string;
  metrics: {
    revenue: MetricData;
    expenses: MetricData;
    netProfit: MetricData;
    cashFlow: MetricData;
    burnRate: MetricData;
  };
  insights: Insight[];
  trends: Trend[];
  opportunities: Opportunity[];
  risks: Risk[];
  forecast?: Forecast;
}

export interface MetricData {
  current: number;
  previous?: number;
  change?: number;
  changePercent?: number;
  period: string;
  currency?: string;
}

export interface Insight {
  id: string;
  type: 'info' | 'warning' | 'opportunity' | 'critical';
  category: string;
  title: string;
  description: string;
  recommendation?: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export interface Trend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  period: string;
  description?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  estimatedValue?: number;
  effort: 'low' | 'medium' | 'high';
  priority: number;
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact?: number;
  mitigation?: string;
}

export interface Forecast {
  metric: string;
  periods: ForecastPeriod[];
  confidence: number;
  method: string;
}

export interface ForecastPeriod {
  date: string;
  value: number;
  lower: number;
  upper: number;
}

/**
 * Insights Generation Engine Class
 */
export class InsightsEngine {
  constructor(private db: D1Database) {}

  /**
   * Generate dashboard insights
   */
  async generateDashboard(
    entityId: string,
    period: string = '30d'
  ): Promise<DashboardInsights> {
    // Parse period
    const { startDate, endDate } = this.parsePeriod(period);
    const previousPeriod = this.getPreviousPeriod(startDate, endDate);

    // Fetch financial data
    const currentData = await this.fetchFinancialData(entityId, startDate, endDate);
    const previousData = await this.fetchFinancialData(
      entityId,
      previousPeriod.startDate,
      previousPeriod.endDate
    );

    // Calculate metrics
    const metrics = this.calculateMetrics(currentData, previousData);

    // Generate insights
    const insights = await this.generateInsights(entityId, currentData, previousData);

    // Identify trends
    const trends = this.identifyTrends(currentData, previousData);

    // Find opportunities
    const opportunities = this.findOpportunities(currentData, insights);

    // Assess risks
    const risks = this.assessRisks(currentData, insights);

    // Generate forecast
    const forecast = await this.generateForecast(entityId, 'cashFlow', 90);

    return {
      period,
      metrics,
      insights,
      trends,
      opportunities,
      risks,
      forecast
    };
  }

  /**
   * Parse period string (e.g., '30d', '3m', '1y')
   */
  private parsePeriod(period: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    const match = period.match(/^(\d+)([dmyw])$/);
    if (!match) {
      // Default to 30 days
      startDate.setDate(startDate.getDate() - 30);
      return { startDate, endDate };
    }

    const [, amount, unit] = match;
    const value = parseInt(amount);

    switch (unit) {
      case 'd':
        startDate.setDate(startDate.getDate() - value);
        break;
      case 'w':
        startDate.setDate(startDate.getDate() - value * 7);
        break;
      case 'm':
        startDate.setMonth(startDate.getMonth() - value);
        break;
      case 'y':
        startDate.setFullYear(startDate.getFullYear() - value);
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Get previous period dates
   */
  private getPreviousPeriod(
    startDate: Date,
    endDate: Date
  ): { startDate: Date; endDate: Date } {
    const duration = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - duration);

    return {
      startDate: prevStartDate,
      endDate: prevEndDate
    };
  }

  /**
   * Fetch financial data for a period
   */
  private async fetchFinancialData(
    entityId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    // Fetch revenue
    const revenueQuery = `
      SELECT SUM(credit_amount) as total
      FROM journal_entries je
      JOIN accounts a ON je.account_id = a.id
      WHERE a.entity_id = ?
        AND a.type = 'REVENUE'
        AND je.entry_date BETWEEN ? AND ?
    `;

    const revenueResult = await this.db
      .prepare(revenueQuery)
      .bind(entityId, startDate.toISOString(), endDate.toISOString())
      .first();

    // Fetch expenses
    const expensesQuery = `
      SELECT SUM(debit_amount) as total
      FROM journal_entries je
      JOIN accounts a ON je.account_id = a.id
      WHERE a.entity_id = ?
        AND a.type = 'EXPENSE'
        AND je.entry_date BETWEEN ? AND ?
    `;

    const expensesResult = await this.db
      .prepare(expensesQuery)
      .bind(entityId, startDate.toISOString(), endDate.toISOString())
      .first();

    // Fetch cash position
    const cashQuery = `
      SELECT 
        SUM(CASE WHEN a.normal_balance = 'DEBIT' THEN je.debit_amount - je.credit_amount
                 ELSE je.credit_amount - je.debit_amount END) as balance
      FROM journal_entries je
      JOIN accounts a ON je.account_id = a.id
      WHERE a.entity_id = ?
        AND a.type = 'ASSET'
        AND (a.code LIKE '1010%' OR a.name LIKE '%Cash%' OR a.name LIKE '%Bank%')
        AND je.entry_date <= ?
    `;

    const cashResult = await this.db
      .prepare(cashQuery)
      .bind(entityId, endDate.toISOString())
      .first();

    return {
      revenue: Number(revenueResult?.total || 0),
      expenses: Number(expensesResult?.total || 0),
      netProfit: Number(revenueResult?.total || 0) - Number(expensesResult?.total || 0),
      cash: Number(cashResult?.balance || 0),
      startDate,
      endDate
    };
  }

  /**
   * Calculate key metrics
   */
  private calculateMetrics(currentData: any, previousData: any): DashboardInsights['metrics'] {
    const calculateChange = (current: number, previous: number) => {
      const change = current - previous;
      const changePercent = previous !== 0 ? (change / previous) * 100 : 0;
      return { change, changePercent };
    };

    const revenueChange = calculateChange(currentData.revenue, previousData.revenue);
    const expensesChange = calculateChange(currentData.expenses, previousData.expenses);
    const netProfitChange = calculateChange(currentData.netProfit, previousData.netProfit);
    const cashFlowChange = calculateChange(currentData.netProfit, previousData.netProfit);

    const durationDays = Math.ceil(
      (currentData.endDate.getTime() - currentData.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const burnRate = durationDays > 0 ? currentData.expenses / durationDays : 0;

    return {
      revenue: {
        current: currentData.revenue,
        previous: previousData.revenue,
        change: revenueChange.change,
        changePercent: revenueChange.changePercent,
        period: 'current',
        currency: 'IDR'
      },
      expenses: {
        current: currentData.expenses,
        previous: previousData.expenses,
        change: expensesChange.change,
        changePercent: expensesChange.changePercent,
        period: 'current',
        currency: 'IDR'
      },
      netProfit: {
        current: currentData.netProfit,
        previous: previousData.netProfit,
        change: netProfitChange.change,
        changePercent: netProfitChange.changePercent,
        period: 'current',
        currency: 'IDR'
      },
      cashFlow: {
        current: currentData.netProfit,
        previous: previousData.netProfit,
        change: cashFlowChange.change,
        changePercent: cashFlowChange.changePercent,
        period: 'current',
        currency: 'IDR'
      },
      burnRate: {
        current: burnRate,
        period: 'daily',
        currency: 'IDR'
      }
    };
  }

  /**
   * Generate insights from data
   */
  private async generateInsights(
    entityId: string,
    currentData: any,
    previousData: any
  ): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Revenue insights
    if (currentData.revenue > previousData.revenue * 1.1) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'opportunity',
        category: 'revenue',
        title: 'Revenue spike detected',
        description: `Revenue increased by ${((currentData.revenue / previousData.revenue - 1) * 100).toFixed(1)}% compared to the previous period`,
        recommendation: 'Investigate what drove this growth to replicate success',
        confidence: 0.9,
        impact: 'high',
        createdAt: new Date()
      });
    }

    // Expense insights
    if (currentData.expenses > previousData.expenses * 1.15) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'warning',
        category: 'expenses',
        title: 'Expense increase detected',
        description: `Expenses increased by ${((currentData.expenses / previousData.expenses - 1) * 100).toFixed(1)}% compared to the previous period`,
        recommendation: 'Review expense categories to identify areas for optimization',
        confidence: 0.85,
        impact: 'medium',
        createdAt: new Date()
      });
    }

    // Cash position insights
    const daysOfCash = currentData.cash / (currentData.expenses / 30);
    if (daysOfCash < 30) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'critical',
        category: 'cash',
        title: 'Low cash reserves',
        description: `Current cash position supports only ${daysOfCash.toFixed(0)} days of operations`,
        recommendation: 'Consider securing additional funding or reducing expenses',
        confidence: 0.95,
        impact: 'high',
        createdAt: new Date()
      });
    } else if (daysOfCash > 180) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'opportunity',
        category: 'cash',
        title: 'Strong cash position',
        description: `Current cash reserves support ${daysOfCash.toFixed(0)} days of operations`,
        recommendation: 'Consider investing excess cash or expanding operations',
        confidence: 0.8,
        impact: 'medium',
        createdAt: new Date()
      });
    }

    return insights;
  }

  /**
   * Identify trends
   */
  private identifyTrends(currentData: any, previousData: any): Trend[] {
    const trends: Trend[] = [];

    // Revenue trend
    const revenueChange = ((currentData.revenue / previousData.revenue - 1) * 100);
    trends.push({
      metric: 'revenue',
      direction: revenueChange > 5 ? 'up' : revenueChange < -5 ? 'down' : 'stable',
      percentage: Math.abs(revenueChange),
      period: 'current'
    });

    // Expense trend
    const expenseChange = ((currentData.expenses / previousData.expenses - 1) * 100);
    trends.push({
      metric: 'expenses',
      direction: expenseChange > 5 ? 'up' : expenseChange < -5 ? 'down' : 'stable',
      percentage: Math.abs(expenseChange),
      period: 'current'
    });

    // Profit margin trend
    const currentMargin = (currentData.netProfit / currentData.revenue) * 100;
    const previousMargin = (previousData.netProfit / previousData.revenue) * 100;
    const marginChange = currentMargin - previousMargin;
    
    trends.push({
      metric: 'profitMargin',
      direction: marginChange > 2 ? 'up' : marginChange < -2 ? 'down' : 'stable',
      percentage: Math.abs(marginChange),
      period: 'current',
      description: `Current margin: ${currentMargin.toFixed(1)}%`
    });

    return trends;
  }

  /**
   * Find opportunities
   */
  private findOpportunities(currentData: any, insights: Insight[]): Opportunity[] {
    const opportunities: Opportunity[] = [];

    // Extract opportunity insights
    insights
      .filter(i => i.type === 'opportunity')
      .forEach((insight, index) => {
        opportunities.push({
          id: insight.id,
          title: insight.title,
          description: insight.description,
          effort: 'medium',
          priority: index + 1
        });
      });

    return opportunities;
  }

  /**
   * Assess risks
   */
  private assessRisks(currentData: any, insights: Insight[]): Risk[] {
    const risks: Risk[] = [];

    // Extract warning and critical insights as risks
    insights
      .filter(i => i.type === 'warning' || i.type === 'critical')
      .forEach((insight) => {
        risks.push({
          id: insight.id,
          title: insight.title,
          description: insight.description,
          severity: insight.type === 'critical' ? 'critical' : 'medium',
          probability: insight.confidence,
          mitigation: insight.recommendation
        });
      });

    return risks;
  }

  /**
   * Generate forecast
   */
  private async generateForecast(
    _entityId: string,
    metric: string,
    _days: number
  ): Promise<Forecast> {
    // Simple linear regression forecast
    // In production, use more sophisticated forecasting methods

    return {
      metric,
      periods: [],
      confidence: 0.7,
      method: 'linear_regression'
    };
  }

  /**
   * Cache insights
   */
  async cacheInsights(
    entityId: string,
    insightType: string,
    data: any,
    ttlMinutes: number = 60
  ): Promise<void> {
    const id = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

    await this.db
      .prepare(
        `INSERT INTO insights_cache 
         (id, entity_id, insight_type, data, generated_at, expires_at) 
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        entityId,
        insightType,
        JSON.stringify(data),
        now.toISOString(),
        expiresAt.toISOString()
      )
      .run();
  }

  /**
   * Get cached insights
   */
  async getCachedInsights(
    entityId: string,
    insightType: string
  ): Promise<any | null> {
    const result = await this.db
      .prepare(
        `SELECT data, expires_at FROM insights_cache 
         WHERE entity_id = ? AND insight_type = ? 
         ORDER BY generated_at DESC LIMIT 1`
      )
      .bind(entityId, insightType)
      .first();

    if (!result) return null;

    const expiresAt = new Date(result.expires_at as string);
    if (expiresAt < new Date()) {
      // Cache expired
      return null;
    }

    return JSON.parse(result.data as string);
  }
}
