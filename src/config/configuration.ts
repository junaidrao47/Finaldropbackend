// Lightweight configuration object (avoids dependency on @nestjs/config during build).
const configuration = {
  app: {
    port: parseInt(process.env.APP_PORT || '3000', 10) || 3000,
    environment: process.env.NODE_ENV || 'development',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10) || 5432,
    username: process.env.DB_USERNAME || 'user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'dbname',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'defaultSecret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  organizations: {
    defaultRole: process.env.DEFAULT_ORG_ROLE || 'member',
  },
};

export default configuration;
export { configuration };