import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { RolesModule } from './roles/roles.module';
import { RbacModule } from './rbac/rbac.module';
import { DatabaseConfig } from './config/database.config';

@Module({
  imports: [
    // ConfigModule removed in favor of direct env reads to reduce external dependency
    // Use an empty TypeORM config here so the app can build; replace with real DB
    // options (DatabaseConfig) in production.
    TypeOrmModule.forRoot({} as any),
    AuthModule,
    UsersModule,
    OrganizationsModule,
    RolesModule,
    RbacModule,
  ],
})
export class AppModule {}