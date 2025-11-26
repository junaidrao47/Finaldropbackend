import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../drizzle-client';
import { roles, RoleSelect, RoleInsert } from '../../db/schema/roles';

export interface RoleWithRelations {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  permissions: Record<string, string[]> | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class DrizzleRolesRepository {
  private readonly logger = new Logger(DrizzleRolesRepository.name);

  async create(data: Partial<RoleInsert>): Promise<RoleWithRelations> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const [role] = await db.insert(roles).values({
      name: data.name!,
      description: data.description || null,
      isActive: data.isActive ?? true,
      permissions: data.permissions || null,
    }).returning();

    return this.mapToRole(role);
  }

  async findAll(): Promise<RoleWithRelations[]> {
    if (!db) return [];

    const result = await db.select().from(roles);
    return result.map((role: RoleSelect) => this.mapToRole(role));
  }

  async findById(id: number): Promise<RoleWithRelations | null> {
    if (!db) return null;

    const result = await db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    return result.length > 0 ? this.mapToRole(result[0]) : null;
  }

  async findByName(name: string): Promise<RoleWithRelations | null> {
    if (!db) return null;

    const result = await db
      .select()
      .from(roles)
      .where(eq(roles.name, name))
      .limit(1);

    return result.length > 0 ? this.mapToRole(result[0]) : null;
  }

  async update(id: number, data: Partial<RoleInsert>): Promise<RoleWithRelations | null> {
    if (!db) return null;

    await db.update(roles).set(data).where(eq(roles.id, id));
    return this.findById(id);
  }

  async updatePermissions(id: number, permissions: Record<string, string[]>): Promise<RoleWithRelations | null> {
    if (!db) return null;

    await db.update(roles).set({ permissions }).where(eq(roles.id, id));
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    if (!db) return;
    await db.delete(roles).where(eq(roles.id, id));
  }

  private mapToRole(role: RoleSelect): RoleWithRelations {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      permissions: role.permissions,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
