import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface FinancialMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

export default function FinanceDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [activeModule, setActiveModule] = useState('overview');

  const metrics: FinancialMetric[] = [
    { label: 'Total Revenue', value: '$2,847,392', change: '+12.3%', trend: 'up' },
    { label: 'Operating Expenses', value: '$1,923,847', change: '+5.7%', trend: 'up' },
    { label: 'Net Income', value: '$923,545', change: '+18.9%', trend: 'up' },
    { label: 'Cash Flow', value: '$1,234,567', change: '-2.1%', trend: 'down' },
  ];

  const modules = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'gl', name: 'General Ledger', icon: '📋' },
    { id: 'reports', name: 'Financial Reports', icon: '📈' },
    { id: 'budget', name: 'Budget & Forecast', icon: '💰' },
    { id: 'audit', name: 'Audit Trail', icon: '🔍' },
    { id: 'entities', name: 'Multi-Entity', icon: '🏢' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Corporate Finance Dashboard</h1>
          <p className="text-slate-600">Manage your corporate accounting & finance operations</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="current">Current Month</option>
            <option value="quarter">Current Quarter</option>
            <option value="year">Current Year</option>
          </select>
          <Button variant="outline">Export Report</Button>
        </div>
      </div>

      {/* Navigation Modules */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {modules.map((module) => (
          <Card 
            key={module.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              activeModule === module.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => setActiveModule(module.id)}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">{module.icon}</div>
              <div className="text-sm font-medium">{module.name}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                </div>
                <div className={`text-sm font-medium ${
                  metric.trend === 'up' ? 'text-green-600' : 
                  metric.trend === 'down' ? 'text-red-600' : 'text-slate-600'
                }`}>
                  {metric.change}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Module Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {modules.find(m => m.id === activeModule)?.name || 'Overview'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeModule === 'overview' && (
            <div className="space-y-4">
              <p className="text-slate-600">
                Welcome to your Corporate Finance Dashboard. Select a module above to access specific functions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900">Recent Activity</h4>
                  <p className="text-sm text-blue-700">5 journal entries pending approval</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900">Compliance Status</h4>
                  <p className="text-sm text-green-700">All reports up to date</p>
                </div>
              </div>
            </div>
          )}
          
          {activeModule === 'gl' && (
            <div className="space-y-4">
              <p className="text-slate-600">General Ledger & Journal Entries</p>
              <div className="space-y-2">
                <Button className="w-full md:w-auto">New Journal Entry</Button>
                <Button variant="outline" className="w-full md:w-auto ml-0 md:ml-2">
                  View Chart of Accounts
                </Button>
              </div>
            </div>
          )}

          {activeModule === 'reports' && (
            <div className="space-y-4">
              <p className="text-slate-600">Financial Reports & Statements</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline">P&L Statement</Button>
                <Button variant="outline">Balance Sheet</Button>
                <Button variant="outline">Cash Flow</Button>
              </div>
            </div>
          )}

          {activeModule !== 'overview' && activeModule !== 'gl' && activeModule !== 'reports' && (
            <div className="text-center py-8 text-slate-500">
              <p>Module "{modules.find(m => m.id === activeModule)?.name}" coming soon...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 