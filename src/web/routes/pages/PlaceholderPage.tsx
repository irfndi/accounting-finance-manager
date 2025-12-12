import React from 'react';
import { Card } from '../../components/ui/card';

type PlaceholderPageProps = {
  title: string;
  description?: string;
};

export default function PlaceholderPage({ title, description = 'This area is being modernized with TanStack. Functionality will ship soon.' }: PlaceholderPageProps) {
  return (
    <Card className="p-8">
      <div className="space-y-2">
        <p className="text-3xl">🚧</p>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="text-slate-600">{description}</p>
      </div>
    </Card>
  );
}
