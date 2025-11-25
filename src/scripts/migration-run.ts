// Lightweight migration runner placeholder.
// The repository currently mixes TypeORM and Drizzle; implementing full Drizzle migrations
// requires choosing a single ORM and migration tooling. For now this script is a noop
// that exits cleanly so docker builds and CI don't fail. Replace with real migration
// logic once ORM choice is finalized.

async function runMigrations() {
  console.log('Migration runner stub: no migrations executed.');
}

runMigrations().catch(err => {
  console.error('Migration runner failed:', err);
  process.exit(1);
});