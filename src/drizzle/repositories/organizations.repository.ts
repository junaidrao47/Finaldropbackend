import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../drizzle-client';
import { organizations, OrganizationSelect, OrganizationInsert } from '../../db/schema/organizations';

export interface OrganizationWithRelations {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class DrizzleOrganizationsRepository {
  private readonly logger = new Logger(DrizzleOrganizationsRepository.name);

  async create(data: Partial<OrganizationInsert>): Promise<OrganizationWithRelations> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const [organization] = await db.insert(organizations).values({
      name: data.name!,
    }).returning();

    return this.mapToOrganization(organization);
  }

  async findAll(): Promise<OrganizationWithRelations[]> {
    if (!db) return [];

    const result = await db.select().from(organizations);
    return result.map((org: OrganizationSelect) => this.mapToOrganization(org));
  }

  async findById(id: number): Promise<OrganizationWithRelations | null> {
    if (!db) return null;

    const result = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    return result.length > 0 ? this.mapToOrganization(result[0]) : null;
  }

  async findByName(name: string): Promise<OrganizationWithRelations | null> {
    if (!db) return null;

    const result = await db
      .select()
      .from(organizations)
      .where(eq(organizations.name, name))
      .limit(1);

    return result.length > 0 ? this.mapToOrganization(result[0]) : null;
  }

  async update(id: number, data: Partial<OrganizationInsert>): Promise<OrganizationWithRelations | null> {
    if (!db) return null;

    await db.update(organizations).set(data).where(eq(organizations.id, id));
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    if (!db) return;
    await db.delete(organizations).where(eq(organizations.id, id));
  }

  private mapToOrganization(org: OrganizationSelect): OrganizationWithRelations {
    return {
      id: org.id,
      name: org.name,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  }
}
