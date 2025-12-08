import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { budgetApi, type Budget, type CreateBudgetRequest, type BudgetPeriod } from '../../lib/api';

interface BudgetFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    periods: BudgetPeriod[];
    initialData?: Budget | null;
}

export default function BudgetForm({ isOpen, onClose, onSuccess, periods, initialData }: BudgetFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<CreateBudgetRequest>>({
        name: '',
        periodId: undefined,
        totalAmount: 0,
        budgetType: 'EXPENSE',
        description: '',
        status: 'draft'
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                periodId: initialData.budgetPeriodId,
                totalAmount: initialData.plannedAmount,
                budgetType: initialData.budgetType,
                description: initialData.description || '',
                status: initialData.status
            });
        } else {
            setFormData({
                name: '',
                periodId: periods.length > 0 ? periods[0].id : undefined,
                totalAmount: 0,
                budgetType: 'EXPENSE',
                description: '',
                status: 'draft'
            });
        }
    }, [initialData, periods, isOpen]);

    const handleSubmit = async () => {
        try {
            setLoading(true);

            const payload: CreateBudgetRequest = {
                name: formData.name!,
                periodId: formData.periodId!,
                totalAmount: Number(formData.totalAmount),
                budgetType: formData.budgetType || 'EXPENSE',
                description: formData.description,
                status: formData.status
            };

            if (!payload.name || !payload.periodId) {
                alert('Name and Period are required');
                setLoading(false);
                return;
            }

            if (initialData) {
                await budgetApi.updateBudget(initialData.id, payload);
            } else {
                await budgetApi.createBudget(payload);
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save budget:', error);
            alert('Failed to save budget');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Budget' : 'Create New Budget'}</DialogTitle>
                    <DialogDescription>
                        {initialData ? 'Update budget details and planning.' : 'Set up a new budget for a specific period.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Budget Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Q1 Marketing"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="period">Period</Label>
                            <Select
                                value={formData.periodId?.toString()}
                                onValueChange={(val: string) => setFormData({ ...formData, periodId: parseInt(val) })}
                                disabled={!!initialData} // Usually can't change period after creation easily
                            >
                                <SelectTrigger id="period">
                                    <SelectValue placeholder="Select Period" />
                                </SelectTrigger>
                                <SelectContent>
                                    {periods.map(period => (
                                        <SelectItem key={period.id} value={period.id.toString()}>
                                            {period.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="type">Type</Label>
                            <Select
                                value={formData.budgetType}
                                onValueChange={(val: string) => setFormData({ ...formData, budgetType: val })}
                            >
                                <SelectTrigger id="type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EXPENSE">Expense</SelectItem>
                                    <SelectItem value="REVENUE">Revenue</SelectItem>
                                    <SelectItem value="CAPITAL">Capital</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="amount">Total Planned Amount</Label>
                        <Input
                            id="amount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.totalAmount}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(val: string) => setFormData({ ...formData, status: val })}
                        >
                            <SelectTrigger id="status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="locked">Locked</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Saving...' : (initialData ? 'Update Budget' : 'Create Budget')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
