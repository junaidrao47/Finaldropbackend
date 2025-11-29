import { Module } from '@nestjs/common';
import { PolicyService } from './policy.service';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [PermissionsController],
  providers: [PolicyService, PermissionsService],
  exports: [PolicyService, PermissionsService],
})
export class RbacModule {}