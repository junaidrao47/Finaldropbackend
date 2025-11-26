import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { RolesModule } from './roles/roles.module';
import { RbacModule } from './rbac/rbac.module';
import { QueueModule } from './queue/queue.module';
import { ReceivesModule } from './receives/receives.module';
import { DevicesModule } from './devices/devices.module';
import { EventsModule } from './events/events.module';
import { LoggerModule } from './common/logger/logger.module';
import { DrizzleModule } from './drizzle/drizzle.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    // Rate limiting - 100 requests per minute per IP
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    // Drizzle ORM - Global module for database access
    DrizzleModule,
    LoggerModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    RolesModule,
    RbacModule,
    QueueModule,
    ReceivesModule,
    DevicesModule,
    EventsModule,
    DashboardModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}