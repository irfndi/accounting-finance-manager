import { Hono } from 'hono';
import { AppContext } from '../../types';
declare const transactionsRouter: Hono<AppContext, import("hono/types").BlankSchema, "/">;
export default transactionsRouter;
