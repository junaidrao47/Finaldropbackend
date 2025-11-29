// Global Jest setup for unit/integration tests
// Load reflect-metadata for NestJS decorators
try {
  require('reflect-metadata');
} catch (err) {
  // ignore if reflect-metadata is unavailable in certain test contexts
}

// Extend default timeout to accommodate database-heavy specs
jest.setTimeout(30000);

// Lightweight console spies to surface warnings during tests
const originalConsole = { ...console };
beforeEach(() => {
  jest.spyOn(originalConsole, 'error');
  jest.spyOn(originalConsole, 'warn');
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Helper for constructing chainable Drizzle-like mocks
global.createMockDb = function() {
  const chain = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn(),
    limit: jest.fn(),
    offset: jest.fn(),
    orderBy: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  };

  chain.where.mockResolvedValue([]);
  chain.limit.mockResolvedValue([]);
  chain.offset.mockResolvedValue([]);
  chain.returning.mockResolvedValue([]);
  return chain;
};
