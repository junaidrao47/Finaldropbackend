import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db, pool } from '../drizzle-client';
import { users, UserSelect, UserInsert } from '../../db/schema/users';
import { memberships } from '../../db/schema/memberships';
import { organizations } from '../../db/schema/organizations';
import { roles } from '../../db/schema/roles';

export interface UserWithRelations {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId: number | null;
  roleId: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  organization?: { id: number; name: string } | null;
  role?: { id: number; name: string; permissions: Record<string, string[]> | null } | null;
}

@Injectable()
export class DrizzleUsersRepository {
  private readonly logger = new Logger(DrizzleUsersRepository.name);

  async create(data: Partial<UserInsert>): Promise<UserWithRelations> {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    const [user] = await db.insert(users).values({
      email: data.email!,
      password: data.password!,
      firstName: data.firstName!,
      lastName: data.lastName!,
      organizationId: data.organizationId || null,
      roleId: data.roleId || null,
      isActive: data.isActive ?? true,
    }).returning();
    
    return this.mapToUserWithRelations(user);
  }

  async findAll(): Promise<UserWithRelations[]> {
    if (!db) return [];
    
    const result = await db
      .select()
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .leftJoin(roles, eq(users.roleId, roles.id));
    
    return result.map((row: any) => this.mapJoinedRow(row));
  }

  async findById(id: number): Promise<UserWithRelations | null> {
    if (!db) return null;
    
    const result = await db
      .select()
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, id))
      .limit(1);
    
    return result.length > 0 ? this.mapJoinedRow(result[0]) : null;
  }

  async findByEmail(email: string): Promise<UserWithRelations | null> {
    if (!db) return null;
    
    const result = await db
      .select()
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.email, email))
      .limit(1);
    
    return result.length > 0 ? this.mapJoinedRow(result[0]) : null;
  }

  async update(id: number, data: Partial<UserInsert>): Promise<UserWithRelations | null> {
    if (!db) return null;
    
    await db.update(users).set(data).where(eq(users.id, id));
    return this.findById(id);
  }

  async updateOrganization(userId: number, organizationId: number): Promise<UserWithRelations | null> {
    if (!db) return null;
    
    await db.update(users).set({ organizationId }).where(eq(users.id, userId));
    return this.findById(userId);
  }

  async delete(id: number): Promise<void> {
    if (!db) return;
    await db.delete(users).where(eq(users.id, id));
  }

  async findUserOrganizations(userId: number): Promise<Array<{ id: number; name: string }>> {
    if (!db) return [];
    
    const result = await db
      .select({
        id: organizations.id,
        name: organizations.name,
      })
      .from(memberships)
      .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
      .where(eq(memberships.userId, userId));
    
    return result;
  }

  async checkMembership(userId: number, organizationId: number): Promise<boolean> {
    if (!db) return false;
    
    const result = await db
      .select({ id: memberships.id })
      .from(memberships)
      .where(eq(memberships.userId, userId))
      .where(eq(memberships.organizationId, organizationId))
      .limit(1);
    
    return result.length > 0;
  }

  private mapToUserWithRelations(user: UserSelect): UserWithRelations {
    return {
      ...user,
      organization: null,
      role: null,
    };
  }

  private mapJoinedRow(row: any): UserWithRelations {
    return {
      id: row.users.id,
      email: row.users.email,
      password: row.users.password,
      firstName: row.users.firstName,
      lastName: row.users.lastName,
      organizationId: row.users.organizationId,
      roleId: row.users.roleId,
      isActive: row.users.isActive,
      createdAt: row.users.createdAt,
      updatedAt: row.users.updatedAt,
      organization: row.organizations ? {
        id: row.organizations.id,
        name: row.organizations.name,
      } : null,
      role: row.roles ? {
        id: row.roles.id,
        name: row.roles.name,
        permissions: row.roles.permissions,
      } : null,
    };
  }
}
