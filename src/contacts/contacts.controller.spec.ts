import { ContactsController } from './src/contacts/contacts.controller';
import { ContactsService } from './src/contacts/contacts.service';
import {
  CreateChatSessionDto,
  CreateChatMessageDto,
  UpdateChatSessionDto,
  ChatSessionFilterDto,
  AiQueryDto,
  EscalationRequestDto,
  ChatSessionStatus,
  InquiryType,
} from './src/contacts/dto/contact.dto';

describe('ContactsController', () => {
  let controller: ContactsController;
  let mockContactsService: jest.Mocked<Partial<ContactsService>>;

  const mockSession = {
    id: 1,
    customerId: 100,
    organizationId: 1,
    subject: 'Test Inquiry',
    inquiryType: InquiryType.GENERAL,
    status: ChatSessionStatus.ACTIVE,
    isEscalated: false,
    createdAt: new Date(),
  };

  const mockMessage = {
    id: 1,
    sessionId: 1,
    content: 'Hello, I need help',
    senderType: 'user',
    createdAt: new Date(),
  };

  const mockAiResponse = {
    sessionId: 1,
    response: 'I can help you track your package!',
    confidence: 0.85,
    suggestedActions: [{ label: 'Track Package', action: 'track_package' }],
    requiresHumanAgent: false,
    detectedIntent: 'package_tracking',
  };

  const mockStats = {
    totalSessions: 100,
    activeSessions: 15,
    waitingSessions: 5,
    resolvedToday: 20,
    escalatedSessions: 3,
    averageResponseTime: 5,
    aiResolutionRate: 72,
    byInquiryType: {},
  };

  beforeEach(() => {
    mockContactsService = {
      createSession: jest.fn().mockResolvedValue(mockSession),
      getSession: jest.fn().mockResolvedValue(mockSession),
      updateSession: jest.fn().mockResolvedValue({ ...mockSession, status: ChatSessionStatus.RESOLVED }),
      listSessions: jest.fn().mockResolvedValue({ data: [mockSession], total: 1 }),
      addMessage: jest.fn().mockResolvedValue(mockMessage),
      getMessages: jest.fn().mockResolvedValue({ messages: [mockMessage], total: 1 }),
      processAiQuery: jest.fn().mockResolvedValue(mockAiResponse),
      escalateSession: jest.fn().mockResolvedValue({ ...mockSession, status: ChatSessionStatus.ESCALATED }),
      resolveSession: jest.fn().mockResolvedValue({ ...mockSession, status: ChatSessionStatus.RESOLVED }),
      getStats: jest.fn().mockResolvedValue(mockStats),
      markMessagesRead: jest.fn().mockResolvedValue(undefined),
    };

    controller = new ContactsController(mockContactsService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  // ==================== POST /contacts/sessions ====================
  describe('POST /contacts/sessions', () => {
    it('should create a new session', async () => {
      const dto: CreateChatSessionDto = {
        customerId: 100,
        subject: 'Test Inquiry',
      };
      const req = { user: { id: 100 } };

      const result = await controller.createSession(dto, req);

      expect(result).toEqual(mockSession);
      expect(mockContactsService.createSession).toHaveBeenCalledWith(dto);
    });

    it('should use current user ID if customerId not provided', async () => {
      const dto: CreateChatSessionDto = {
        customerId: undefined as any,
        subject: 'Test',
      };
      const req = { user: { id: 200 } };

      await controller.createSession(dto, req);

      expect(dto.customerId).toBe(200);
    });

    it('should handle inquiry type', async () => {
      const dto: CreateChatSessionDto = {
        customerId: 100,
        inquiryType: InquiryType.PACKAGE_STATUS,
      };
      const req = { user: { id: 100 } };

      await controller.createSession(dto, req);

      expect(mockContactsService.createSession).toHaveBeenCalledWith(dto);
    });
  });

  // ==================== GET /contacts/sessions/:id ====================
  describe('GET /contacts/sessions/:id', () => {
    it('should return session by ID', async () => {
      const result = await controller.getSession(1);

      expect(result).toEqual(mockSession);
      expect(mockContactsService.getSession).toHaveBeenCalledWith(1);
    });

    it('should handle not found error', async () => {
      mockContactsService.getSession = jest.fn().mockRejectedValue(new Error('Not found'));

      await expect(controller.getSession(999)).rejects.toThrow('Not found');
    });
  });

  // ==================== PUT /contacts/sessions/:id ====================
  describe('PUT /contacts/sessions/:id', () => {
    it('should update session', async () => {
      const dto: UpdateChatSessionDto = { status: ChatSessionStatus.RESOLVED };

      const result = await controller.updateSession(1, dto);

      expect(result.status).toBe(ChatSessionStatus.RESOLVED);
      expect(mockContactsService.updateSession).toHaveBeenCalledWith(1, dto);
    });

    it('should update assigned agent', async () => {
      const dto: UpdateChatSessionDto = { assignedAgentId: 50 };

      await controller.updateSession(1, dto);

      expect(mockContactsService.updateSession).toHaveBeenCalledWith(1, dto);
    });
  });

  // ==================== GET /contacts/sessions ====================
  describe('GET /contacts/sessions', () => {
    it('should list sessions with filters', async () => {
      const filter: ChatSessionFilterDto = { status: ChatSessionStatus.ACTIVE };

      const result = await controller.listSessions(filter);

      expect(result.data).toHaveLength(1);
      expect(mockContactsService.listSessions).toHaveBeenCalledWith(filter);
    });

    it('should handle pagination', async () => {
      const filter: ChatSessionFilterDto = { page: 1, limit: 20 };

      await controller.listSessions(filter);

      expect(mockContactsService.listSessions).toHaveBeenCalledWith(filter);
    });
  });

  // ==================== GET /contacts/my-sessions ====================
  describe('GET /contacts/my-sessions', () => {
    it('should return sessions for current user', async () => {
      const req = { user: { id: 100 } };
      const filter: ChatSessionFilterDto = {};

      await controller.getMySessions(req, filter);

      expect(mockContactsService.listSessions).toHaveBeenCalledWith({
        ...filter,
        customerId: 100,
      });
    });
  });

  // ==================== GET /contacts/assigned-sessions ====================
  describe('GET /contacts/assigned-sessions', () => {
    it('should return sessions assigned to current agent', async () => {
      const req = { user: { id: 50 } };
      const filter: ChatSessionFilterDto = {};

      await controller.getAssignedSessions(req, filter);

      expect(mockContactsService.listSessions).toHaveBeenCalledWith({
        ...filter,
        assignedAgentId: 50,
      });
    });
  });

  // ==================== POST /contacts/messages ====================
  describe('POST /contacts/messages', () => {
    it('should send a message', async () => {
      const dto: CreateChatMessageDto = {
        sessionId: 1,
        content: 'Hello',
      };
      const req = { user: { id: 100 } };

      const result = await controller.sendMessage(dto, req);

      expect(result).toEqual(mockMessage);
      expect(mockContactsService.addMessage).toHaveBeenCalledWith(dto, 100);
    });

    it('should handle message without user', async () => {
      const dto: CreateChatMessageDto = {
        sessionId: 1,
        content: 'Hello',
      };
      const req = {};

      await controller.sendMessage(dto, req);

      expect(mockContactsService.addMessage).toHaveBeenCalledWith(dto, undefined);
    });
  });

  // ==================== GET /contacts/sessions/:id/messages ====================
  describe('GET /contacts/sessions/:id/messages', () => {
    it('should return messages for session', async () => {
      const result = await controller.getMessages(1);

      expect(result.messages).toHaveLength(1);
      expect(mockContactsService.getMessages).toHaveBeenCalledWith(1, undefined, undefined);
    });

    it('should handle pagination', async () => {
      await controller.getMessages(1, 2, 10);

      expect(mockContactsService.getMessages).toHaveBeenCalledWith(1, 2, 10);
    });
  });

  // ==================== POST /contacts/ai/query ====================
  describe('POST /contacts/ai/query', () => {
    it('should process AI query', async () => {
      const dto: AiQueryDto = {
        sessionId: 1,
        query: 'Where is my package?',
      };

      const result = await controller.aiQuery(dto);

      expect(result).toEqual(mockAiResponse);
      expect(mockContactsService.processAiQuery).toHaveBeenCalledWith(dto);
    });

    it('should return AI response with suggested actions', async () => {
      const dto: AiQueryDto = {
        sessionId: 1,
        query: 'Track my order',
      };

      const result = await controller.aiQuery(dto);

      expect(result.suggestedActions).toBeDefined();
      expect(result.detectedIntent).toBe('package_tracking');
    });
  });

  // ==================== POST /contacts/sessions/:id/escalate ====================
  describe('POST /contacts/sessions/:id/escalate', () => {
    it('should escalate session', async () => {
      const dto: EscalationRequestDto = {
        sessionId: 0, // Will be overwritten
        reason: 'Complex issue',
      };
      const req = { user: { id: 100 } };

      const result = await controller.escalateSession(1, dto, req);

      expect(result.status).toBe(ChatSessionStatus.ESCALATED);
      expect(dto.sessionId).toBe(1);
      expect(mockContactsService.escalateSession).toHaveBeenCalledWith(dto, 100);
    });

    it('should handle preferred agent', async () => {
      const dto: EscalationRequestDto = {
        sessionId: 0,
        reason: 'Need specialist',
        preferredAgentId: 50,
      };
      const req = { user: { id: 100 } };

      await controller.escalateSession(1, dto, req);

      expect(mockContactsService.escalateSession).toHaveBeenCalled();
    });
  });

  // ==================== POST /contacts/sessions/:id/resolve ====================
  describe('POST /contacts/sessions/:id/resolve', () => {
    it('should resolve session', async () => {
      const result = await controller.resolveSession(1, 'Issue resolved');

      expect(result.status).toBe(ChatSessionStatus.RESOLVED);
      expect(mockContactsService.resolveSession).toHaveBeenCalledWith(1, 'Issue resolved');
    });

    it('should resolve without notes', async () => {
      await controller.resolveSession(1, undefined);

      expect(mockContactsService.resolveSession).toHaveBeenCalledWith(1, undefined);
    });
  });

  // ==================== GET /contacts/stats ====================
  describe('GET /contacts/stats', () => {
    it('should return support statistics', async () => {
      const result = await controller.getStats();

      expect(result).toEqual(mockStats);
      expect(mockContactsService.getStats).toHaveBeenCalledWith(undefined);
    });

    it('should filter by organizationId', async () => {
      await controller.getStats(1);

      expect(mockContactsService.getStats).toHaveBeenCalledWith(1);
    });
  });

  // ==================== POST /contacts/sessions/:id/read ====================
  describe('POST /contacts/sessions/:id/read', () => {
    it('should mark all messages as read', async () => {
      const result = await controller.markRead(1, undefined);

      expect(result.success).toBe(true);
      expect(mockContactsService.markMessagesRead).toHaveBeenCalledWith(1, undefined);
    });

    it('should mark specific messages as read', async () => {
      const result = await controller.markRead(1, [1, 2, 3]);

      expect(result.success).toBe(true);
      expect(mockContactsService.markMessagesRead).toHaveBeenCalledWith(1, [1, 2, 3]);
    });
  });

  // ==================== Error Handling ====================
  describe('Error Handling', () => {
    it('should propagate service errors', async () => {
      mockContactsService.createSession = jest.fn().mockRejectedValue(new Error('Database error'));

      const dto: CreateChatSessionDto = { customerId: 100 };
      const req = { user: { id: 100 } };

      await expect(controller.createSession(dto, req)).rejects.toThrow('Database error');
    });
  });
});
