import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  Button,
} from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './ui/tabs';

interface FinancialData {
  id: string;
  name: string;
  amount: number;
  formattedAmount: string;
  children?: FinancialData[];
}

interface BalanceSheetData {
  assets: {
    currentAssets: FinancialData[];
    nonCurrentAssets: FinancialData[];
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: FinancialData[];
    nonCurrentLiabilities: FinancialData[];
    totalLiabilities: number;
  };
  equity: {
    items: FinancialData[];
    totalEquity: number;
  };
}

interface IncomeStatementData {
  revenue: FinancialData[];
  expenses: FinancialData[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

interface CashFlowData {
  operating: FinancialData[];
  investing: FinancialData[];
  financing: FinancialData[];
  netCashFlow: number;
}

const API_BASE_URL = typeof window !== 'undefined' 
  ? ((import.meta as any).env?.PUBLIC_API_BASE_URL || window.location.origin)
  : 'http://localhost:3000';

export default function FinancialStatements() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatementData | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowData | null>(null);

  // Generate year options (current year and 4 previous years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  const fetchBalanceSheet = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/reports/balance-sheet?year=${selectedYear}&period=${selectedPeriod}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch balance sheet: ${response.statusText}`);
      }
      
      const data = await response.json() as BalanceSheetData;
      setBalanceSheet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance sheet');
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomeStatement = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/reports/income-statement?year=${selectedYear}&period=${selectedPeriod}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch income statement: ${response.statusText}`);
      }
      
      const data = await response.json() as IncomeStatementData;
      setIncomeStatement(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch income statement');
    } finally {
      setLoading(false);
    }
  };

  const fetchCashFlow = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/reports/cash-flow?year=${selectedYear}&period=${selectedPeriod}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch cash flow: ${response.statusText}`);
      }
      
      const data = await response.json() as CashFlowData;
      setCashFlow(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cash flow');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllReports = async () => {
    await Promise.all([
      fetchBalanceSheet(),
      fetchIncomeStatement(),
      fetchCashFlow()
    ]);
  };

  useEffect(() => {
    fetchAllReports();
  }, [selectedYear, selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderFinancialDataRows = (items: FinancialData[], level: number = 0) => {
    return items.map((item) => (
      <React.Fragment key={item.id}>
        <TableRow className={level > 0 ? 'bg-gray-50' : ''}>
          <TableCell style={{ paddingLeft: `${16 + level * 20}px` }}>
            {item.name}
          </TableCell>
          <TableCell className="text-right font-mono">
            {item.formattedAmount || formatCurrency(item.amount)}
          </TableCell>
        </TableRow>
        {item.children && renderFinancialDataRows(item.children, level + 1)}
      </React.Fragment>
    ));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-gray-500">Loading financial statements...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Financial Statements</CardTitle>
              <CardDescription>
                View Balance Sheet, Income Statement, and Cash Flow reports
              </CardDescription>
            </div>
            <div className="flex gap-4">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(year => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Period</SelectItem>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchAllReports} variant="outline">
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <Tabs defaultValue="balance-sheet" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
              <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
              <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
            </TabsList>

            <TabsContent value="balance-sheet" className="space-y-6">
              {balanceSheet ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Assets */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Assets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Account</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {balanceSheet.assets.currentAssets.length > 0 && (
                            <>
                              <TableRow className="bg-blue-50">
                                <TableCell className="font-semibold">Current Assets</TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                              {renderFinancialDataRows(balanceSheet.assets.currentAssets, 1)}
                            </>
                          )}
                          {balanceSheet.assets.nonCurrentAssets.length > 0 && (
                            <>
                              <TableRow className="bg-blue-50">
                                <TableCell className="font-semibold">Non-Current Assets</TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                              {renderFinancialDataRows(balanceSheet.assets.nonCurrentAssets, 1)}
                            </>
                          )}
                          <TableRow className="border-t-2 border-gray-300 font-bold">
                            <TableCell>Total Assets</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(balanceSheet.assets.totalAssets)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Liabilities & Equity */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Liabilities & Equity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Account</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {balanceSheet.liabilities.currentLiabilities.length > 0 && (
                            <>
                              <TableRow className="bg-red-50">
                                <TableCell className="font-semibold">Current Liabilities</TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                              {renderFinancialDataRows(balanceSheet.liabilities.currentLiabilities, 1)}
                            </>
                          )}
                          {balanceSheet.liabilities.nonCurrentLiabilities.length > 0 && (
                            <>
                              <TableRow className="bg-red-50">
                                <TableCell className="font-semibold">Non-Current Liabilities</TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                              {renderFinancialDataRows(balanceSheet.liabilities.nonCurrentLiabilities, 1)}
                            </>
                          )}
                          <TableRow className="border-t border-gray-200 font-semibold">
                            <TableCell>Total Liabilities</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(balanceSheet.liabilities.totalLiabilities)}
                            </TableCell>
                          </TableRow>
                          {balanceSheet.equity.items.length > 0 && (
                            <>
                              <TableRow className="bg-purple-50">
                                <TableCell className="font-semibold">Equity</TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                              {renderFinancialDataRows(balanceSheet.equity.items, 1)}
                            </>
                          )}
                          <TableRow className="border-t border-gray-200 font-semibold">
                            <TableCell>Total Equity</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(balanceSheet.equity.totalEquity)}
                            </TableCell>
                          </TableRow>
                          <TableRow className="border-t-2 border-gray-300 font-bold">
                            <TableCell>Total Liabilities & Equity</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(balanceSheet.liabilities.totalLiabilities + balanceSheet.equity.totalEquity)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No balance sheet data available
                </div>
              )}
            </TabsContent>

            <TabsContent value="income-statement" className="space-y-6">
              {incomeStatement ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Income Statement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Account</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {incomeStatement.revenue.length > 0 && (
                          <>
                            <TableRow className="bg-green-50">
                              <TableCell className="font-semibold">Revenue</TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                            {renderFinancialDataRows(incomeStatement.revenue, 1)}
                            <TableRow className="border-t border-gray-200 font-semibold">
                              <TableCell>Total Revenue</TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(incomeStatement.totalRevenue)}
                              </TableCell>
                            </TableRow>
                          </>
                        )}
                        {incomeStatement.expenses.length > 0 && (
                          <>
                            <TableRow className="bg-orange-50">
                              <TableCell className="font-semibold">Expenses</TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                            {renderFinancialDataRows(incomeStatement.expenses, 1)}
                            <TableRow className="border-t border-gray-200 font-semibold">
                              <TableCell>Total Expenses</TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(incomeStatement.totalExpenses)}
                              </TableCell>
                            </TableRow>
                          </>
                        )}
                        <TableRow className="border-t-2 border-gray-300 font-bold">
                          <TableCell>Net Income</TableCell>
                          <TableCell className={`text-right font-mono ${
                            incomeStatement.netIncome >= 0 ? 'text-green-700' : 'text-red-600'
                          }`}>
                            {formatCurrency(incomeStatement.netIncome)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No income statement data available
                </div>
              )}
            </TabsContent>

            <TabsContent value="cash-flow" className="space-y-6">
              {cashFlow ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cash Flow Statement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Activity</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cashFlow.operating.length > 0 && (
                          <>
                            <TableRow className="bg-blue-50">
                              <TableCell className="font-semibold">Operating Activities</TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                            {renderFinancialDataRows(cashFlow.operating, 1)}
                          </>
                        )}
                        {cashFlow.investing.length > 0 && (
                          <>
                            <TableRow className="bg-purple-50">
                              <TableCell className="font-semibold">Investing Activities</TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                            {renderFinancialDataRows(cashFlow.investing, 1)}
                          </>
                        )}
                        {cashFlow.financing.length > 0 && (
                          <>
                            <TableRow className="bg-green-50">
                              <TableCell className="font-semibold">Financing Activities</TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                            {renderFinancialDataRows(cashFlow.financing, 1)}
                          </>
                        )}
                        <TableRow className="border-t-2 border-gray-300 font-bold">
                          <TableCell>Net Cash Flow</TableCell>
                          <TableCell className={`text-right font-mono ${
                            cashFlow.netCashFlow >= 0 ? 'text-green-700' : 'text-red-600'
                          }`}>
                            {formatCurrency(cashFlow.netCashFlow)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No cash flow data available
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}