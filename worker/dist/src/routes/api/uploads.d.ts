import { Hono } from 'hono';
import type { AppContext } from '../../types';
declare const uploads: Hono<AppContext, import("hono/types").BlankSchema, "/">;
export default uploads;
