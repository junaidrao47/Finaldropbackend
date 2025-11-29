// Mock for drizzle-orm/pg-core
const createChainable = (base = {}) => {
  const obj = {
    ...base,
    notNull: jest.fn().mockReturnThis(),
    unique: jest.fn().mockReturnThis(),
    default: jest.fn().mockReturnThis(),
    defaultNow: jest.fn().mockReturnThis(),
    defaultRandom: jest.fn().mockReturnThis(),
    primaryKey: jest.fn().mockReturnThis(),
    references: jest.fn().mockReturnThis(),
    $type: jest.fn().mockReturnThis(),
  };
  // Make all methods return the same chainable object
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'function' && key !== '$type') {
      obj[key] = jest.fn(() => obj);
    }
  });
  obj.$type = jest.fn(() => obj);
  return obj;
};

module.exports = {
  pgTable: jest.fn((name, columns) => ({ name, columns, $inferSelect: {}, $inferInsert: {} })),
  serial: jest.fn((name) => createChainable({ name, type: 'serial' })),
  varchar: jest.fn((name, opts) => createChainable({ name, opts, type: 'varchar' })),
  text: jest.fn((name) => createChainable({ name, type: 'text' })),
  integer: jest.fn((name) => createChainable({ name, type: 'integer' })),
  boolean: jest.fn((name) => createChainable({ name, type: 'boolean' })),
  timestamp: jest.fn((name) => createChainable({ name, type: 'timestamp' })),
  jsonb: jest.fn((name) => createChainable({ name, type: 'jsonb' })),
  uuid: jest.fn((name) => createChainable({ name, type: 'uuid' })),
  date: jest.fn((name) => createChainable({ name, type: 'date' })),
  numeric: jest.fn((name, opts) => createChainable({ name, opts, type: 'numeric' })),
  decimal: jest.fn((name, opts) => createChainable({ name, opts, type: 'decimal' })),
  real: jest.fn((name) => createChainable({ name, type: 'real' })),
  doublePrecision: jest.fn((name) => createChainable({ name, type: 'doublePrecision' })),
  json: jest.fn((name) => createChainable({ name, type: 'json' })),
  time: jest.fn((name) => createChainable({ name, type: 'time' })),
  interval: jest.fn((name) => createChainable({ name, type: 'interval' })),
  bigint: jest.fn((name, opts) => createChainable({ name, opts, type: 'bigint' })),
  smallint: jest.fn((name) => createChainable({ name, type: 'smallint' })),
  pgEnum: jest.fn((name, values) => jest.fn(() => createChainable({ name, values, type: 'enum' }))),
};
