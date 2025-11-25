import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class SeedService {
  constructor(private dataSource: DataSource) {}

  async seed() {
    const userRepository = this.dataSource.getRepository(User);
    const organizationRepository = this.dataSource.getRepository(Organization);
    const roleRepository = this.dataSource.getRepository(Role);

    const adminRole = await roleRepository.save({ name: 'admin', permissions: { '*': ['create', 'read', 'update', 'delete'] } } as any);
    const managerRole = await roleRepository.save({ name: 'manager', permissions: { organizations: ['read', 'update'], users: ['read'] } } as any);
    const agentRole = await roleRepository.save({ name: 'agent', permissions: { organizations: ['read'], users: ['read'] } } as any);

    const organization = await organizationRepository.save({ name: 'Example Org', description: 'Seeded organization' } as any);

    // Create a matching user object for the existing User entity (email, firstName/lastName)
    const user = await userRepository.save({
      email: 'admin@example.com',
      password: 'password', // In a real application, use hashed passwords
      firstName: 'Admin',
      lastName: 'User',
      role: adminRole,
      organization,
    } as any);

    console.log('Seed data created:', { user, organization, roles: [adminRole, managerRole, agentRole] });
  }
}

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || 'password',
    database: process.env.DB_NAME || 'mydatabase',
    entities: [User, Organization, Role],
    synchronize: true,
  });

  await dataSource.initialize();
  const seedService = new SeedService(dataSource);
  await seedService.seed();
  await dataSource.destroy();
}

runSeed().catch((error) => {
  console.error('Error seeding data:', error);
  process.exit(1);
});