import * as bcrypt from 'bcrypt';
import { db, pool } from '../drizzle/drizzle-client';
import { users } from '../db/schema/users';
import { organizations } from '../db/schema/organizations';
import { roles } from '../db/schema/roles';
import { memberships } from '../db/schema/memberships';

const SALT_ROUNDS = 10;

async function seed() {
  if (!db) {
    throw new Error('Database not initialized. Make sure DATABASE_URL is set.');
  }

  console.log('🌱 Starting database seed...');

  // Create roles
  const [adminRole] = await db.insert(roles).values({
    name: 'admin',
    description: 'Full system administrator',
    isActive: true,
    permissions: { '*': ['create', 'read', 'update', 'delete'] },
  }).returning();
  console.log('✅ Created admin role:', adminRole.name);

  const [managerRole] = await db.insert(roles).values({
    name: 'manager',
    description: 'Organization manager',
    isActive: true,
    permissions: { organizations: ['read', 'update'], users: ['read', 'create'] },
  }).returning();
  console.log('✅ Created manager role:', managerRole.name);

  const [agentRole] = await db.insert(roles).values({
    name: 'agent',
    description: 'Standard agent',
    isActive: true,
    permissions: { organizations: ['read'], users: ['read'] },
  }).returning();
  console.log('✅ Created agent role:', agentRole.name);

  // Create organization
  const [organization] = await db.insert(organizations).values({
    name: 'Example Organization',
  }).returning();
  console.log('✅ Created organization:', organization.name);

  // Create admin user with hashed password
  const hashedPassword = await bcrypt.hash('password123', SALT_ROUNDS);
  const [adminUser] = await db.insert(users).values({
    email: 'admin@example.com',
    password: hashedPassword,
    firstName: 'Admin',
    lastName: 'User',
    organizationId: organization.id,
    roleId: adminRole.id,
    isActive: true,
  }).returning();
  console.log('✅ Created admin user:', adminUser.email);

  // Create membership for admin user
  await db.insert(memberships).values({
    userId: adminUser.id,
    organizationId: organization.id,
    roleId: adminRole.id,
  });
  console.log('✅ Created membership for admin user');

  console.log('\\n🎉 Seed completed successfully!');
  console.log('\\nSeeded data:');
  console.log('  - Roles: admin, manager, agent');
  console.log('  - Organization:', organization.name);
  console.log('  - Admin user:', adminUser.email, '(password: password123)');
}

async function runSeed() {
  try {
    await seed();
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

runSeed();