import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { budgetApi, type BudgetPeriod, type CreateBudgetPeriodRequest } from '../../lib/api';

interface BudgetPeriodManagerProps {
    onPeriodSelect?: (period: BudgetPeriod) => void;
    selectedPeriodId?: number;
}

export default function BudgetPeriodManager({ onPeriodSelect, selectedPeriodId }: BudgetPeriodManagerProps) {
    const [periods, setPeriods] = useState<BudgetPeriod[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<CreateBudgetPeriodRequest>>({
        name: '',
        type: 'monthly',
        fiscalYear: new Date().getFullYear(),
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    const fetchPeriods = async () => {
        try {
            setLoading(true);
            const data = await budgetApi.getPeriods();
            setPeriods(data.periods);
        } catch (error) {
            console.error('Failed to fetch periods:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPeriods();
    }, []);

    const handleCreate = async () => {
        try {
            if (!formData.name || !formData.startDate || !formData.endDate || !formData.fiscalYear || !formData.type) {
                alert('Please fill in all required fields');
                return;
            }

            await budgetApi.createPeriod(formData as CreateBudgetPeriodRequest);
            setIsDialogOpen(false);
            fetchPeriods();

            // Reset form defaults
            setFormData({
                name: '',
                type: 'monthly',
                fiscalYear: new Date().getFullYear(),
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
            });
        } catch (error) {
            console.error('Failed to create period:', error);
            alert('Failed to create period. Please check the inputs.');
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Budget Periods</CardTitle>
                    <Button onClick={() => setIsDialogOpen(true)} variant="outline" size="sm">
                        + New Period
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-4 text-gray-500">Loading periods...</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {periods.map((period) => (
                                <TableRow key={period.id} className={selectedPeriodId === period.id ? 'bg-blue-50' : ''}>
                                    <TableCell className="font-medium">{period.name}</TableCell>
                                    <TableCell className="capitalize">{period.type}</TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                        {period.startDate} to {period.endDate}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs ${period.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {period.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {onPeriodSelect && (
                                            <Button variant="ghost" size="sm" onClick={() => onPeriodSelect(period)}>
                                                Select
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {periods.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        No budget periods defined. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Budget Period</DialogTitle>
                            <DialogDescription>Define a new time period for budget tracking.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. FY 2025"
                                    />
                                </div>
                                <div>
                                    <Label>Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(val: string) => setFormData({ ...formData, type: val as 'monthly' | 'quarterly' | 'yearly' })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="quarterly">Quarterly</SelectItem>
                                            <SelectItem value="yearly">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>End Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Fiscal Year</Label>
                                <Input
                                    type="number"
                                    value={formData.fiscalYear}
                                    onChange={e => setFormData({ ...formData, fiscalYear: parseInt(e.target.value) || new Date().getFullYear() })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate}>Create Period</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
