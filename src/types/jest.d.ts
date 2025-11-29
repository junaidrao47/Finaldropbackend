import 'jest';

declare global {
  // Helper exposed in setupTests.js for mocking Drizzle query builders
  // eslint-disable-next-line no-var
  var createMockDb: () => any;
}

export {};
