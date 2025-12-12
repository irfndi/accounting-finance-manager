import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { budgetApi, type Budget, type BudgetPeriod } from '../../lib/api';
import BudgetForm from './BudgetForm';

interface BudgetListProps {
    selectedPeriod: BudgetPeriod | null;
}

export default function BudgetList({ selectedPeriod }: BudgetListProps) {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

    const fetchBudgets = async () => {
        if (!selectedPeriod) return;
        try {
            setLoading(true);
            const data = await budgetApi.getBudgets({ periodId: selectedPeriod.id });
            setBudgets(data.budgets);
        } catch (error) {
            console.error('Failed to fetch budgets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgets();
    }, [selectedPeriod]);

    const handleCreate = () => {
        setEditingBudget(null);
        setIsFormOpen(true);
    };

    const handleEdit = (budget: Budget) => {
        setEditingBudget(budget);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this budget?')) return;
        try {
            await budgetApi.deleteBudget(id);
            fetchBudgets();
        } catch (error) {
            console.error('Failed to delete budget:', error);
            alert('Failed to delete budget');
        }
    };

    if (!selectedPeriod) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-gray-500">
                    Select a budget period to view budgets.
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Budgets for {selectedPeriod.name}</CardTitle>
                        <Button onClick={handleCreate}>+ Create Budget</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-4">Loading budgets...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Planned Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {budgets.map(budget => (
                                    <TableRow key={budget.id}>
                                        <TableCell className="font-medium">{budget.name}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${budget.budgetType === 'REVENUE' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                {budget.budgetType}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`capitalize px-2 py-1 rounded-full text-xs border ${budget.status === 'active' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                                budget.status === 'locked' ? 'bg-gray-100 border-gray-300 text-gray-700' :
                                                    'bg-yellow-50 border-yellow-200 text-yellow-700'
                                                }`}>
                                                {budget.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(budget.plannedAmount)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(budget)}>Edit</Button>
                                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800" onClick={() => handleDelete(budget.id)}>Delete</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {budgets.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                            No budgets found for this period.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {isFormOpen && (
                <BudgetForm
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={fetchBudgets}
                    periods={[selectedPeriod]}
                    initialData={editingBudget}
                />
            )}
        </>
    );
}
