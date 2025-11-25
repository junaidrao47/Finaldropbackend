# This file contains documentation for database migrations in the project.
# It should include information on how to create, run, and manage migrations using Drizzle ORM.

## Database Migrations

This directory contains the migration files for the database schema. Migrations are used to manage changes to the database schema over time in a structured and versioned manner.

### Creating Migrations

To create a new migration, use the Drizzle ORM CLI command:

```
drizzle migration:create <migration-name>
```

Replace `<migration-name>` with a descriptive name for your migration.

### Running Migrations

To apply the migrations to the database, run the following command:

```
drizzle migration:run
```

This will execute all pending migrations in the order they were created.

### Rolling Back Migrations

If you need to revert the last migration, you can use the following command:

```
drizzle migration:rollback
```

### Best Practices

- Always create a migration for any changes made to the database schema.
- Test migrations in a development environment before applying them to production.
- Keep migration files organized and well-documented for future reference.

### Additional Resources

For more information on using Drizzle ORM and managing migrations, refer to the official documentation at [Drizzle ORM Documentation](https://orm.drizzle.team/docs).