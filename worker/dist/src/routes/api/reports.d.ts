import { Hono } from 'hono';
import { DatabaseAdapter, FinancialReportsEngine } from '@finance-manager/core';
import { AppContext, AuthVariables } from '../../types';
type ReportsContext = {
    Variables: AuthVariables & {
        dbAdapter: DatabaseAdapter;
        reportsEngine: FinancialReportsEngine;
        entityId: string;
    };
};
declare const reportsRouter: Hono<AppContext & ReportsContext, import("hono/types").BlankSchema, "/">;
export default reportsRouter;
