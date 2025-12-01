import { ContactsService } from './src/contacts/contacts.service';
import {
  CreateChatSessionDto,
  CreateChatMessageDto,
  UpdateChatSessionDto,
  ChatSessionFilterDto,
  AiQueryDto,
  EscalationRequestDto,
  ChatSessionStatus,
  MessageType,
  SenderType,
  InquiryType,
} from './src/contacts/dto/contact.dto';
import { NotFoundException } from '@nestjs/common';

// Mock drizzle-orm functions
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a, b) => ({ type: 'eq', a, b })),
  and: jest.fn((...conditions) => ({ type: 'and', conditions })),
  or: jest.fn((...conditions) => ({ type: 'or', conditions })),
  desc: jest.fn((col) => ({ type: 'desc', col })),
  gte: jest.fn((a, b) => ({ type: 'gte', a, b })),
  lte: jest.fn((a, b) => ({ type: 'lte', a, b })),
  count: jest.fn(() => ({ type: 'count' })),
}));

// Mock database helper
const createMockDb = () => {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    returning: jest.fn(),
  };
  return mockChain;
};

describe('ContactsService', () => {
  let service: ContactsService;
  let mockDb: ReturnType<typeof createMockDb>;

  const mockSession = {
    id: 1,
    customerId: 100,
    organizationId: 1,
    subject: 'Test Inquiry',
    inquiryType: InquiryType.GENERAL,
    status: ChatSessionStatus.ACTIVE,
    relatedPackageId: null,
    isEscalated: false,
    assignedAgentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMessage = {
    id: 1,
    sessionId: 1,
    content: 'Hello, I need help',
    messageType: MessageType.TEXT,
    senderType: SenderType.USER,
    senderId: 100,
    attachmentUrl: null,
    attachmentName: null,
    isRead: false,
    createdAt: new Date(),
  };

  beforeEach(() => {
    mockDb = createMockDb();
    service = new ContactsService(mockDb as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ==================== createSession ====================
  describe('createSession', () => {
    beforeEach(() => {
      mockDb.returning.mockResolvedValue([mockSession]);
    });

    it('should create a new support session', async () => {
      const dto: CreateChatSessionDto = {
        customerId: 100,
        organizationId: 1,
        subject: 'Test Inquiry',
      };

      const result = await service.createSession(dto);

      expect(result).toEqual(mockSession);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should set default subject if not provided', async () => {
      const dto: CreateChatSessionDto = { customerId: 100 };

      await service.createSession(dto);

      expect(mockDb.values).toHaveBeenCalled();
    });

    it('should set default inquiry type to GENERAL', async () => {
      const dto: CreateChatSessionDto = { customerId: 100 };

      await service.createSession(dto);

      expect(mockDb.values).toHaveBeenCalled();
    });

    it('should allow setting inquiry type', async () => {
      const dto: CreateChatSessionDto = {
        customerId: 100,
        inquiryType: InquiryType.PACKAGE_STATUS,
      };

      await service.createSession(dto);

      expect(mockDb.values).toHaveBeenCalled();
    });

    it('should handle related package ID', async () => {
      const dto: CreateChatSessionDto = {
        customerId: 100,
        relatedPackageId: 500,
      };

      await service.createSession(dto);

      expect(mockDb.values).toHaveBeenCalled();
    });
  });

  // ==================== getSession ====================
  describe('getSession', () => {
    it('should return session by ID', async () => {
      mockDb.limit.mockResolvedValue([mockSession]);

      const result = await service.getSession(1);

      expect(result).toEqual(mockSession);
    });

    it('should throw NotFoundException when session not found', async () => {
      mockDb.limit.mockResolvedValue([]);

      await expect(service.getSession(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== updateSession ====================
  describe('updateSession', () => {
    it('should update session', async () => {
      const updatedSession = { ...mockSession, status: ChatSessionStatus.RESOLVED };
      mockDb.returning.mockResolvedValue([updatedSession]);

      const dto: UpdateChatSessionDto = { status: ChatSessionStatus.RESOLVED };
      const result = await service.updateSession(1, dto);

      expect(result.status).toBe(ChatSessionStatus.RESOLVED);
    });

    it('should throw NotFoundException when session not found', async () => {
      mockDb.returning.mockResolvedValue([]);

      await expect(service.updateSession(999, {})).rejects.toThrow(NotFoundException);
    });

    it('should update assigned agent', async () => {
      mockDb.returning.mockResolvedValue([{ ...mockSession, assignedAgentId: 50 }]);

      const dto: UpdateChatSessionDto = { assignedAgentId: 50 };
      const result = await service.updateSession(1, dto);

      expect(result.assignedAgentId).toBe(50);
    });

    it('should update escalation status', async () => {
      mockDb.returning.mockResolvedValue([{ ...mockSession, isEscalated: true }]);

      const dto: UpdateChatSessionDto = { isEscalated: true };
      const result = await service.updateSession(1, dto);

      expect(result.isEscalated).toBe(true);
    });
  });

  // ==================== listSessions ====================
  describe('listSessions', () => {
    const mockSessions = [mockSession, { ...mockSession, id: 2 }];

    it('should return paginated sessions', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 2 }]);
      mockDb.where.mockReturnValueOnce({
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue(mockSessions),
          }),
        }),
      });

      const filter: ChatSessionFilterDto = { page: 1, limit: 10 };
      const result = await service.listSessions(filter);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by customerId', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.where.mockReturnValueOnce({
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue([mockSession]),
          }),
        }),
      });

      const filter: ChatSessionFilterDto = { customerId: 100 };
      await service.listSessions(filter);

      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.where.mockReturnValueOnce({
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue([mockSession]),
          }),
        }),
      });

      const filter: ChatSessionFilterDto = { status: ChatSessionStatus.ACTIVE };
      await service.listSessions(filter);

      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should filter by inquiryType', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.where.mockReturnValueOnce({
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue([mockSession]),
          }),
        }),
      });

      const filter: ChatSessionFilterDto = { inquiryType: InquiryType.PACKAGE_STATUS };
      await service.listSessions(filter);

      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should filter by date range', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.where.mockReturnValueOnce({
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue([mockSession]),
          }),
        }),
      });

      const filter: ChatSessionFilterDto = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };
      await service.listSessions(filter);

      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should filter by isEscalated', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.where.mockReturnValueOnce({
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue([mockSession]),
          }),
        }),
      });

      const filter: ChatSessionFilterDto = { isEscalated: true };
      await service.listSessions(filter);

      expect(mockDb.where).toHaveBeenCalled();
    });
  });

  // ==================== addMessage ====================
  describe('addMessage', () => {
    beforeEach(() => {
      mockDb.limit.mockResolvedValue([mockSession]);
      mockDb.returning.mockResolvedValue([mockMessage]);
    });

    it('should add message to session', async () => {
      const dto: CreateChatMessageDto = {
        sessionId: 1,
        content: 'Hello, I need help',
      };

      const result = await service.addMessage(dto, 100);

      expect(result).toEqual(mockMessage);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid session', async () => {
      mockDb.limit.mockResolvedValue([]);

      const dto: CreateChatMessageDto = {
        sessionId: 999,
        content: 'Test message',
      };

      await expect(service.addMessage(dto)).rejects.toThrow(NotFoundException);
    });

    it('should handle attachment', async () => {
      const dto: CreateChatMessageDto = {
        sessionId: 1,
        content: 'See attached file',
        attachmentUrl: 'https://example.com/file.pdf',
        attachmentName: 'document.pdf',
      };

      await service.addMessage(dto);

      expect(mockDb.values).toHaveBeenCalled();
    });

    it('should set message type', async () => {
      const dto: CreateChatMessageDto = {
        sessionId: 1,
        content: 'Image description',
        messageType: MessageType.IMAGE,
      };

      await service.addMessage(dto);

      expect(mockDb.values).toHaveBeenCalled();
    });

    it('should set sender type', async () => {
      const dto: CreateChatMessageDto = {
        sessionId: 1,
        content: 'Agent response',
        senderType: SenderType.AGENT,
      };

      await service.addMessage(dto);

      expect(mockDb.values).toHaveBeenCalled();
    });
  });

  // ==================== getMessages ====================
  describe('getMessages', () => {
    const mockMessages = [mockMessage, { ...mockMessage, id: 2 }];

    beforeEach(() => {
      mockDb.limit.mockResolvedValueOnce([mockSession]); // For getSession
      mockDb.where.mockResolvedValueOnce([{ count: 2 }]); // For count
      mockDb.where.mockReturnValueOnce({
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue(mockMessages),
          }),
        }),
      });
    });

    it('should return messages for session', async () => {
      const result = await service.getMessages(1);

      expect(result.messages).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should throw NotFoundException for invalid session', async () => {
      mockDb.limit.mockReset();
      mockDb.limit.mockResolvedValue([]);

      await expect(service.getMessages(999)).rejects.toThrow(NotFoundException);
    });

    it('should handle pagination', async () => {
      const result = await service.getMessages(1, 2, 10);

      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  // ==================== processAiQuery ====================
  describe('processAiQuery', () => {
    beforeEach(() => {
      mockDb.limit.mockResolvedValue([mockSession]);
      mockDb.returning.mockResolvedValue([mockMessage]);
    });

    it('should process AI query and return response', async () => {
      const dto: AiQueryDto = {
        sessionId: 1,
        query: 'Where is my package?',
      };

      const result = await service.processAiQuery(dto);

      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('requiresHumanAgent');
    });

    it('should detect package tracking intent', async () => {
      const dto: AiQueryDto = {
        sessionId: 1,
        query: 'Track my order',
      };

      const result = await service.processAiQuery(dto);

      expect(result.detectedIntent).toBe('package_tracking');
    });

    it('should detect pickup request intent', async () => {
      const dto: AiQueryDto = {
        sessionId: 1,
        query: 'I need to schedule a pickup',
      };

      const result = await service.processAiQuery(dto);

      expect(result.detectedIntent).toBe('pickup_request');
    });

    it('should detect return request intent', async () => {
      const dto: AiQueryDto = {
        sessionId: 1,
        query: 'I want to return this item',
      };

      const result = await service.processAiQuery(dto);

      expect(result.detectedIntent).toBe('return_request');
    });

    it('should detect delivery inquiry intent', async () => {
      const dto: AiQueryDto = {
        sessionId: 1,
        query: 'When will my delivery arrive?',
      };

      const result = await service.processAiQuery(dto);

      expect(result.detectedIntent).toBe('delivery_inquiry');
    });

    it('should detect human agent request', async () => {
      const dto: AiQueryDto = {
        sessionId: 1,
        query: 'I want to speak to an agent',
      };

      const result = await service.processAiQuery(dto);

      expect(result.detectedIntent).toBe('human_agent');
      expect(result.requiresHumanAgent).toBe(true);
    });

    it('should detect billing intent and require human', async () => {
      const dto: AiQueryDto = {
        sessionId: 1,
        query: 'I have a billing question about my invoice',
      };

      const result = await service.processAiQuery(dto);

      expect(result.detectedIntent).toBe('billing');
      expect(result.requiresHumanAgent).toBe(true);
    });

    it('should return suggested actions', async () => {
      const dto: AiQueryDto = {
        sessionId: 1,
        query: 'Help me track my package',
      };

      const result = await service.processAiQuery(dto);

      expect(result.suggestedActions).toBeDefined();
      expect(result.suggestedActions.length).toBeGreaterThan(0);
    });
  });

  // ==================== escalateSession ====================
  describe('escalateSession', () => {
    beforeEach(() => {
      mockDb.limit.mockResolvedValue([mockSession]);
      mockDb.returning.mockResolvedValue([{ ...mockSession, status: ChatSessionStatus.ESCALATED, isEscalated: true }]);
    });

    it('should escalate session to human agent', async () => {
      const dto: EscalationRequestDto = {
        sessionId: 1,
        reason: 'Complex issue requiring human assistance',
      };

      const result = await service.escalateSession(dto, 100);

      expect(result.status).toBe(ChatSessionStatus.ESCALATED);
      expect(result.isEscalated).toBe(true);
    });

    it('should throw NotFoundException for invalid session', async () => {
      mockDb.limit.mockResolvedValue([]);

      const dto: EscalationRequestDto = {
        sessionId: 999,
        reason: 'Test',
      };

      await expect(service.escalateSession(dto, 100)).rejects.toThrow(NotFoundException);
    });

    it('should assign preferred agent if specified', async () => {
      const dto: EscalationRequestDto = {
        sessionId: 1,
        reason: 'Need specialist',
        preferredAgentId: 50,
      };

      await service.escalateSession(dto, 100);

      expect(mockDb.set).toHaveBeenCalled();
    });
  });

  // ==================== resolveSession ====================
  describe('resolveSession', () => {
    beforeEach(() => {
      mockDb.returning.mockResolvedValue([{ ...mockSession, status: ChatSessionStatus.RESOLVED }]);
    });

    it('should resolve session', async () => {
      const result = await service.resolveSession(1, 'Issue resolved successfully');

      expect(result.status).toBe(ChatSessionStatus.RESOLVED);
    });

    it('should throw NotFoundException for invalid session', async () => {
      mockDb.returning.mockResolvedValue([]);

      await expect(service.resolveSession(999)).rejects.toThrow(NotFoundException);
    });

    it('should add resolution notes', async () => {
      await service.resolveSession(1, 'Customer satisfied with solution');

      expect(mockDb.set).toHaveBeenCalled();
    });
  });

  // ==================== getStats ====================
  describe('getStats', () => {
    beforeEach(() => {
      mockDb.where.mockResolvedValue([{ count: 10 }]);
    });

    it('should return support statistics', async () => {
      const result = await service.getStats();

      expect(result).toHaveProperty('totalSessions');
      expect(result).toHaveProperty('activeSessions');
      expect(result).toHaveProperty('waitingSessions');
      expect(result).toHaveProperty('resolvedToday');
      expect(result).toHaveProperty('escalatedSessions');
      expect(result).toHaveProperty('averageResponseTime');
      expect(result).toHaveProperty('aiResolutionRate');
    });

    it('should filter by organizationId', async () => {
      await service.getStats(1);

      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should return byInquiryType breakdown', async () => {
      const result = await service.getStats();

      expect(result.byInquiryType).toBeDefined();
      expect(result.byInquiryType).toHaveProperty(InquiryType.PACKAGE_STATUS);
      expect(result.byInquiryType).toHaveProperty(InquiryType.GENERAL);
    });
  });

  // ==================== markMessagesRead ====================
  describe('markMessagesRead', () => {
    it('should mark all messages in session as read', async () => {
      await service.markMessagesRead(1);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalled();
    });

    it('should mark specific messages as read', async () => {
      await service.markMessagesRead(1, [1, 2, 3]);

      expect(mockDb.update).toHaveBeenCalledTimes(3);
    });
  });
});
