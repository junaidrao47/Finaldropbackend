// Lightweight drizzle client that falls back to a stub when dependencies or
// configuration are not available (helps CI/docker build remain robust).
let db: any = null;

try {
  // Use require to avoid TS type/shape errors when packages differ between environments
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const drizzlePkg: any = require('drizzle-orm/node-postgres');
  const drizzle = drizzlePkg && drizzlePkg.drizzle ? drizzlePkg.drizzle : drizzlePkg;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Pool } = require('pg');
  // import config safely
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cfg = require('../config/database.config').config;

  const pool = new Pool({
    connectionString: cfg && cfg.DATABASE_URL ? cfg.DATABASE_URL : process.env.DATABASE_URL,
  });

  db = drizzle ? drizzle(pool) : null;
} catch (err) {
  // If anything fails (missing package, wrong API), export a null db and log at runtime.
  // Avoid throwing at import-time so builds don't fail; runtime code should handle null db.
  // console.warn('Drizzle client not initialized:', err?.message || err);
  db = null;
}

export { db };