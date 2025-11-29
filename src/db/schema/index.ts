// Drizzle schema exports - central barrel file
// FinalDrop Database Schema with UUID7

// Common utilities
export * from './common';

// Lookup tables
export * from './status';

// Core entities (using new UUID-based schemas)
export * from './organizations.new';
export * from './users.new';
export * from './carriers';

// Organization related
export * from './organizations-related';

// User related
export * from './users-related';

// Warehouse and layout
export * from './warehouses';

// Roles and permissions
export * from './roles-permissions';

// Package related
export * from './packages';

// Carrier related
export * from './carriers-related';

// Utility and logging
export * from './utility';

// Chat and support
export * from './chat';

// Settings extended (contacts, blacklist, warning messages, etc.)
export * from './settings-extended';

// Legacy schemas (kept for backward compatibility during migration)
// TODO: Remove these once all services are migrated to new schemas
// export * from './roles';
// export * from './organizations';
// export * from './users';
// export * from './memberships';
// export * from './receives';
// export * from './uploads_queue';
// export * from './trusted_devices';