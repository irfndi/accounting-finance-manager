import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import TransactionManager from './TransactionManager';
import CategorizationManager from './CategorizationManager';
import { aiClient } from '../lib/ai-client';

interface FinancialMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  aiInsight?: string;
}

interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'compliance' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
}

interface FinancialAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
}

export default function FinanceDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [activeModule, setActiveModule] = useState('overview');
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [financialAlerts, setFinancialAlerts] = useState<FinancialAlert[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(true);

  const metrics: FinancialMetric[] = [
    { label: 'Total Assets', value: '$0', change: '', trend: 'neutral' },
    { label: 'Total Liabilities', value: '$0', change: '', trend: 'neutral' },
    { label: 'Net Worth', value: '$0', change: '', trend: 'neutral' },
    { label: 'Revenue', value: '$0', change: '', trend: 'neutral' },
  ];

  const modules = [
    { id: 'overview', name: 'Overview', icon: '📊', hasAI: true },
    { id: 'gl', name: 'General Ledger', icon: '📋', hasAI: true },
    { id: 'categorization', name: 'AI Categorization', icon: '🎯', hasAI: true },
    { id: 'reports', name: 'Financial Reports', icon: '📈', hasAI: true },
    { id: 'budget', name: 'Budget & Forecast', icon: '💰', hasAI: true },
    { id: 'audit', name: 'Audit Trail', icon: '🔍', hasAI: true },
    { id: 'entities', name: 'Multi-Entity', icon: '🏢', hasAI: false },
    { id: 'ai-insights', name: 'AI Insights', icon: '🤖', hasAI: true },
  ];

  // Load AI insights on component mount and when period changes
  useEffect(() => {
    loadAIInsights();
    loadFinancialAlerts();
  }, [selectedPeriod]);

  const loadAIInsights = async () => {
    setLoadingInsights(true);
    try {
      const response = await aiClient.generateInsights({
        period: selectedPeriod,
        metrics: metrics.map(m => ({ label: m.label, value: m.value, change: m.change })),
        includeForecasting: true,
        includeRiskAnalysis: true
      });

      if (response.success && response.result) {
        const insights: AIInsight[] = response.result.insights.map((insight: any, index: number) => ({
          id: `insight-${index}`,
          type: insight.type,
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          priority: insight.priority,
          timestamp: new Date()
        }));
        
        setAiInsights(insights);
      }
    } catch (error) {
      console.error('Error loading AI insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const loadFinancialAlerts = async () => {
    try {
      // Simulate financial alerts - in real app, this would come from your backend
      const mockAlerts: FinancialAlert[] = [
        {
          id: 'alert-1',
          type: 'warning',
          message: 'Q4 budget utilization at 87% with 2 months remaining',
          timestamp: new Date()
        },
        {
          id: 'alert-2',
          type: 'info',
          message: 'Monthly reconciliation completed successfully',
          timestamp: new Date()
        }
      ];
      
      setFinancialAlerts(mockAlerts);
    } catch (error) {
      console.error('Error loading financial alerts:', error);
    }
  };

  const refreshAIInsights = () => {
    loadAIInsights();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-700 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return '💡';
      case 'risk': return '⚠️';
      case 'compliance': return '📋';
      case 'optimization': return '⚡';
      default: return '💡';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 data-testid="dashboard-title" className="text-3xl font-bold text-slate-800">Corporate Finance Dashboard</h1>
          <p data-testid="dashboard-description" className="text-slate-600">Monitor your financial performance with AI-powered insights</p>
        </div>
        <div className="flex gap-2">
          <select 
            data-testid="period-selector"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white"
          >
            <option data-testid="period-option-month" value="current">Current Month</option>
            <option data-testid="period-option-quarter" value="quarter">Current Quarter</option>
            <option data-testid="period-option-year" value="year">Current Year</option>
          </select>
          <Button 
            data-testid="refresh-ai-button"
            onClick={refreshAIInsights}
            variant="outline"
            disabled={loadingInsights}
            className="bg-purple-50 hover:bg-purple-100 text-purple-700"
          >
            {loadingInsights ? '🤖 Analyzing...' : '🤖 Refresh AI'}
          </Button>
          <Button data-testid="export-report-button" variant="outline">Export Report</Button>
        </div>
      </div>

      {/* Financial Alerts */}
      {financialAlerts.length > 0 && (
        <div className="space-y-2">
          {financialAlerts.map((alert) => (
            <div key={alert.id} className={`p-3 rounded-lg border-l-4 ${
              alert.type === 'error' ? 'bg-red-50 border-red-400 text-red-700' :
              alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-800' :
          'bg-blue-50 border-blue-400 text-blue-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm">{alert.message}</span>
                <span className="text-xs text-gray-600">
                  {alert.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Modules */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {modules.map((module) => (
          <Card 
            key={module.id}
            data-testid={`${module.id === 'overview' ? 'overview-module' : 
                         module.id === 'gl' ? 'general-ledger-module' : 
                         module.id === 'categorization' ? 'ai-categorization-module' : 
                         module.id === 'reports' ? 'financial-reports-module' : 
                         module.id === 'ai-insights' ? 'ai-insights-module' : 
                         `${module.id}-module`}`}
            className={`cursor-pointer transition-all hover:shadow-md ${
              activeModule === module.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => {
              // For specific modules, navigate to their pages
              if (module.id === 'gl') {
                window.location.href = '/general-ledger';
              } else if (module.id === 'reports') {
                window.location.href = '/reports';
              } else if (module.id === 'categorization') {
                window.location.href = '/categorization';
              } else if (module.id === 'budget') {
                window.location.href = '/budget';
              } else if (module.id === 'audit') {
                window.location.href = '/audit';
              } else if (module.id === 'entities') {
                window.location.href = '/entities';
              } else {
                // For other modules, just set the active module
                setActiveModule(module.id);
              }
            }}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">
                {module.icon}
                {module.hasAI && <span className="text-xs ml-1">🤖</span>}
              </div>
              <div className="text-sm font-medium">{module.name}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Key Metrics with AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.label} className="relative overflow-hidden">
            <CardContent data-testid={`${metric.label.toLowerCase().replace(/ /g, '-')}-card`} className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                </div>
                <div className={`text-sm font-medium ${
                  metric.trend === 'up' ? 'text-green-700' : 
                  metric.trend === 'down' ? 'text-red-600' : 'text-slate-600'
                }`}>
                  {metric.change}
                </div>
              </div>
              {metric.aiInsight && showAIPanel && (
                <div className="mt-3 p-2 bg-purple-50 rounded-md border-l-2 border-purple-300">
                  <div className="flex items-start gap-2">
                    <span className="text-xs">🤖</span>
                    <p className="text-xs text-purple-700 leading-relaxed">
                      {metric.aiInsight}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights Toggle */}
      <div className="flex justify-end">
        <Button
          data-testid="ai-insights-toggle"
          onClick={() => setShowAIPanel(!showAIPanel)}
          variant="outline"
          size="sm"
          className={showAIPanel ? 'bg-purple-100 text-purple-700' : ''}
        >
          {showAIPanel ? 'Hide AI Insights' : 'Show AI Insights'}
        </Button>
      </div>

      {/* Active Module Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {modules.find(m => m.id === activeModule)?.name || 'Overview'}
            {modules.find(m => m.id === activeModule)?.hasAI && (
              <span className="text-sm text-purple-600 font-normal">AI-Enhanced</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeModule === 'overview' && (
            <div className="space-y-6">
              <p className="text-slate-600">
                Welcome to your AI-powered Corporate Finance Dashboard. Get intelligent insights and automated analysis.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                    📊 Recent Activity
                  </h4>
                  <p className="text-sm text-blue-800">5 journal entries pending approval</p>
                  <p className="text-sm text-blue-800">3 AI-flagged transactions for review</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 flex items-center gap-2">
                    ✅ Compliance Status
                  </h4>
                  <p className="text-sm text-green-700">All reports up to date</p>
                  <p className="text-sm text-green-700">AI compliance check: 98% score</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button data-testid="add-transaction-button" variant="outline" onClick={() => setActiveModule('gl')}>
                    📝 New Transaction
                  </Button>
                  <Button data-testid="generate-report-button" variant="outline" onClick={() => setActiveModule('reports')}>
                    📊 Generate Report
                  </Button>
                  <Button data-testid="ai-analysis-button" variant="outline" onClick={() => setActiveModule('ai-insights')}>
                    🤖 AI Analysis
                  </Button>
                  <Button data-testid="budget-review-button" variant="outline" onClick={() => setActiveModule('budget')}>
                    💰 Budget Review
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {activeModule === 'gl' && (
            <TransactionManager />
          )}

          {activeModule === 'categorization' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">AI Transaction Categorization</h3>
                <div className="text-sm text-gray-600">
                  Review and approve AI-suggested transaction categories
                </div>
              </div>
              <CategorizationManager 
                onSuggestionApproved={(_suggestion) => {
                  // Handle approved suggestion - could refresh transaction list or show notification
                  // console.log('Suggestion approved:', suggestion);
                }}
                className="bg-white rounded-lg shadow-sm"
              />
            </div>
          )}

          {activeModule === 'ai-insights' && (
            <div data-testid="ai-insights-content" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 data-testid="ai-insights-title" className="text-lg font-semibold">AI Financial Insights</h3>
                <Button 
                  onClick={refreshAIInsights}
                  variant="outline"
                  size="sm"
                  disabled={loadingInsights}
                >
                  {loadingInsights ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>

              {loadingInsights ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-2 text-gray-600">AI is analyzing your financial data...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiInsights.map((insight) => (
                    <Card key={insight.id} className="border-l-4 border-purple-400">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getTypeIcon(insight.type)}</span>
                            <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(insight.priority)}`}>
                            {insight.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
                          <span>{insight.timestamp.toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {aiInsights.length === 0 && !loadingInsights && (
                <div className="text-center py-8 text-gray-500">
                  <p>No AI insights available. Click "Refresh" to generate new insights.</p>
                </div>
              )}
            </div>
          )}

          {activeModule === 'reports' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-600">AI-Enhanced Financial Reports & Statements</p>
                <Button variant="outline" size="sm" className="bg-purple-50 text-purple-700">
                  🤖 AI Report Builder
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 hover:shadow-md cursor-pointer">
                  <div className="text-center">
                    <div className="text-2xl mb-2">📊</div>
                    <h4 className="font-medium">P&L Statement</h4>
                    <p className="text-xs text-gray-500 mt-1">AI insights included</p>
                  </div>
                </Card>
                <Card className="p-4 hover:shadow-md cursor-pointer">
                  <div className="text-center">
                    <div className="text-2xl mb-2">📈</div>
                    <h4 className="font-medium">Balance Sheet</h4>
                    <p className="text-xs text-gray-500 mt-1">AI validated</p>
                  </div>
                </Card>
                <Card className="p-4 hover:shadow-md cursor-pointer">
                  <div className="text-center">
                    <div className="text-2xl mb-2">💰</div>
                    <h4 className="font-medium">Cash Flow</h4>
                    <p className="text-xs text-gray-500 mt-1">AI forecasting</p>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeModule === 'budget' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-600">AI-Powered Budget Management & Forecasting</p>
                <Button variant="outline" size="sm" className="bg-purple-50 text-purple-700">
                  🤖 AI Budget Optimizer
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Budget vs Actual</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Revenue</span>
                      <span className="text-green-600">+5.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expenses</span>
                      <span className="text-red-600">-2.1%</span>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <h4 className="font-medium mb-2">AI Forecast</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Q1 Projection</span>
                      <span className="text-blue-600">$125K</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence</span>
                      <span className="text-purple-600">87%</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeModule === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-600">AI-Enhanced Audit Trail & Compliance</p>
                <Button variant="outline" size="sm" className="bg-purple-50 text-purple-700">
                  🤖 AI Audit Assistant
                </Button>
              </div>
              <Card className="p-4">
                <h4 className="font-medium mb-2">Recent Activity</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Journal Entry #JE001</span>
                    <span className="text-gray-600">2 hours ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Account Reconciliation</span>
                    <span className="text-gray-600">5 hours ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI Anomaly Detection</span>
                    <span className="text-green-600">Passed</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeModule === 'entities' && (
            <div className="space-y-4">
              <p className="text-slate-600">Multi-Entity Consolidation & Management</p>
              <Card className="p-4">
                <h4 className="font-medium mb-2">Entity Overview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Parent Company</span>
                    <span className="text-green-600">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subsidiary A</span>
                    <span className="text-green-600">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subsidiary B</span>
                    <span className="text-yellow-600">Pending</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}