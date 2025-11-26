import { Injectable, Logger } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db } from '../drizzle-client';
import { memberships, MembershipSelect, MembershipInsert } from '../../db/schema/memberships';
import { organizations } from '../../db/schema/organizations';
import { roles } from '../../db/schema/roles';

export interface MembershipWithRelations {
  id: number;
  userId: number;
  organizationId: number;
  roleId: number;
  createdAt: Date;
  updatedAt: Date;
  organization?: { id: number; name: string } | null;
  role?: { id: number; name: string } | null;
}

@Injectable()
export class DrizzleMembershipsRepository {
  private readonly logger = new Logger(DrizzleMembershipsRepository.name);

  async create(data: MembershipInsert): Promise<MembershipWithRelations> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const [membership] = await db.insert(memberships).values({
      userId: data.userId,
      organizationId: data.organizationId,
      roleId: data.roleId,
    }).returning();

    return this.mapToMembership(membership);
  }

  async findAll(): Promise<MembershipWithRelations[]> {
    if (!db) return [];

    const result = await db
      .select()
      .from(memberships)
      .leftJoin(organizations, eq(memberships.organizationId, organizations.id))
      .leftJoin(roles, eq(memberships.roleId, roles.id));

    return result.map((row: any) => this.mapJoinedRow(row));
  }

  async findById(id: number): Promise<MembershipWithRelations | null> {
    if (!db) return null;

    const result = await db
      .select()
      .from(memberships)
      .leftJoin(organizations, eq(memberships.organizationId, organizations.id))
      .leftJoin(roles, eq(memberships.roleId, roles.id))
      .where(eq(memberships.id, id))
      .limit(1);

    return result.length > 0 ? this.mapJoinedRow(result[0]) : null;
  }

  async findByUserAndOrganization(userId: number, organizationId: number): Promise<MembershipWithRelations | null> {
    if (!db) return null;

    const result = await db
      .select()
      .from(memberships)
      .leftJoin(organizations, eq(memberships.organizationId, organizations.id))
      .leftJoin(roles, eq(memberships.roleId, roles.id))
      .where(and(
        eq(memberships.userId, userId),
        eq(memberships.organizationId, organizationId)
      ))
      .limit(1);

    return result.length > 0 ? this.mapJoinedRow(result[0]) : null;
  }

  async findByUserId(userId: number): Promise<MembershipWithRelations[]> {
    if (!db) return [];

    const result = await db
      .select()
      .from(memberships)
      .leftJoin(organizations, eq(memberships.organizationId, organizations.id))
      .leftJoin(roles, eq(memberships.roleId, roles.id))
      .where(eq(memberships.userId, userId));

    return result.map((row: any) => this.mapJoinedRow(row));
  }

  async findByOrganizationId(organizationId: number): Promise<MembershipWithRelations[]> {
    if (!db) return [];

    const result = await db
      .select()
      .from(memberships)
      .leftJoin(organizations, eq(memberships.organizationId, organizations.id))
      .leftJoin(roles, eq(memberships.roleId, roles.id))
      .where(eq(memberships.organizationId, organizationId));

    return result.map((row: any) => this.mapJoinedRow(row));
  }

  async checkMembership(userId: number, organizationId: number): Promise<boolean> {
    if (!db) return false;

    const result = await db
      .select({ id: memberships.id })
      .from(memberships)
      .where(and(
        eq(memberships.userId, userId),
        eq(memberships.organizationId, organizationId)
      ))
      .limit(1);

    return result.length > 0;
  }

  async update(id: number, data: Partial<MembershipInsert>): Promise<MembershipWithRelations | null> {
    if (!db) return null;

    await db.update(memberships).set(data).where(eq(memberships.id, id));
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    if (!db) return;
    await db.delete(memberships).where(eq(memberships.id, id));
  }

  async deleteByUserAndOrganization(userId: number, organizationId: number): Promise<void> {
    if (!db) return;
    await db.delete(memberships).where(and(
      eq(memberships.userId, userId),
      eq(memberships.organizationId, organizationId)
    ));
  }

  private mapToMembership(membership: MembershipSelect): MembershipWithRelations {
    return {
      id: membership.id,
      userId: membership.userId,
      organizationId: membership.organizationId,
      roleId: membership.roleId,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
      organization: null,
      role: null,
    };
  }

  private mapJoinedRow(row: any): MembershipWithRelations {
    return {
      id: row.memberships.id,
      userId: row.memberships.userId,
      organizationId: row.memberships.organizationId,
      roleId: row.memberships.roleId,
      createdAt: row.memberships.createdAt,
      updatedAt: row.memberships.updatedAt,
      organization: row.organizations ? {
        id: row.organizations.id,
        name: row.organizations.name,
      } : null,
      role: row.roles ? {
        id: row.roles.id,
        name: row.roles.name,
      } : null,
    };
  }
}
