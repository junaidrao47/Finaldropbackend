import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq, and, desc, ilike, count, or } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import {
  CreateCarrierDto,
  UpdateCarrierDto,
  CarrierFilterDto,
} from './dto/carrier.dto';

@Injectable()
export class CarriersService {
  private readonly logger = new Logger(CarriersService.name);

  constructor(
    @Inject('DRIZZLE_DB')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Create a new carrier
   */
  async create(dto: CreateCarrierDto, createdBy: string): Promise<any> {
    this.logger.log(`Creating carrier: ${dto.businessName || `${dto.firstName} ${dto.lastName}`}`);

    const [carrier] = await this.db
      .insert(schema.carriers)
      .values({
        isBusiness: dto.isBusiness ?? false,
        firstName: dto.firstName || null,
        lastName: dto.lastName || null,
        businessName: dto.businessName || null,
        legalName: dto.legalName || null,
        dateOfBirthBusinessSince: dto.dateOfBirthBusinessSince || null,
        federalTaxId: dto.federalTaxId || null,
        stateTaxId: dto.stateTaxId || null,
        phoneNumber: dto.phoneNumber || null,
        mobileNumber: dto.mobileNumber || null,
        differentWhatsAppNumber: dto.differentWhatsAppNumber ?? false,
        whatsAppNumber: dto.whatsAppNumber || null,
        email: dto.email || null,
        differentBillingEmail: dto.differentBillingEmail ?? false,
        billingEmail: dto.billingEmail || null,
        additionalInformation: dto.additionalInformation || null,
        profileImage: dto.profileImage || null,
        statusId: dto.statusId || null,
        accountHolderId: dto.accountHolderId || null,
        isDeleted: false,
        createdBy,
        updatedBy: createdBy,
      })
      .returning();

    return carrier;
  }

  /**
   * Find carrier by ID
   */
  async findById(id: string): Promise<any> {
    const [carrier] = await this.db
      .select()
      .from(schema.carriers)
      .where(and(eq(schema.carriers.id, id), eq(schema.carriers.isDeleted, false)))
      .limit(1);

    if (!carrier) {
      throw new NotFoundException(`Carrier with ID ${id} not found`);
    }

    return carrier;
  }

  /**
   * Find carrier by email
   */
  async findByEmail(email: string): Promise<any | null> {
    const [carrier] = await this.db
      .select()
      .from(schema.carriers)
      .where(and(eq(schema.carriers.email, email), eq(schema.carriers.isDeleted, false)))
      .limit(1);

    return carrier || null;
  }

  /**
   * List carriers with filters
   */
  async findAll(filter: CarrierFilterDto): Promise<{ data: any[]; total: number }> {
    const conditions: any[] = [eq(schema.carriers.isDeleted, filter.isDeleted ?? false)];

    if (filter.isBusiness !== undefined) {
      conditions.push(eq(schema.carriers.isBusiness, filter.isBusiness));
    }
    if (filter.statusId) {
      conditions.push(eq(schema.carriers.statusId, filter.statusId));
    }
    if (filter.search) {
      conditions.push(
        or(
          ilike(schema.carriers.firstName, `%${filter.search}%`),
          ilike(schema.carriers.lastName, `%${filter.search}%`),
          ilike(schema.carriers.businessName, `%${filter.search}%`),
          ilike(schema.carriers.email, `%${filter.search}%`),
        ),
      );
    }

    const whereClause = and(...conditions);

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const offset = (page - 1) * limit;

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(schema.carriers)
      .where(whereClause);

    const data = await this.db
      .select()
      .from(schema.carriers)
      .where(whereClause)
      .orderBy(desc(schema.carriers.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      total: totalResult?.count || 0,
    };
  }

  /**
   * Update carrier
   */
  async update(id: string, dto: UpdateCarrierDto, updatedBy: string): Promise<any> {
    this.logger.log(`Updating carrier ${id}`);

    await this.findById(id); // Verify exists

    const updateData: Record<string, any> = {
      updatedBy,
    };

    // Copy over DTO fields
    if (dto.isBusiness !== undefined) updateData.isBusiness = dto.isBusiness;
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.businessName !== undefined) updateData.businessName = dto.businessName;
    if (dto.legalName !== undefined) updateData.legalName = dto.legalName;
    if (dto.dateOfBirthBusinessSince !== undefined) updateData.dateOfBirthBusinessSince = dto.dateOfBirthBusinessSince;
    if (dto.federalTaxId !== undefined) updateData.federalTaxId = dto.federalTaxId;
    if (dto.stateTaxId !== undefined) updateData.stateTaxId = dto.stateTaxId;
    if (dto.phoneNumber !== undefined) updateData.phoneNumber = dto.phoneNumber;
    if (dto.mobileNumber !== undefined) updateData.mobileNumber = dto.mobileNumber;
    if (dto.differentWhatsAppNumber !== undefined) updateData.differentWhatsAppNumber = dto.differentWhatsAppNumber;
    if (dto.whatsAppNumber !== undefined) updateData.whatsAppNumber = dto.whatsAppNumber;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.differentBillingEmail !== undefined) updateData.differentBillingEmail = dto.differentBillingEmail;
    if (dto.billingEmail !== undefined) updateData.billingEmail = dto.billingEmail;
    if (dto.additionalInformation !== undefined) updateData.additionalInformation = dto.additionalInformation;
    if (dto.profileImage !== undefined) updateData.profileImage = dto.profileImage;
    if (dto.statusId !== undefined) updateData.statusId = dto.statusId;
    if (dto.accountHolderId !== undefined) updateData.accountHolderId = dto.accountHolderId;
    if (dto.isDeleted !== undefined) updateData.isDeleted = dto.isDeleted;

    const [updated] = await this.db
      .update(schema.carriers)
      .set(updateData)
      .where(eq(schema.carriers.id, id))
      .returning();

    return updated;
  }

