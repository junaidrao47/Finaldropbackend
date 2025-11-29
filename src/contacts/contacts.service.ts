import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq, and, desc, gte, lte, count } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import {
  CreateChatSessionDto,
  CreateChatMessageDto,
  UpdateChatSessionDto,
  ChatSessionFilterDto,
  AiQueryDto,
  AiResponseDto,
  ChatSessionStatus,
  MessageType,
  SenderType,
  InquiryType,
  ContactStatsDto,
  EscalationRequestDto,
} from './dto/contact.dto';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    @Inject('DRIZZLE_DB')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Create a new support chat session
   */
  async createSession(dto: CreateChatSessionDto): Promise<any> {
    this.logger.log(`Creating support session for customer ${dto.customerId}`);

    const [session] = await this.db
      .insert(schema.supportSessions)
      .values({
        customerId: dto.customerId,
        organizationId: dto.organizationId || null,
        subject: dto.subject || 'New Inquiry',
        inquiryType: dto.inquiryType || InquiryType.GENERAL,
        status: ChatSessionStatus.ACTIVE,
        relatedPackageId: dto.relatedPackageId || null,
        isEscalated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Send AI greeting message
    await this.addSystemMessage(
      session.id,
      'Hello! I\'m the FinalDrop AI assistant. How can I help you today? You can ask me about:\n• Package tracking and status\n• Delivery schedules\n• Pickup requests\n• Return processing\n• General inquiries',
    );

    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: number): Promise<any> {
    const [session] = await this.db
      .select()
      .from(schema.supportSessions)
      .where(eq(schema.supportSessions.id, sessionId))
      .limit(1);

    if (!session) {
      throw new NotFoundException(`Support session ${sessionId} not found`);
    }

    return session;
  }

  /**
   * Update support session
   */
  async updateSession(sessionId: number, dto: UpdateChatSessionDto): Promise<any> {
    const [updated] = await this.db
      .update(schema.supportSessions)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(schema.supportSessions.id, sessionId))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Support session ${sessionId} not found`);
    }

    return updated;
  }

  /**
   * List support sessions with filters
   */
  async listSessions(filter: ChatSessionFilterDto): Promise<{ data: any[]; total: number }> {
    const conditions: any[] = [];

    if (filter.customerId) {
      conditions.push(eq(schema.supportSessions.customerId, filter.customerId));
    }
    if (filter.organizationId) {
      conditions.push(eq(schema.supportSessions.organizationId, filter.organizationId));
    }
    if (filter.assignedAgentId) {
      conditions.push(eq(schema.supportSessions.assignedAgentId, filter.assignedAgentId));
    }
    if (filter.status) {
      conditions.push(eq(schema.supportSessions.status, filter.status));
    }
    if (filter.inquiryType) {
      conditions.push(eq(schema.supportSessions.inquiryType, filter.inquiryType));
    }
    if (filter.isEscalated !== undefined) {
      conditions.push(eq(schema.supportSessions.isEscalated, filter.isEscalated));
    }
    if (filter.startDate) {
      conditions.push(gte(schema.supportSessions.createdAt, new Date(filter.startDate)));
    }
    if (filter.endDate) {
      conditions.push(lte(schema.supportSessions.createdAt, new Date(filter.endDate)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const offset = (page - 1) * limit;

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(schema.supportSessions)
      .where(whereClause);

    const data = await this.db
      .select()
      .from(schema.supportSessions)
      .where(whereClause)
      .orderBy(desc(schema.supportSessions.updatedAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      total: totalResult?.count || 0,
    };
  }

  /**
   * Add a message to a support session
   */
  async addMessage(dto: CreateChatMessageDto, senderId?: number): Promise<any> {
    await this.getSession(dto.sessionId); // Verify session exists

    const [message] = await this.db
      .insert(schema.supportMessages)
      .values({
        sessionId: dto.sessionId,
        content: dto.content,
        messageType: dto.messageType || MessageType.TEXT,
        senderType: dto.senderType || SenderType.USER,
        senderId: senderId || null,
        attachmentUrl: dto.attachmentUrl || null,
        attachmentName: dto.attachmentName || null,
        isRead: false,
        createdAt: new Date(),
      })
      .returning();

    // Update session's lastMessageAt
    await this.db
      .update(schema.supportSessions)
      .set({
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.supportSessions.id, dto.sessionId));

    return message;
  }

  /**
   * Add system message to session
   */
  private async addSystemMessage(sessionId: number, content: string): Promise<void> {
    await this.db.insert(schema.supportMessages).values({
      sessionId,
      content,
      messageType: MessageType.SYSTEM,
      senderType: SenderType.SYSTEM,
      isRead: false,
      createdAt: new Date(),
    });
  }

  /**
   * Get messages for a session
   */
  async getMessages(
    sessionId: number,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ messages: any[]; total: number }> {
    await this.getSession(sessionId); // Verify session exists

    const offset = (page - 1) * limit;

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(schema.supportMessages)
      .where(eq(schema.supportMessages.sessionId, sessionId));

    const messages = await this.db
      .select()
      .from(schema.supportMessages)
      .where(eq(schema.supportMessages.sessionId, sessionId))
      .orderBy(desc(schema.supportMessages.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      messages: messages.reverse(), // Return in chronological order
      total: totalResult?.count || 0,
    };
  }

  /**
   * Process AI query and return response
   * This is a placeholder - integrate with actual AI service (OpenAI, etc.)
   */
  async processAiQuery(dto: AiQueryDto): Promise<AiResponseDto> {
    this.logger.log(`Processing AI query for session ${dto.sessionId}: ${dto.query}`);

    // Store user message
    await this.addMessage({
      sessionId: dto.sessionId,
      content: dto.query,
      messageType: MessageType.TEXT,
      senderType: SenderType.USER,
    });

    // Detect intent and generate response
    const { intent, response, requiresHuman, confidence } = await this.generateAiResponse(dto.query);

    // Store AI response
    await this.addMessage({
      sessionId: dto.sessionId,
      content: response,
      messageType: MessageType.AI_RESPONSE,
      senderType: SenderType.AI,
    });

    // If AI cannot handle, escalate
    if (requiresHuman) {
      await this.updateSession(dto.sessionId, {
        status: ChatSessionStatus.WAITING,
      });
    }

    return {
      sessionId: dto.sessionId,
      response,
      confidence,
      suggestedActions: this.getSuggestedActions(intent),
      requiresHumanAgent: requiresHuman,
      detectedIntent: intent,
    };
  }

  /**
   * Generate AI response based on query
   * Placeholder for actual AI integration
   */
  private async generateAiResponse(query: string): Promise<{
    intent: string;
    response: string;
    requiresHuman: boolean;
    confidence: number;
  }> {
    const queryLower = query.toLowerCase();

    // Simple intent detection (replace with actual NLP/AI)
    if (queryLower.includes('track') || queryLower.includes('where') || queryLower.includes('status')) {
      return {
        intent: 'package_tracking',
        response: 'I can help you track your package! Please provide your tracking number or the recipient\'s name, and I\'ll look up the current status for you.',
        requiresHuman: false,
        confidence: 0.85,
      };
    }

    if (queryLower.includes('pickup') || queryLower.includes('collect')) {
      return {
        intent: 'pickup_request',
        response: 'I\'d be happy to help schedule a pickup. Could you please provide:\n1. Pickup address\n2. Preferred date and time\n3. Package details (size/weight if known)',
        requiresHuman: false,
        confidence: 0.80,
      };
    }

    if (queryLower.includes('return') || queryLower.includes('refund')) {
      return {
        intent: 'return_request',
        response: 'I can assist with your return request. Please provide the package ID or tracking number, and the reason for the return.',
        requiresHuman: false,
        confidence: 0.82,
      };
    }

    if (queryLower.includes('delivery') || queryLower.includes('when') || queryLower.includes('arrive')) {
      return {
        intent: 'delivery_inquiry',
        response: 'For delivery information, please provide your tracking number. I\'ll check the estimated delivery date and current location.',
        requiresHuman: false,
        confidence: 0.78,
      };
    }

    if (queryLower.includes('agent') || queryLower.includes('human') || queryLower.includes('speak')) {
      return {
        intent: 'human_agent',
        response: 'I\'ll connect you with a customer service agent right away. Please hold while I transfer your chat.',
        requiresHuman: true,
        confidence: 0.95,
      };
    }

    if (queryLower.includes('billing') || queryLower.includes('invoice') || queryLower.includes('payment')) {
      return {
        intent: 'billing',
        response: 'For billing inquiries, I\'ll need to connect you with our billing team. Let me transfer you to a specialist.',
        requiresHuman: true,
        confidence: 0.70,
      };
    }

    // Default response
    return {
      intent: 'general',
      response: 'I\'m here to help! You can ask me about:\n• Package tracking\n• Delivery schedules\n• Pickup requests\n• Returns\n\nOr type "agent" to speak with a customer service representative.',
      requiresHuman: false,
      confidence: 0.60,
    };
  }

  /**
   * Get suggested quick actions based on intent
   */
  private getSuggestedActions(intent: string): { label: string; action: string }[] {
    const actions: Record<string, { label: string; action: string }[]> = {
      package_tracking: [
        { label: '📦 Enter Tracking Number', action: 'track_package' },
        { label: '📋 View My Packages', action: 'list_packages' },
      ],
      pickup_request: [
        { label: '📅 Schedule Pickup', action: 'schedule_pickup' },
        { label: '📍 View Pickup Locations', action: 'pickup_locations' },
      ],
      return_request: [
        { label: '↩️ Start Return', action: 'start_return' },
        { label: '📋 Return Policy', action: 'return_policy' },
      ],
      delivery_inquiry: [
        { label: '🚚 Track Delivery', action: 'track_delivery' },
        { label: '📅 Reschedule Delivery', action: 'reschedule' },
      ],
      general: [
        { label: '📦 Track Package', action: 'track_package' },
        { label: '🆘 Contact Agent', action: 'contact_agent' },
      ],
    };

    return actions[intent] || actions.general;
  }

  /**
   * Escalate session to human agent
   */
  async escalateSession(dto: EscalationRequestDto, currentUserId: number): Promise<any> {
    await this.getSession(dto.sessionId); // Verify exists

    const updated = await this.updateSession(dto.sessionId, {
      status: ChatSessionStatus.ESCALATED,
      isEscalated: true,
      assignedAgentId: dto.preferredAgentId,
    });

    // Add system message about escalation
    await this.addSystemMessage(
      dto.sessionId,
      `This conversation has been escalated to a customer service agent. Reason: ${dto.reason}`,
    );

    return updated;
  }

  /**
   * Resolve a support session
   */
  async resolveSession(sessionId: number, resolutionNotes?: string): Promise<any> {
    const updated = await this.updateSession(sessionId, {
      status: ChatSessionStatus.RESOLVED,
      resolutionNotes,
    });

    await this.addSystemMessage(
      sessionId,
      'This conversation has been marked as resolved. Thank you for using FinalDrop support!',
    );

    return updated;
  }

  /**
   * Get support statistics
   */
  async getStats(organizationId?: number): Promise<ContactStatsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const baseConditions = organizationId
      ? [eq(schema.supportSessions.organizationId, organizationId)]
      : [];

    // Total sessions
    const [totalResult] = await this.db
      .select({ count: count() })
      .from(schema.supportSessions)
      .where(baseConditions.length > 0 ? and(...baseConditions) : undefined);

    // Active sessions
    const [activeResult] = await this.db
      .select({ count: count() })
      .from(schema.supportSessions)
      .where(
        and(
          ...baseConditions,
          eq(schema.supportSessions.status, ChatSessionStatus.ACTIVE),
        ),
      );

    // Waiting sessions
    const [waitingResult] = await this.db
      .select({ count: count() })
      .from(schema.supportSessions)
      .where(
        and(
          ...baseConditions,
          eq(schema.supportSessions.status, ChatSessionStatus.WAITING),
        ),
      );

    // Escalated sessions
    const [escalatedResult] = await this.db
      .select({ count: count() })
      .from(schema.supportSessions)
      .where(and(...baseConditions, eq(schema.supportSessions.isEscalated, true)));

    // Resolved today
    const [resolvedTodayResult] = await this.db
      .select({ count: count() })
      .from(schema.supportSessions)
      .where(
        and(
          ...baseConditions,
          eq(schema.supportSessions.status, ChatSessionStatus.RESOLVED),
          gte(schema.supportSessions.updatedAt, today),
        ),
      );

    return {
      totalSessions: totalResult?.count || 0,
      activeSessions: activeResult?.count || 0,
      waitingSessions: waitingResult?.count || 0,
      resolvedToday: resolvedTodayResult?.count || 0,
      escalatedSessions: escalatedResult?.count || 0,
      averageResponseTime: 5, // Placeholder - implement actual calculation
      aiResolutionRate: 72, // Placeholder - implement actual calculation
      byInquiryType: {
        [InquiryType.PACKAGE_STATUS]: 0,
        [InquiryType.DELIVERY_ISSUE]: 0,
        [InquiryType.PICKUP_REQUEST]: 0,
        [InquiryType.BILLING]: 0,
        [InquiryType.GENERAL]: 0,
        [InquiryType.COMPLAINT]: 0,
        [InquiryType.RETURN_REQUEST]: 0,
      },
    };
  }

  /**
   * Mark messages as read
   */
  async markMessagesRead(sessionId: number, messageIds?: number[]): Promise<void> {
    if (messageIds && messageIds.length > 0) {
      // Mark specific messages
      for (const id of messageIds) {
        await this.db
          .update(schema.supportMessages)
          .set({ isRead: true })
          .where(eq(schema.supportMessages.id, id));
      }
    } else {
      // Mark all messages in session
      await this.db
        .update(schema.supportMessages)
        .set({ isRead: true })
        .where(eq(schema.supportMessages.sessionId, sessionId));
    }
  }
}
