// Ambient declarations to silence implicit-any module errors until proper @types are installed
declare module 'passport-jwt';
declare module 'passport-local';
declare module 'drizzle-orm';
declare module 'drizzle-orm/postgres-js';
declare module 'pg';
declare module 'postgres';
declare module 'joi';
declare module '@nestjs/config' {
  export function registerAs(name: string, fn: () => any): any;
  export const ConfigModule: any;
  export const ConfigService: any;
  const _default: any;
  export default _default;
}

// If any library still triggers implicit-any for deep members, add minimal typings here.
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: 'development' | 'production' | 'test';
    DATABASE_URL?: string;
    JWT_SECRET?: string;
    APP_PORT?: string;
    DB_PORT?: string;
  }
}

export {};
