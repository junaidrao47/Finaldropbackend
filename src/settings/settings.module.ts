import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

// Controllers
import { SettingsController } from './settings.controller';
import { SettingsExtendedController } from './settings-extended.controller';

// Services
import { SettingsService } from './settings.service';
import { ContactsSettingsService } from './contacts-settings.service';
import { BlacklistSettingsService } from './blacklist-settings.service';
import { WarningMessagesService } from './warning-messages.service';
import { LinkedDevicesService } from './linked-devices.service';
import { SupportService } from './support.service';
import { ReportsService } from './reports.service';

// Modules
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  imports: [
    DrizzleModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 5,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
  controllers: [SettingsController, SettingsExtendedController],
  providers: [
    SettingsService,
    ContactsSettingsService,
    BlacklistSettingsService,
    WarningMessagesService,
    LinkedDevicesService,
    SupportService,
    ReportsService,
  ],
  exports: [
    SettingsService,
    ContactsSettingsService,
    BlacklistSettingsService,
    WarningMessagesService,
    LinkedDevicesService,
    SupportService,
    ReportsService,
  ],
})
export class SettingsModule {}

