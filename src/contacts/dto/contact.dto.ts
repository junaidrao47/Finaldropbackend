import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsArray,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

/**
 * Message types for chat
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
  AI_RESPONSE = 'ai_response',
}

/**
 * Message sender types
 */
export enum SenderType {
  USER = 'user',
  AGENT = 'agent',
  AI = 'ai',
  SYSTEM = 'system',
}

/**
 * Chat session status
 */
export enum ChatSessionStatus {
  ACTIVE = 'active',
  WAITING = 'waiting',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
}

/**
 * Contact inquiry types
 */
export enum InquiryType {
  PACKAGE_STATUS = 'package_status',
  DELIVERY_ISSUE = 'delivery_issue',
  PICKUP_REQUEST = 'pickup_request',
  BILLING = 'billing',
  GENERAL = 'general',
  COMPLAINT = 'complaint',
  RETURN_REQUEST = 'return_request',
}

/**
 * Create Chat Message DTO
 */
export class CreateChatMessageDto {
  @IsNumber()
  sessionId: number;

  @IsString()
  @MaxLength(5000)
  content: string;

  @IsEnum(MessageType)
  @IsOptional()
  messageType?: MessageType;

  @IsEnum(SenderType)
  @IsOptional()
  senderType?: SenderType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  attachmentName?: string;
}

/**
 * Create Chat Session DTO
 */
export class CreateChatSessionDto {
  @IsNumber()
  customerId: number;

  @IsOptional()
  @IsNumber()
  organizationId?: number;

  @IsEnum(InquiryType)
  @IsOptional()
  inquiryType?: InquiryType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @IsOptional()
  @IsNumber()
  relatedPackageId?: number;
}

/**
 * Update Chat Session DTO
 */
export class UpdateChatSessionDto extends PartialType(CreateChatSessionDto) {
  @IsOptional()
  @IsEnum(ChatSessionStatus)
  status?: ChatSessionStatus;

  @IsOptional()
  @IsNumber()
  assignedAgentId?: number;

  @IsOptional()
  @IsBoolean()
  isEscalated?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolutionNotes?: string;
}

/**
 * AI Query DTO - For sending queries to the AI assistant
 */
export class AiQueryDto {
  @IsNumber()
  sessionId: number;

  @IsString()
  @MaxLength(2000)
  query: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  context?: string[]; // Previous messages for context
}

/**
 * Quick Reply Option
 */
export class QuickReplyDto {
  @IsString()
  @MaxLength(100)
  label: string;

  @IsString()
  @MaxLength(500)
  action: string;
}

/**
 * AI Response DTO
 */
export interface AiResponseDto {
  sessionId: number;
  response: string;
  confidence: number;
  suggestedActions?: QuickReplyDto[];
  requiresHumanAgent: boolean;
  detectedIntent?: string;
}

/**
 * Chat Session Filter DTO
 */
export class ChatSessionFilterDto {
  @IsOptional()
  @IsNumber()
  customerId?: number;

  @IsOptional()
  @IsNumber()
  organizationId?: number;

  @IsOptional()
  @IsNumber()
  assignedAgentId?: number;

  @IsOptional()
  @IsEnum(ChatSessionStatus)
  status?: ChatSessionStatus;

  @IsOptional()
  @IsEnum(InquiryType)
  inquiryType?: InquiryType;

  @IsOptional()
  @IsBoolean()
  isEscalated?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

/**
 * Chat Message Response DTO
 */
export interface ChatMessageResponseDto {
  id: number;
  sessionId: number;
  content: string;
  messageType: MessageType;
  senderType: SenderType;
  senderId?: number;
  senderName?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: Date;
  isRead: boolean;
}

/**
 * Chat Session Response DTO
 */
export interface ChatSessionResponseDto {
  id: number;
  customerId: number;
  customerName: string;
  organizationId?: number;
  organizationName?: string;
  subject?: string;
  inquiryType: InquiryType;
  status: ChatSessionStatus;
  assignedAgentId?: number;
  assignedAgentName?: string;
  isEscalated: boolean;
  lastMessageAt?: Date;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Contact Stats DTO - For support dashboard
 */
export interface ContactStatsDto {
  totalSessions: number;
  activeSessions: number;
  waitingSessions: number;
  resolvedToday: number;
  escalatedSessions: number;
  averageResponseTime: number; // in minutes
  aiResolutionRate: number; // percentage
  byInquiryType: Record<InquiryType, number>;
}

/**
 * Escalation Request DTO
 */
export class EscalationRequestDto {
  @IsNumber()
  sessionId: number;

  @IsString()
  @MaxLength(500)
  reason: string;

  @IsOptional()
  @IsNumber()
  preferredAgentId?: number;
}
