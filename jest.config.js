module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Match spec files anywhere in the project root or under src/
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
};