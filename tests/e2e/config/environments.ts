export interface EnvironmentConfig {
  retries: number;
  workers: number;
  timeout: number;
  use: {
    baseURL: string;
    headless?: boolean;
    trace?: 'on-first-retry' | 'retain-on-failure' | 'on';
    screenshot?: 'only-on-failure' | 'off' | 'on';
    video?: 'retain-on-failure' | 'on-first-retry' | 'off' | 'on';
  };
}

const environments: Record<string, EnvironmentConfig> = {
  development: {
    retries: 1,
    workers: 1, // Single worker to avoid DB conflicts
    timeout: 30000,
    use: {
      baseURL: 'http://localhost:3000',
      headless: true,
      trace: 'retain-on-failure',
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
    },
  },
  ci: {
    retries: 2,
    workers: 2,
    timeout: 60000,
    use: {
      baseURL: 'http://localhost:3000',
      headless: true,
      trace: 'on-first-retry',
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
    },
  },
  staging: {
    retries: 2,
    workers: 4,
    timeout: 45000,
    use: {
      baseURL: process.env.STAGING_URL || 'https://staging.finance-manager.com',
      headless: true,
      trace: 'retain-on-failure',
      screenshot: 'only-on-failure',
      video: 'off',
    },
  },
  production: {
    retries: 3,
    workers: 6,
    timeout: 60000,
    use: {
      baseURL: process.env.PRODUCTION_URL || 'https://finance-manager.com',
      headless: true,
      trace: 'retain-on-failure',
      screenshot: 'only-on-failure',
      video: 'off',
    },
  },
};

export function getEnvironmentConfig(): EnvironmentConfig {
  const env = process.env.TEST_ENV || process.env.NODE_ENV || 'development';
  
  if (env in environments) {
    return environments[env];
  }
  
  console.warn(`Unknown environment: ${env}. Falling back to development config.`);
  return environments.development;
}

export function getTestDatabaseUrl(): string {
  // For E2E tests, we need a separate test database to avoid conflicts
  const testDbUrl = process.env.TEST_DATABASE_URL;
  
  if (testDbUrl) {
    return testDbUrl;
  }
  
  // Fallback to development database with test prefix
  const devDbUrl = process.env.DATABASE_URL;
  if (devDbUrl) {
    // For local SQLite, create a test version
    if (devDbUrl.includes('.sqlite')) {
      return devDbUrl.replace('.sqlite', '.test.sqlite');
    }
    // For other databases, append test suffix
    return `${devDbUrl}_test`;
  }
  
  // Default test database
  return './test.sqlite';
}