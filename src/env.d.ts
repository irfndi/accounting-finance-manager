/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { Env } from './worker/types';

declare namespace App {
  interface Locals {
    runtime?: {
      env: Env;
    };
    platformProxy?: {
      env: Env;
    };
    env?: Env;
  }
}