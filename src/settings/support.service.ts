import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq, and, desc, count } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import {
  CreateSupportTicketDto,
  UpdateSupportTicketDto,
  SupportTicketFilterDto,
  SupportTicketResponseDto,
  AddTicketMessageDto,
  TicketMessageResponseDto,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  CreateAppRatingDto,
  AppRatingResponseDto,
  AppRatingStatsDto,
  PaginatedResponseDto,
} from './dto/settings-extended.dto';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @Inject('DRIZZLE_DB')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // ==================== Support Tickets ====================

  /**
   * Generate unique ticket number
   */
  private async generateTicketNumber(): Promise<string> {
    const prefix = 'TKT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Get support tickets with filters
   */
  async getTickets(
    userId: string,
    filters: SupportTicketFilterDto,
    isAdmin = false,
    organizationId?: string,
  ): Promise<PaginatedResponseDto<SupportTicketResponseDto>> {
    const { category, status, priority, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    try {
      const conditions = [eq(schema.supportTickets.isDeleted, false)];

      // Non-admin users can only see their own tickets
      if (!isAdmin) {
        conditions.push(eq(schema.supportTickets.userId, userId));
      } else if (organizationId) {
        conditions.push(eq(schema.supportTickets.organizationId, organizationId));
      }

      if (category) {
        conditions.push(eq(schema.supportTickets.category, category));
      }

      if (status) {
        conditions.push(eq(schema.supportTickets.status, status));
      }

      if (priority) {
        conditions.push(eq(schema.supportTickets.priority, priority));
      }

      // Get total count
      const [countResult] = await this.db
        .select({ count: count() })
        .from(schema.supportTickets)
        .where(and(...conditions));

      const total = Number(countResult?.count || 0);

      // Get paginated data
      const data = await this.db
        .select()
        .from(schema.supportTickets)
        .where(and(...conditions))
        .orderBy(desc(schema.supportTickets.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        data: data.map((t) => this.mapTicketToResponse(t)),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching tickets: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get single ticket by ID
   */
  async getTicket(id: string, userId: string, isAdmin = false): Promise<SupportTicketResponseDto> {
    const conditions = [
      eq(schema.supportTickets.id, id),
      eq(schema.supportTickets.isDeleted, false),
    ];

    if (!isAdmin) {
      conditions.push(eq(schema.supportTickets.userId, userId));
    }

    const [ticket] = await this.db
      .select()
      .from(schema.supportTickets)
      .where(and(...conditions));

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    // Get messages
    const messages = await this.db
      .select()
      .from(schema.supportTicketMessages)
      .where(
        and(
          eq(schema.supportTicketMessages.ticketId, id),
          eq(schema.supportTicketMessages.isDeleted, false),
          // Non-admin users can't see internal messages
          isAdmin ? undefined : eq(schema.supportTicketMessages.isInternal, false),
        ),
      )
      .orderBy(schema.supportTicketMessages.createdAt);

    return this.mapTicketToResponse(ticket, messages);
  }

  /**
   * Create support ticket
   */
  async createTicket(
    userId: string,
    dto: CreateSupportTicketDto,
    organizationId?: string,
  ): Promise<SupportTicketResponseDto> {
    try {
      const ticketNumber = await this.generateTicketNumber();

      const [created] = await this.db
        .insert(schema.supportTickets)
        .values({
          userId,
          organizationId,
          ticketNumber,
          category: dto.category,
          subject: dto.subject,
          description: dto.description,
          priority: dto.priority ?? TicketPriority.MEDIUM,
          status: TicketStatus.OPEN,
          attachments: dto.attachments ? JSON.stringify(dto.attachments) : null,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();

      this.logger.log(`Created support ticket ${ticketNumber}`);
      return this.mapTicketToResponse(created);
    } catch (error) {
      this.logger.error(`Error creating ticket: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Update ticket (admin only for status/assignment)
   */
  async updateTicket(
    id: string,
    dto: UpdateSupportTicketDto,
    userId: string,
  ): Promise<SupportTicketResponseDto> {
    const ticket = await this.getTicket(id, userId, true);

    const updateData: any = {
      ...dto,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (dto.status === TicketStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
    }

    if (dto.status === TicketStatus.CLOSED) {
      updateData.closedAt = new Date();
    }

    const [updated] = await this.db
      .update(schema.supportTickets)
      .set(updateData)
      .where(eq(schema.supportTickets.id, id))
      .returning();

    this.logger.log(`Updated ticket ${id}`);
    return this.mapTicketToResponse(updated);
  }

  /**
   * Add message to ticket
   */
  async addMessage(
    ticketId: string,
    dto: AddTicketMessageDto,
    userId: string,
    isAdmin = false,
  ): Promise<TicketMessageResponseDto> {
    // Verify ticket exists
    await this.getTicket(ticketId, userId, isAdmin);

    const [message] = await this.db
      .insert(schema.supportTicketMessages)
      .values({
        ticketId,
        senderId: userId,
        message: dto.message,
        isInternal: dto.isInternal ?? false,
        attachments: dto.attachments ? JSON.stringify(dto.attachments) : null,
      })
      .returning();

    // Update ticket status if user replied
    if (!isAdmin) {
      await this.db
        .update(schema.supportTickets)
        .set({
          status: TicketStatus.OPEN,
          updatedAt: new Date(),
        })
        .where(eq(schema.supportTickets.id, ticketId));
    }

    return this.mapMessageToResponse(message);
  }

  /**
   * Close ticket
   */
  async closeTicket(id: string, userId: string): Promise<SupportTicketResponseDto> {
    await this.getTicket(id, userId);

    const [updated] = await this.db
      .update(schema.supportTickets)
      .set({
        status: TicketStatus.CLOSED,
        closedAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.supportTickets.id, id))
      .returning();

    return this.mapTicketToResponse(updated);
  }

  /**
   * Get ticket stats
   */
  async getTicketStats(organizationId?: string): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    byCategory: Record<string, number>;
    avgResolutionTimeHours: number;
  }> {
    const baseCondition = eq(schema.supportTickets.isDeleted, false);
    const orgCondition = organizationId
      ? and(baseCondition, eq(schema.supportTickets.organizationId, organizationId))
      : baseCondition;

    const statuses = [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED];
    const statusCounts: Record<string, number> = {};

    for (const status of statuses) {
      const [result] = await this.db
        .select({ count: count() })
        .from(schema.supportTickets)
        .where(and(orgCondition, eq(schema.supportTickets.status, status)));
      statusCounts[status] = Number(result?.count || 0);
    }

    // Get by category
    const byCategory: Record<string, number> = {};
    for (const category of Object.values(TicketCategory)) {
      const [result] = await this.db
        .select({ count: count() })
        .from(schema.supportTickets)
        .where(and(orgCondition, eq(schema.supportTickets.category, category)));
      byCategory[category] = Number(result?.count || 0);
    }

    return {
      total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      open: statusCounts[TicketStatus.OPEN] || 0,
      inProgress: statusCounts[TicketStatus.IN_PROGRESS] || 0,
      resolved: statusCounts[TicketStatus.RESOLVED] || 0,
      closed: statusCounts[TicketStatus.CLOSED] || 0,
      byCategory,
      avgResolutionTimeHours: 0, // Would need aggregation query
    };
  }

  // ==================== App Ratings ====================

  /**
   * Submit app rating
   */
  async submitRating(
    userId: string,
    dto: CreateAppRatingDto,
    organizationId?: string,
  ): Promise<AppRatingResponseDto> {
    try {
      // Check if user already rated (allow one rating per platform)
      if (dto.platform) {
        const [existing] = await this.db
          .select()
          .from(schema.appRatings)
          .where(
            and(
              eq(schema.appRatings.userId, userId),
              eq(schema.appRatings.platform, dto.platform),
            ),
          );

        if (existing) {
          throw new BadRequestException('You have already rated the app on this platform');
        }
      }

      const [created] = await this.db
        .insert(schema.appRatings)
        .values({
          userId,
          organizationId,
          rating: dto.rating,
          feedback: dto.feedback,
          platform: dto.platform,
          appVersion: dto.appVersion,
          wouldRecommend: dto.wouldRecommend,
        })
        .returning();

      this.logger.log(`User ${userId} submitted rating: ${dto.rating}`);
      return this.mapRatingToResponse(created);
    } catch (error) {
      this.logger.error(`Error submitting rating: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get rating stats
   */
  async getRatingStats(): Promise<AppRatingStatsDto> {
    const [totalResult] = await this.db
      .select({ count: count() })
      .from(schema.appRatings);

    const total = Number(totalResult?.count || 0);

    if (total === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recommendRate: 0,
      };
    }

    // Get distribution
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (let rating = 1; rating <= 5; rating++) {
      const [result] = await this.db
        .select({ count: count() })
        .from(schema.appRatings)
        .where(eq(schema.appRatings.rating, rating));
      distribution[rating] = Number(result?.count || 0);
    }

    // Calculate average
    const weightedSum = Object.entries(distribution).reduce(
      (sum, [rating, cnt]) => sum + Number(rating) * cnt,
      0,
    );
    const averageRating = Math.round((weightedSum / total) * 10) / 10;

    // Get recommend rate
    const [recommendResult] = await this.db
      .select({ count: count() })
      .from(schema.appRatings)
      .where(eq(schema.appRatings.wouldRecommend, true));

    const recommendCount = Number(recommendResult?.count || 0);
    const recommendRate = Math.round((recommendCount / total) * 100);

    return {
      averageRating,
      totalRatings: total,
      ratingDistribution: distribution as any,
      recommendRate,
    };
  }

  /**
   * Get user's rating
   */
  async getUserRating(userId: string): Promise<AppRatingResponseDto | null> {
    const [rating] = await this.db
      .select()
      .from(schema.appRatings)
      .where(eq(schema.appRatings.userId, userId))
      .orderBy(desc(schema.appRatings.createdAt))
      .limit(1);

    return rating ? this.mapRatingToResponse(rating) : null;
  }

  // ==================== Help & Support Content ====================

  /**
   * Get FAQ categories
   */
  getFaqCategories(): { id: string; name: string; icon: string }[] {
    return [
      { id: 'getting-started', name: 'Getting Started', icon: 'rocket' },
      { id: 'packages', name: 'Package Management', icon: 'package' },
      { id: 'carriers', name: 'Carriers & Shipping', icon: 'truck' },
      { id: 'billing', name: 'Billing & Payments', icon: 'credit-card' },
      { id: 'security', name: 'Security & Privacy', icon: 'shield' },
      { id: 'technical', name: 'Technical Issues', icon: 'wrench' },
    ];
  }

  /**
   * Get FAQs (static content - could be moved to DB)
   */
  getFaqs(category?: string): { id: string; question: string; answer: string; category: string }[] {
    const faqs = [
      {
        id: '1',
        category: 'getting-started',
        question: 'How do I create an account?',
        answer: 'To create an account, click on the Sign Up button and follow the registration process...',
      },
      {
        id: '2',
        category: 'packages',
        question: 'How do I track a package?',
        answer: 'You can track packages using the tracking number or by scanning the QR code...',
      },
      {
        id: '3',
        category: 'packages',
        question: 'What happens if a package is damaged?',
        answer: 'If you receive a damaged package, please document it with photos and report it immediately...',
      },
      {
        id: '4',
        category: 'carriers',
        question: 'How do I add a new carrier?',
        answer: 'Navigate to Settings > Carriers and click Add New Carrier to configure a new shipping partner...',
      },
      {
        id: '5',
        category: 'billing',
        question: 'What payment methods are accepted?',
        answer: 'We accept all major credit cards, ACH transfers, and wire transfers for enterprise accounts...',
      },
      {
        id: '6',
        category: 'security',
        question: 'How is my data protected?',
        answer: 'We use industry-standard encryption and security measures to protect your data...',
      },
    ];

    return category ? faqs.filter((f) => f.category === category) : faqs;
  }

  /**
   * Get support contact info
   */
  getSupportContactInfo(): {
    email: string;
    phone: string;
    hours: string;
    liveChat: boolean;
  } {
    return {
      email: 'support@finaldrop.com',
      phone: '+1 (800) 555-0123',
      hours: 'Mon-Fri 9AM-6PM EST',
      liveChat: true,
    };
  }

  // ==================== Mappers ====================

  private mapTicketToResponse(
    ticket: schema.SupportTicketSelect,
    messages?: schema.SupportTicketMessageSelect[],
  ): SupportTicketResponseDto {
    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      category: ticket.category as TicketCategory,
      subject: ticket.subject,
      description: ticket.description,
      priority: ticket.priority as TicketPriority,
      status: ticket.status as TicketStatus,
      assignedTo: ticket.assignedTo ?? undefined,
      attachments: ticket.attachments ? JSON.parse(ticket.attachments as string) : undefined,
      resolvedAt: ticket.resolvedAt ?? undefined,
      closedAt: ticket.closedAt ?? undefined,
      createdAt: ticket.createdAt,
      messages: messages?.map((m) => this.mapMessageToResponse(m)),
    };
  }

  private mapMessageToResponse(message: schema.SupportTicketMessageSelect): TicketMessageResponseDto {
    return {
      id: message.id,
      senderId: message.senderId,
      message: message.message,
      isInternal: message.isInternal,
      attachments: message.attachments ? JSON.parse(message.attachments as string) : undefined,
      createdAt: message.createdAt,
    };
  }

  private mapRatingToResponse(rating: schema.AppRatingSelect): AppRatingResponseDto {
    return {
      id: rating.id,
      rating: rating.rating,
      feedback: rating.feedback ?? undefined,
      platform: rating.platform ?? undefined,
      appVersion: rating.appVersion ?? undefined,
      wouldRecommend: rating.wouldRecommend ?? undefined,
      createdAt: rating.createdAt,
    };
  }
}
