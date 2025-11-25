// Simple config object used by scripts and drizzle client.
export const config = {
	DATABASE_URL: process.env.DATABASE_URL || `postgres://user:password@localhost:5432/mydatabase`,
	DB_HOST: process.env.DB_HOST || 'localhost',
	DB_PORT: process.env.DB_PORT || '5432',
	DB_USER: process.env.DB_USER || 'user',
	DB_PASSWORD: process.env.DB_PASSWORD || 'password',
	DB_NAME: process.env.DB_NAME || 'mydatabase',
};

export default config;
export const DatabaseConfig = config;