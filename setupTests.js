// Minimal Jest setup file. This file exists so jest doesn't error when the
// setupFilesAfterEnv entry is present in jest.config.js.
// Add global test setup here if needed (e.g. global mocks, test timeouts).

// Ensure reflect-metadata is loaded for NestJS tests that rely on decorators
try {
  require('reflect-metadata');
} catch (e) {
  // ignore if not available during initial setup
}

// Example: increase default timeout for slow integration tests
jest.setTimeout(10000);
