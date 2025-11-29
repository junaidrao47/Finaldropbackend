// Mock for drizzle-orm main module
module.exports = {
  eq: jest.fn((a, b) => ({ type: 'eq', a, b })),
  and: jest.fn((...args) => ({ type: 'and', args })),
  or: jest.fn((...args) => ({ type: 'or', args })),
  desc: jest.fn((col) => ({ type: 'desc', col })),
  asc: jest.fn((col) => ({ type: 'asc', col })),
  sql: jest.fn((strings, ...values) => ({ type: 'sql', strings, values })),
  count: jest.fn(() => ({ type: 'count' })),
  ilike: jest.fn((col, pattern) => ({ type: 'ilike', col, pattern })),
  gte: jest.fn((a, b) => ({ type: 'gte', a, b })),
  lte: jest.fn((a, b) => ({ type: 'lte', a, b })),
  isNull: jest.fn((col) => ({ type: 'isNull', col })),
};
