import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq, and, or, ilike, desc, asc, sql, count } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import {
  CreateContactDto,
  UpdateContactDto,
  ContactFilterDto,
  ContactResponseDto,
  ContactType,
  PaginatedResponseDto,
} from './dto/settings-extended.dto';

@Injectable()
export class ContactsSettingsService {
  private readonly logger = new Logger(ContactsSettingsService.name);

  constructor(
    @Inject('DRIZZLE_DB')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Get all contacts for organization with filters
   */
  async getContacts(
    organizationId: string,
    filters: ContactFilterDto,
  ): Promise<PaginatedResponseDto<ContactResponseDto>> {
    const { type, isActive, search, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    try {
      // Build where conditions
      const conditions = [
        eq(schema.contacts.organizationId, organizationId),
        eq(schema.contacts.isDeleted, false),
      ];

      if (type) {
        conditions.push(eq(schema.contacts.type, type));
      }

      if (isActive !== undefined) {
        conditions.push(eq(schema.contacts.isActive, isActive));
      }

      if (search) {
        const searchCondition = or(
          ilike(schema.contacts.name, `%${search}%`),
          ilike(schema.contacts.email ?? '', `%${search}%`),
          ilike(schema.contacts.contactNumber ?? '', `%${search}%`),
          ilike(schema.contacts.company ?? '', `%${search}%`),
        );
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }

      // Get total count
      const [countResult] = await this.db
        .select({ count: count() })
        .from(schema.contacts)
        .where(and(...conditions));

      const total = Number(countResult?.count || 0);

      // Get paginated data
      const data = await this.db
        .select()
        .from(schema.contacts)
        .where(and(...conditions))
        .orderBy(asc(schema.contacts.name))
        .limit(limit)
        .offset(offset);

      return {
        data: data.map(this.mapToResponse),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching contacts: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get single contact by ID
   */
  async getContact(id: string, organizationId: string): Promise<ContactResponseDto> {
    const [contact] = await this.db
      .select()
      .from(schema.contacts)
      .where(
        and(
          eq(schema.contacts.id, id),
          eq(schema.contacts.organizationId, organizationId),
          eq(schema.contacts.isDeleted, false),
        ),
      );

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    return this.mapToResponse(contact);
  }

  /**
   * Create new contact
   */
  async createContact(
    organizationId: string,
    dto: CreateContactDto,
    userId: string,
  ): Promise<ContactResponseDto> {
    try {
      const [created] = await this.db
        .insert(schema.contacts)
        .values({
          organizationId,
          name: dto.name,
          type: dto.type,
          contactNumber: dto.contactNumber,
          email: dto.email,
          alternatePhone: dto.alternatePhone,
          company: dto.company,
          notes: dto.notes,
          isActive: dto.isActive ?? true,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();

      this.logger.log(`Created contact ${created.id} for organization ${organizationId}`);
      return this.mapToResponse(created);
    } catch (error) {
      this.logger.error(`Error creating contact: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Update contact
   */
  async updateContact(
    id: string,
    organizationId: string,
    dto: UpdateContactDto,
    userId: string,
  ): Promise<ContactResponseDto> {
    // Verify contact exists
    await this.getContact(id, organizationId);

    const [updated] = await this.db
      .update(schema.contacts)
      .set({
        ...dto,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.contacts.id, id),
          eq(schema.contacts.organizationId, organizationId),
        ),
      )
      .returning();

    this.logger.log(`Updated contact ${id}`);
    return this.mapToResponse(updated);
  }

  /**
   * Delete contact (soft delete)
   */
  async deleteContact(id: string, organizationId: string, userId: string): Promise<void> {
    // Verify contact exists
    await this.getContact(id, organizationId);

    await this.db
      .update(schema.contacts)
      .set({
        isDeleted: true,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.contacts.id, id),
          eq(schema.contacts.organizationId, organizationId),
        ),
      );

    this.logger.log(`Deleted contact ${id}`);
  }

  /**
   * Toggle contact active status
   */
  async toggleContactStatus(
    id: string,
    organizationId: string,
    userId: string,
  ): Promise<ContactResponseDto> {
    const contact = await this.getContact(id, organizationId);

    const [updated] = await this.db
      .update(schema.contacts)
      .set({
        isActive: !contact.isActive,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.contacts.id, id),
          eq(schema.contacts.organizationId, organizationId),
        ),
      )
      .returning();

    return this.mapToResponse(updated);
  }

  /**
   * Bulk import contacts
   */
  async bulkImport(
    organizationId: string,
    contacts: CreateContactDto[],
    userId: string,
  ): Promise<{ imported: number; failed: number; errors: string[] }> {
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const contact of contacts) {
      try {
        await this.createContact(organizationId, contact, userId);
        imported++;
      } catch (error) {
        failed++;
        errors.push(`Failed to import ${contact.name}: ${(error as Error).message}`);
      }
    }

    return { imported, failed, errors };
  }

  /**
   * Export contacts
   */
  async exportContacts(organizationId: string, type?: ContactType): Promise<ContactResponseDto[]> {
    const conditions = [
      eq(schema.contacts.organizationId, organizationId),
      eq(schema.contacts.isDeleted, false),
    ];

    if (type) {
      conditions.push(eq(schema.contacts.type, type));
    }

    const data = await this.db
      .select()
      .from(schema.contacts)
      .where(and(...conditions))
      .orderBy(asc(schema.contacts.name));

    return data.map(this.mapToResponse);
  }

  /**
   * Map database record to response DTO
   */
  private mapToResponse(record: schema.ContactSelect): ContactResponseDto {
    return {
      id: record.id,
      name: record.name,
      type: record.type as ContactType,
      contactNumber: record.contactNumber ?? undefined,
      email: record.email ?? undefined,
      alternatePhone: record.alternatePhone ?? undefined,
      company: record.company ?? undefined,
      notes: record.notes ?? undefined,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
