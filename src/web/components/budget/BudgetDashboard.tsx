import React, { useState } from 'react';
import BudgetPeriodManager from './BudgetPeriodManager';
import BudgetList from './BudgetList';
import { type BudgetPeriod } from '../../lib/api';

export default function BudgetDashboard() {
    const [selectedPeriod, setSelectedPeriod] = useState<BudgetPeriod | null>(null);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Budget & Forecasting</h1>
                <p className="text-gray-500 mt-2">
                    Manage your financial plans, track performance against targets, and forecast future trends.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Period Management */}
                <div className="lg:col-span-1">
                    <BudgetPeriodManager
                        onPeriodSelect={setSelectedPeriod}
                        selectedPeriodId={selectedPeriod?.id}
                    />
                </div>

                {/* Right Column: Key Metrics & Budget List */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedPeriod && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                                <div className="text-sm font-medium text-gray-500">Selected Period</div>
                                <div className="text-2xl font-bold text-gray-900 mt-1">{selectedPeriod.name}</div>
                                <div className="text-xs text-gray-500 mt-1">{selectedPeriod.type} ({selectedPeriod.fiscalYear})</div>
                            </div>
                            {/* Future: Add Summary Metrics here (Total Income, Total Expenses, Net) */}
                        </div>
                    )}

                    <BudgetList selectedPeriod={selectedPeriod} />
                </div>
            </div>
        </div>
    );
}
