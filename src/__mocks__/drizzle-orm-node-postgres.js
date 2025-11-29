// Mock for drizzle-orm/node-postgres
module.exports = {
  drizzle: jest.fn(() => global.createMockDb()),
  NodePgDatabase: jest.fn(),
};
