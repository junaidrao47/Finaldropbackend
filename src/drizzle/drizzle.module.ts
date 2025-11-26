import { Module, Global } from '@nestjs/common';
import { DrizzleUsersRepository } from './repositories/users.repository';
import { DrizzleOrganizationsRepository } from './repositories/organizations.repository';
import { DrizzleRolesRepository } from './repositories/roles.repository';
import { DrizzleReceivesRepository } from './repositories/receives.repository';
import { DrizzleMembershipsRepository } from './repositories/memberships.repository';

@Global()
@Module({
  providers: [
    DrizzleUsersRepository,
    DrizzleOrganizationsRepository,
    DrizzleRolesRepository,
    DrizzleReceivesRepository,
    DrizzleMembershipsRepository,
  ],
  exports: [
    DrizzleUsersRepository,
    DrizzleOrganizationsRepository,
    DrizzleRolesRepository,
    DrizzleReceivesRepository,
    DrizzleMembershipsRepository,
  ],
})
export class DrizzleModule {}
