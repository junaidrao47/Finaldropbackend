import { Injectable, Logger } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db } from '../drizzle-client';
import { receives, ReceiveSelect, ReceiveInsert } from '../../db/schema/receives';

export interface ReceiveWithRelations {
  id: number;
  organizationId: number | null;
  userId: number | null;
  metadata: unknown;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class DrizzleReceivesRepository {
  private readonly logger = new Logger(DrizzleReceivesRepository.name);

  async create(data: Partial<ReceiveInsert>): Promise<ReceiveWithRelations> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const [receive] = await db.insert(receives).values({
      organizationId: data.organizationId || null,
      userId: data.userId || null,
      metadata: data.metadata || null,
      status: data.status || 'pending',
    }).returning();

    return this.mapToReceive(receive);
  }

  async findAll(): Promise<ReceiveWithRelations[]> {
    if (!db) return [];

    const result = await db.select().from(receives);
    return result.map((r: ReceiveSelect) => this.mapToReceive(r));
  }

  async findById(id: number): Promise<ReceiveWithRelations | null> {
    if (!db) return null;

    const result = await db
      .select()
      .from(receives)
      .where(eq(receives.id, id))
      .limit(1);

    return result.length > 0 ? this.mapToReceive(result[0]) : null;
  }

  async findByUserId(userId: number): Promise<ReceiveWithRelations[]> {
    if (!db) return [];

    const result = await db
      .select()
      .from(receives)
      .where(eq(receives.userId, userId));

    return result.map((r: ReceiveSelect) => this.mapToReceive(r));
  }

  async findByOrganizationId(organizationId: number): Promise<ReceiveWithRelations[]> {
    if (!db) return [];

    const result = await db
      .select()
      .from(receives)
      .where(eq(receives.organizationId, organizationId));

    return result.map((r: ReceiveSelect) => this.mapToReceive(r));
  }

  async updateStatus(id: number, status: string): Promise<ReceiveWithRelations | null> {
    if (!db) return null;

    await db.update(receives).set({ status }).where(eq(receives.id, id));
    return this.findById(id);
  }

  async update(id: number, data: Partial<ReceiveInsert>): Promise<ReceiveWithRelations | null> {
    if (!db) return null;

    await db.update(receives).set(data).where(eq(receives.id, id));
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    if (!db) return;
    await db.delete(receives).where(eq(receives.id, id));
  }

  private mapToReceive(receive: ReceiveSelect): ReceiveWithRelations {
    return {
      id: receive.id,
      organizationId: receive.organizationId,
      userId: receive.userId,
      metadata: receive.metadata,
      status: receive.status,
      createdAt: receive.createdAt,
      updatedAt: receive.updatedAt,
    };
  }
}
