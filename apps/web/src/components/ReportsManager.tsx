import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

interface Report {
  id: string;
  name: string;
  type: string;
  period: string;
  generatedAt: string;
  status: "ready" | "processing" | "error";
}

const API_BASE_URL = "https://finance-manager.irfandimarsya.workers.dev";

export default function ReportsManager() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    checkDataAvailability();
  }, []);

  const checkDataAvailability = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem("finance_manager_token") || "";

      // Check if we have any accounts and transactions
      const [accountsResponse, statsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/accounts`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch(`${API_BASE_URL}/api/stats`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      if (accountsResponse.ok && statsResponse.ok) {
        const accountsData = await accountsResponse.json();
        const statsData = await statsResponse.json();

        const accountsResult = accountsData as { accounts: any[] };
        const statsResult = statsData as { success: boolean; stats: any };
        const hasAccounts =
          accountsResult.accounts && accountsResult.accounts.length > 0;
        const hasTransactions =
          statsResult.success &&
          statsResult.stats.transactions.monthlyCount > 0;

        setHasData(hasAccounts);

        if (hasAccounts) {
          // Generate sample reports based on available data
          const sampleReports: Report[] = [
            {
              id: "1",
              name: "Chart of Accounts Report",
              type: "Account Listing",
              period: "Current",
              generatedAt: new Date().toISOString(),
              status: "ready",
            },
          ];

          if (hasTransactions) {
            sampleReports.push({
              id: "2",
              name: "Transaction Summary",
              type: "Transaction Report",
              period: new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              }),
              generatedAt: new Date().toISOString(),
              status: "ready",
            });
          }

          setReports(sampleReports);
        }
      }
    } catch (err) {
      console.error("Error checking data availability:", err);
      setError("Failed to load reports data");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType: string) => {
    // Placeholder for report generation
    console.log(`Generating ${reportType} report...`);
    // In a real implementation, this would call an API to generate the report
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading reports...</span>
      </div>
    );
  }

  if (!hasData) {
    return (
      <Card className="p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              ></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Data Available
          </h3>
          <p className="text-gray-600 mb-6">
            You need to set up your chart of accounts and add transactions
            before generating financial reports.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => (window.location.href = "/chart-of-accounts")}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Set Up Chart of Accounts
          </Button>
          <Button
            onClick={() => (window.location.href = "/general-ledger")}
            variant="outline"
            className="w-full"
          >
            Add Transactions
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Available Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-gray-600 text-center py-4">
              No reports available. Add more financial data to generate reports.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Report Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Period
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Generated
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 font-medium">{report.name}</td>
                      <td className="py-3 px-4">{report.type}</td>
                      <td className="py-3 px-4">{report.period}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(report.generatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            report.status === "ready"
                              ? "bg-green-100 text-green-800"
                              : report.status === "processing"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {report.status.charAt(0).toUpperCase() +
                            report.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={report.status !== "ready"}
                            onClick={() => generateReport(report.type)}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={report.status !== "ready"}
                          >
                            Download
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Generation Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="p-4 h-auto flex flex-col items-center space-y-2"
              onClick={() => generateReport("Chart of Accounts")}
            >
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                ></path>
              </svg>
              <span className="font-medium">Chart of Accounts</span>
              <span className="text-sm text-gray-600">
                Account listing report
              </span>
            </Button>

            <Button
              variant="outline"
              className="p-4 h-auto flex flex-col items-center space-y-2"
              onClick={() => generateReport("Trial Balance")}
            >
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                ></path>
              </svg>
              <span className="font-medium">Trial Balance</span>
              <span className="text-sm text-gray-600">
                Account balances summary
              </span>
            </Button>

            <Button
              variant="outline"
              className="p-4 h-auto flex flex-col items-center space-y-2"
              onClick={() => generateReport("Transaction Summary")}
            >
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span className="font-medium">Transaction Summary</span>
              <span className="text-sm text-gray-600">
                Monthly transaction report
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
