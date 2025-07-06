declare module 'cloudflare:test' {
  // ProvidedEnv controls the type of `import("cloudflare:test").env`
  interface ProvidedEnv extends Env {
    // Add any test-specific environment variables here
    TEST_NAMESPACE?: KVNamespace;
  }
}

// Global test types
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'test' | 'development' | 'production';
    }
  }
}

export {}; 