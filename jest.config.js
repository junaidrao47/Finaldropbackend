module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Match spec files anywhere in the project root or under src/
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  testPathIgnorePatterns: ['/dist/', '/node_modules/'],
  setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock drizzle-orm modules to avoid ESM issues
    '^drizzle-orm/pg-core$': '<rootDir>/src/__mocks__/drizzle-orm-pg-core.js',
    '^drizzle-orm/node-postgres$': '<rootDir>/src/__mocks__/drizzle-orm-node-postgres.js',
    '^drizzle-orm$': '<rootDir>/src/__mocks__/drizzle-orm.js',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.module.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
    '!src/main.ts',
    '!src/**/index.ts',
    '!src/db/schema/**',
  ],
  coverageDirectory: '<rootDir>/coverage/unit',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40,
    },
  },
  verbose: true,
  testTimeout: 30000,
};