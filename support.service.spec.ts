import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SupportService } from './src/settings/support.service';
import { TicketCategory, TicketPriority, TicketStatus } from './src/settings/dto/settings-extended.dto';

// Create mock db helper
function createMockDb() {
  return {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  };
}

describe('SupportService', () => {
  let service: SupportService;
  let mockDb: ReturnType<typeof createMockDb>;

  const mockUserId = 'user-1';
  const mockOrganizationId = 'org-1';

  const mockTicket = {
    id: 'ticket-1',
    userId: mockUserId,
    organizationId: mockOrganizationId,
    ticketNumber: 'TKT-ABC123-XYZ',
    category: 'technical' as TicketCategory,
    subject: 'App crashing on startup',
    description: 'The app crashes whenever I try to open it on my iPhone.',
    priority: 'high' as TicketPriority,
    status: 'open' as TicketStatus,
    assignedTo: null,
    attachments: null,
    resolvedAt: null,
    closedAt: null,
    createdBy: mockUserId,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    updatedBy: mockUserId,
    isDeleted: false,
  };

  const mockMessage = {
    id: 'msg-1',
    ticketId: 'ticket-1',
    senderId: mockUserId,
    message: 'Please provide more details about the crash.',
    isInternal: false,
    attachments: null,
    createdAt: new Date('2024-01-15T10:00:00'),
    isDeleted: false,
  };

  const mockRating = {
    id: 'rating-1',
    userId: mockUserId,
    organizationId: mockOrganizationId,
    rating: 5,
    feedback: 'Great app, very useful!',
    platform: 'ios',
    appVersion: '1.0.0',
    wouldRecommend: true,
    createdAt: new Date('2024-01-15'),
  };

  beforeEach(() => {
    mockDb = createMockDb();
    service = new SupportService(mockDb as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ==================== Support Tickets ====================

  describe('getTickets', () => {
    it('should return paginated tickets for user', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([mockTicket]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getTickets(mockUserId, {});

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter tickets by category', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([mockTicket]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getTickets(mockUserId, {
        category: TicketCategory.TECHNICAL,
      });

      expect(result.data).toHaveLength(1);
    });

    it('should filter tickets by status', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([mockTicket]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getTickets(mockUserId, {
        status: TicketStatus.OPEN,
      });

      expect(result.data).toHaveLength(1);
    });

    it('should filter tickets by priority', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([mockTicket]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getTickets(mockUserId, {
        priority: TicketPriority.HIGH,
      });

      expect(result.data).toHaveLength(1);
    });

    it('should allow admin to see all tickets', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 5 }]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([mockTicket]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getTickets(mockUserId, {}, true);

      expect(result.meta.total).toBe(5);
    });

    it('should return empty result when no tickets exist', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getTickets(mockUserId, {});

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('getTicket', () => {
    it('should return a single ticket by ID with messages', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockTicket]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockMessage]),
          }),
        }),
      });

      const result = await service.getTicket('ticket-1', mockUserId);

      expect(result.id).toBe('ticket-1');
      expect(result.ticketNumber).toBe('TKT-ABC123-XYZ');
      expect(result.messages).toHaveLength(1);
    });

    it('should throw NotFoundException for non-existent ticket', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.getTicket('non-existent', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow admin to access any ticket', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockTicket]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockMessage]),
          }),
        }),
      });

      const result = await service.getTicket('ticket-1', 'other-user', true);

      expect(result.id).toBe('ticket-1');
    });
  });

  describe('createTicket', () => {
    const createDto = {
      category: TicketCategory.TECHNICAL,
      subject: 'New Issue',
      description: 'Description of the issue',
      priority: TicketPriority.HIGH,
    };

    it('should create a new support ticket', async () => {
      const createdTicket = { ...mockTicket, ...createDto };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdTicket]),
        }),
      });

      const result = await service.createTicket(mockUserId, createDto, mockOrganizationId);

      expect(result.subject).toBe('New Issue');
      expect(result.category).toBe('technical');
    });

    it('should set default priority to MEDIUM if not provided', async () => {
      const dtoNoPriority = {
        category: TicketCategory.OTHER,
        subject: 'General Question',
        description: 'Just a question',
      };
      const createdTicket = { ...mockTicket, ...dtoNoPriority, priority: 'medium' };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdTicket]),
        }),
      });

      const result = await service.createTicket(mockUserId, dtoNoPriority, mockOrganizationId);

      expect(result.priority).toBe('medium');
    });

    it('should handle attachments', async () => {
      const dtoWithAttachments = {
        ...createDto,
        attachments: ['file1.png', 'file2.pdf'],
      };
      const createdTicket = {
        ...mockTicket,
        ...dtoWithAttachments,
        attachments: JSON.stringify(['file1.png', 'file2.pdf']),
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdTicket]),
        }),
      });

      const result = await service.createTicket(mockUserId, dtoWithAttachments, mockOrganizationId);

      expect(result.attachments).toEqual(['file1.png', 'file2.pdf']);
    });

    it('should set initial status to OPEN', async () => {
      const createdTicket = { ...mockTicket, ...createDto, status: 'open' };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdTicket]),
        }),
      });

      const result = await service.createTicket(mockUserId, createDto);

      expect(result.status).toBe('open');
    });
  });

  describe('updateTicket', () => {
    const updateDto = {
      status: TicketStatus.IN_PROGRESS,
      assignedTo: 'agent-1',
    };

    it('should update ticket status', async () => {
      const updatedTicket = { ...mockTicket, ...updateDto };

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockTicket]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedTicket]),
          }),
        }),
      });

      const result = await service.updateTicket('ticket-1', updateDto, mockUserId);

      expect(result.status).toBe('in_progress');
      expect(result.assignedTo).toBe('agent-1');
    });

    it('should set resolvedAt when status is RESOLVED', async () => {
      const resolvedTicket = {
        ...mockTicket,
        status: 'resolved',
        resolvedAt: new Date(),
      };

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockTicket]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([resolvedTicket]),
          }),
        }),
      });

      const result = await service.updateTicket(
        'ticket-1',
        { status: TicketStatus.RESOLVED },
        mockUserId,
      );

      expect(result.status).toBe('resolved');
      expect(result.resolvedAt).toBeDefined();
    });

    it('should set closedAt when status is CLOSED', async () => {
      const closedTicket = {
        ...mockTicket,
        status: 'closed',
        closedAt: new Date(),
      };

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockTicket]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([closedTicket]),
          }),
        }),
      });

      const result = await service.updateTicket(
        'ticket-1',
        { status: TicketStatus.CLOSED },
        mockUserId,
      );

      expect(result.status).toBe('closed');
      expect(result.closedAt).toBeDefined();
    });
  });

  describe('addMessage', () => {
    const messageDto = {
      message: 'Here is my reply',
    };

    it('should add a message to ticket', async () => {
      const createdMessage = { ...mockMessage, message: 'Here is my reply' };

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockTicket]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdMessage]),
        }),
      });
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await service.addMessage('ticket-1', messageDto, mockUserId);

      expect(result.message).toBe('Here is my reply');
    });

    it('should support internal messages for admin', async () => {
      const internalMessage = {
        ...mockMessage,
        message: 'Internal note',
        isInternal: true,
      };

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockTicket]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([internalMessage]),
        }),
      });

      const result = await service.addMessage(
        'ticket-1',
        { message: 'Internal note', isInternal: true },
        mockUserId,
        true,
      );

      expect(result.isInternal).toBe(true);
    });

    it('should throw NotFoundException if ticket does not exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.addMessage('non-existent', messageDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('closeTicket', () => {
    it('should close a ticket', async () => {
      const closedTicket = {
        ...mockTicket,
        status: 'closed',
        closedAt: new Date(),
      };

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockTicket]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([closedTicket]),
          }),
        }),
      });

      const result = await service.closeTicket('ticket-1', mockUserId);

      expect(result.status).toBe('closed');
      expect(result.closedAt).toBeDefined();
    });

    it('should throw NotFoundException for non-existent ticket', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.closeTicket('non-existent', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTicketStats', () => {
    it('should return ticket statistics', async () => {
      // Mock status counts (open, in_progress, resolved, closed)
      for (let i = 0; i < 4; i++) {
        mockDb.select.mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: i + 1 }]),
          }),
        });
      }

      // Mock category counts
      for (let i = 0; i < 5; i++) {
        mockDb.select.mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: i + 1 }]),
          }),
        });
      }

      const result = await service.getTicketStats();

      expect(result.open).toBe(1);
      expect(result.inProgress).toBe(2);
      expect(result.resolved).toBe(3);
      expect(result.closed).toBe(4);
      expect(result.total).toBe(10);
      expect(result.byCategory).toBeDefined();
    });
  });

  // ==================== App Ratings ====================

  describe('submitRating', () => {
    const ratingDto = {
      rating: 5,
      feedback: 'Excellent app!',
      platform: 'ios',
      appVersion: '1.0.0',
      wouldRecommend: true,
    };

    it('should submit a new rating', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockRating]),
        }),
      });

      const result = await service.submitRating(mockUserId, ratingDto, mockOrganizationId);

      expect(result.rating).toBe(5);
      expect(result.feedback).toBe('Great app, very useful!');
    });

    it('should throw BadRequestException if user already rated on same platform', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockRating]),
        }),
      });

      await expect(
        service.submitRating(mockUserId, ratingDto, mockOrganizationId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow rating without platform', async () => {
      const ratingNoPlatform = { rating: 4, feedback: 'Good!' };
      const createdRating = { ...mockRating, ...ratingNoPlatform, platform: null };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdRating]),
        }),
      });

      const result = await service.submitRating(mockUserId, ratingNoPlatform);

      expect(result.rating).toBe(4);
    });

    it('should handle rating without feedback', async () => {
      const ratingNoFeedback = { rating: 5 };
      const createdRating = { ...mockRating, feedback: null };

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdRating]),
        }),
      });

      const result = await service.submitRating(mockUserId, { ...ratingNoFeedback, platform: 'android' });

      expect(result.rating).toBe(5);
    });
  });

  describe('getRatingStats', () => {
    it('should return rating statistics', async () => {
      // Mock total count (no where clause)
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockResolvedValue([{ count: 100 }]),
      });

      // Mock distribution counts (1-5)
      for (let i = 1; i <= 5; i++) {
        mockDb.select.mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: i * 10 }]),
          }),
        });
      }

      // Mock recommend count
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 80 }]),
        }),
      });

      const result = await service.getRatingStats();

      expect(result.totalRatings).toBe(100);
      expect(result.ratingDistribution).toBeDefined();
      expect(result.recommendRate).toBe(80);
    });

    it('should return zero stats when no ratings exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockResolvedValue([{ count: 0 }]),
      });

      const result = await service.getRatingStats();

      expect(result.totalRatings).toBe(0);
      expect(result.averageRating).toBe(0);
      expect(result.recommendRate).toBe(0);
    });
  });

  describe('getUserRating', () => {
    it('should return user rating', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockRating]),
            }),
          }),
        }),
      });

      const result = await service.getUserRating(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.rating).toBe(5);
    });

    it('should return null if user has no rating', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      const result = await service.getUserRating(mockUserId);

      expect(result).toBeNull();
    });
  });

  // ==================== Help & Support Content ====================

  describe('getFaqCategories', () => {
    it('should return FAQ categories', () => {
      const categories = service.getFaqCategories();

      expect(categories).toHaveLength(6);
      expect(categories[0]).toHaveProperty('id');
      expect(categories[0]).toHaveProperty('name');
      expect(categories[0]).toHaveProperty('icon');
    });
  });

  describe('getFaqs', () => {
    it('should return all FAQs', () => {
      const faqs = service.getFaqs();

      expect(faqs.length).toBeGreaterThan(0);
    });

    it('should filter FAQs by category', () => {
      const faqs = service.getFaqs('packages');

      expect(faqs.length).toBeGreaterThan(0);
      expect(faqs.every((f) => f.category === 'packages')).toBe(true);
    });

    it('should return empty array for non-existent category', () => {
      const faqs = service.getFaqs('non-existent');

      expect(faqs).toHaveLength(0);
    });
  });

  describe('getSupportContactInfo', () => {
    it('should return support contact information', () => {
      const info = service.getSupportContactInfo();

      expect(info).toHaveProperty('email');
      expect(info).toHaveProperty('phone');
      expect(info).toHaveProperty('hours');
      expect(info).toHaveProperty('liveChat');
    });
  });

  // ==================== Response Mapping ====================

  describe('Response Mapping', () => {
    it('should correctly map ticket to response', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockTicket]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getTicket('ticket-1', mockUserId);

      expect(result).toMatchObject({
        id: mockTicket.id,
        ticketNumber: mockTicket.ticketNumber,
        category: mockTicket.category,
        subject: mockTicket.subject,
        description: mockTicket.description,
        priority: mockTicket.priority,
        status: mockTicket.status,
      });
    });

    it('should handle null values in ticket response', async () => {
      const ticketWithNulls = {
        ...mockTicket,
        assignedTo: null,
        attachments: null,
        resolvedAt: null,
        closedAt: null,
      };

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([ticketWithNulls]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getTicket('ticket-1', mockUserId);

      expect(result.assignedTo).toBeUndefined();
      expect(result.attachments).toBeUndefined();
      expect(result.resolvedAt).toBeUndefined();
      expect(result.closedAt).toBeUndefined();
    });
  });
});
