import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

export default function SimpleChartOfAccounts() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Chart of Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button>Add Account</Button>
          <p>This is a simple test component to verify hydration works.</p>
        </div>
      </CardContent>
    </Card>
  );
}