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
import { TransactionsModule } from './transactions/transactions.module';
import { ContactsModule } from './contacts/contacts.module';
import { SettingsModule } from './settings/settings.module';
import { CarriersModule } from './carriers/carriers.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { PackagesModule } from './packages/packages.module';
import { OcrModule } from './ocr/ocr.module';
import { PodModule } from './pod/pod.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

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
    // Cloudinary - Global module for file uploads
    CloudinaryModule,
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
    TransactionsModule,
    ContactsModule,
    SettingsModule,
    CarriersModule,
    WarehousesModule,
    PackagesModule,
    OcrModule,
    PodModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}