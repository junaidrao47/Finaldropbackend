import 'reflect-metadata';

// Increase timeout for E2E tests
jest.setTimeout(60000);

// Global E2E test utilities
beforeAll(async () => {
  // Setup that runs once before all tests
  console.log('E2E Test Suite Starting...');
});

afterAll(async () => {
  // Cleanup that runs once after all tests
  console.log('E2E Test Suite Complete.');
});