  /**
   * Soft delete carrier
   */
  async remove(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`Soft deleting carrier ${id}`);

    await this.findById(id);

    await this.db
      .update(schema.carriers)
      .set({
        isDeleted: true,
        updatedBy: deletedBy,
        updatedAt: new Date(),
      })
      .where(eq(schema.carriers.id, id));
  }

  /**
   * Restore soft-deleted carrier
   */
  async restore(id: string, restoredBy: string): Promise<any> {
    this.logger.log(`Restoring carrier ${id}`);

    const [carrier] = await this.db
      .select()
      .from(schema.carriers)
      .where(eq(schema.carriers.id, id))
      .limit(1);

    if (!carrier) {
      throw new NotFoundException(`Carrier with ID ${id} not found`);
    }

    const [restored] = await this.db
      .update(schema.carriers)
      .set({
        isDeleted: false,
        updatedBy: restoredBy,
        updatedAt: new Date(),
      })
      .where(eq(schema.carriers.id, id))
      .returning();

    return restored;
  }

  /**
   * Permanently delete carrier
   */
  async hardDelete(id: string): Promise<void> {
    this.logger.log(`Hard deleting carrier ${id}`);

    await this.db.delete(schema.carriers).where(eq(schema.carriers.id, id));
  }

  /**
   * Get carrier stats
   */
  async getStats(): Promise<{
    total: number;
    businesses: number;
    individuals: number;
  }> {
    const [totalResult] = await this.db
      .select({ count: count() })
      .from(schema.carriers)
      .where(eq(schema.carriers.isDeleted, false));

    const [businessResult] = await this.db
      .select({ count: count() })
      .from(schema.carriers)
      .where(and(eq(schema.carriers.isDeleted, false), eq(schema.carriers.isBusiness, true)));

    const total = totalResult?.count || 0;
    const businesses = businessResult?.count || 0;

    return {
      total,
      businesses,
      individuals: total - businesses,
    };
  }

  /**
   * Get carrier display name
   */
  getDisplayName(carrier: any): string {
    if (carrier.isBusiness && carrier.businessName) {
      return carrier.businessName;
    }
    return `${carrier.firstName || ''} ${carrier.lastName || ''}`.trim() || 'Unknown';
  }

  /**
   * Get all active carriers for dropdown
   */
  async getActiveCarriers(): Promise<{ id: string; name: string }[]> {
    const carriers = await this.db
      .select({
        id: schema.carriers.id,
        isBusiness: schema.carriers.isBusiness,
        firstName: schema.carriers.firstName,
        lastName: schema.carriers.lastName,
        businessName: schema.carriers.businessName,
      })
      .from(schema.carriers)
      .where(eq(schema.carriers.isDeleted, false))
      .orderBy(schema.carriers.businessName, schema.carriers.lastName);

    return carriers.map((c) => ({
      id: c.id,
      name: c.isBusiness && c.businessName
        ? c.businessName
        : `${c.firstName || ''} ${c.lastName || ''}`.trim(),
    }));
  }
}
