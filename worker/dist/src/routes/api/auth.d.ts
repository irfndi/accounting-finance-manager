import { Hono } from 'hono';
import { AppContext } from '../../types';
declare const authRouter: Hono<AppContext, import("hono/types").BlankSchema, "/">;
export default authRouter;
