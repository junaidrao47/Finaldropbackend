import { NotFoundException } from '@nestjs/common';
import { WarningMessagesService } from './src/settings/warning-messages.service';
import { ContactType, WarningSeverity, WarningStatus } from './src/settings/dto/settings-extended.dto';

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

describe('WarningMessagesService', () => {
  let service: WarningMessagesService;
  let mockDb: ReturnType<typeof createMockDb>;

  const mockOrganizationId = 'org-1';
  const mockUserId = 'user-1';

  const mockWarningMessage = {
    id: 'warning-1',
    organizationId: mockOrganizationId,
    type: 'carrier' as ContactType,
    title: 'Insurance Required',
    message: 'Please ensure carrier has valid insurance before booking.',
    severity: 'warning' as WarningSeverity,
    status: 'active' as WarningStatus,
    displayOrder: 1,
    archivedAt: null,
    createdBy: mockUserId,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    updatedBy: mockUserId,
    isDeleted: false,
  };

  beforeEach(() => {
    mockDb = createMockDb();
    service = new WarningMessagesService(mockDb as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('getWarningMessages', () => {
    it('should return paginated warning messages with default filters', async () => {
      const mockMessages = [mockWarningMessage];
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
                offset: jest.fn().mockResolvedValue(mockMessages),
              }),
            }),
          }),
        }),
      });

      const result = await service.getWarningMessages(mockOrganizationId, {});

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should filter by type', async () => {
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
                offset: jest.fn().mockResolvedValue([mockWarningMessage]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getWarningMessages(mockOrganizationId, {
        type: ContactType.CARRIER,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe('carrier');
    });

    it('should filter by severity', async () => {
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
                offset: jest.fn().mockResolvedValue([mockWarningMessage]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getWarningMessages(mockOrganizationId, {
        severity: WarningSeverity.WARNING,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].severity).toBe('warning');
    });

    it('should filter by status (active/archived)', async () => {
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

      const result = await service.getWarningMessages(mockOrganizationId, {
        status: WarningStatus.ARCHIVED,
      });

      expect(result.data).toHaveLength(0);
    });

    it('should handle pagination correctly', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 50 }]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([mockWarningMessage]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getWarningMessages(mockOrganizationId, {
        page: 3,
        limit: 10,
      });

      expect(result.meta.page).toBe(3);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(5);
    });

    it('should return empty result when no messages exist', async () => {
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

      const result = await service.getWarningMessages(mockOrganizationId, {});

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('getWarningMessage', () => {
    it('should return a single warning message by ID', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockWarningMessage]),
        }),
      });

      const result = await service.getWarningMessage('warning-1', mockOrganizationId);

      expect(result.id).toBe('warning-1');
      expect(result.title).toBe('Insurance Required');
    });

    it('should throw NotFoundException for non-existent message', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.getWarningMessage('non-existent', mockOrganizationId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getActiveWarningsForType', () => {
    it('should return active warnings for a specific type', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockWarningMessage]),
          }),
        }),
      });

      const result = await service.getActiveWarningsForType(
        mockOrganizationId,
        ContactType.CARRIER,
      );

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('carrier');
    });

    it('should return empty array when no warnings for type', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getActiveWarningsForType(
        mockOrganizationId,
        ContactType.SENDER,
      );

      expect(result).toHaveLength(0);
    });

    it('should return warnings ordered by displayOrder', async () => {
      const orderedMessages = [
        { ...mockWarningMessage, id: 'w1', displayOrder: 1 },
        { ...mockWarningMessage, id: 'w2', displayOrder: 2 },
        { ...mockWarningMessage, id: 'w3', displayOrder: 3 },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(orderedMessages),
          }),
        }),
      });

      const result = await service.getActiveWarningsForType(
        mockOrganizationId,
        ContactType.CARRIER,
      );

      expect(result[0].displayOrder).toBe(1);
      expect(result[1].displayOrder).toBe(2);
      expect(result[2].displayOrder).toBe(3);
    });
  });

  describe('createWarningMessage', () => {
    const createDto = {
      type: ContactType.CARRIER,
      title: 'New Warning',
      message: 'This is a new warning message',
      severity: WarningSeverity.WARNING,
    };

    it('should create a new warning message successfully', async () => {
      const createdMessage = { ...mockWarningMessage, ...createDto, id: 'new-warning-1' };

      // Mock get max display order
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ maxOrder: 5 }]),
            }),
          }),
        }),
      });

      // Mock insert
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdMessage]),
        }),
      });

      const result = await service.createWarningMessage(mockOrganizationId, createDto, mockUserId);

      expect(result.title).toBe('New Warning');
      expect(result.type).toBe('Carrier');
    });

    it('should auto-calculate displayOrder when not provided', async () => {
      const createdMessage = { ...mockWarningMessage, displayOrder: 6 };

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ maxOrder: 5 }]),
            }),
          }),
        }),
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdMessage]),
        }),
      });

      const result = await service.createWarningMessage(mockOrganizationId, createDto, mockUserId);

      expect(result.displayOrder).toBe(6);
    });

    it('should use provided displayOrder when specified', async () => {
      const dtoWithOrder = { ...createDto, displayOrder: 10 };
      const createdMessage = { ...mockWarningMessage, ...dtoWithOrder };

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ maxOrder: 5 }]),
            }),
          }),
        }),
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdMessage]),
        }),
      });

      const result = await service.createWarningMessage(mockOrganizationId, dtoWithOrder, mockUserId);

      expect(result.displayOrder).toBe(10);
    });

    it('should default severity to WARNING if not provided', async () => {
      const dtoNoSeverity = {
        type: ContactType.CARRIER,
        title: 'No Severity Warning',
        message: 'Warning without severity',
      };
      const createdMessage = { ...mockWarningMessage, ...dtoNoSeverity, severity: 'warning' };

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ maxOrder: 0 }]),
            }),
          }),
        }),
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdMessage]),
        }),
      });

      const result = await service.createWarningMessage(
        mockOrganizationId,
        dtoNoSeverity,
        mockUserId,
      );

      expect(result.severity).toBe('warning');
    });

    it('should handle all severity levels', async () => {
      for (const severity of [WarningSeverity.INFO, WarningSeverity.WARNING, WarningSeverity.CRITICAL]) {
        const dto = { ...createDto, severity };
        const createdMessage = { ...mockWarningMessage, severity };

        mockDb.select.mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([{ maxOrder: 0 }]),
              }),
            }),
          }),
        });

        mockDb.insert.mockReturnValue({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([createdMessage]),
          }),
        });

        const result = await service.createWarningMessage(mockOrganizationId, dto, mockUserId);
        expect(result.severity).toBe(severity);
      }
    });
  });

  describe('updateWarningMessage', () => {
    const updateDto = {
      title: 'Updated Warning Title',
      message: 'Updated message content',
    };

    it('should update an existing warning message', async () => {
      const updatedMessage = { ...mockWarningMessage, ...updateDto };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockWarningMessage]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedMessage]),
          }),
        }),
      });

      const result = await service.updateWarningMessage(
        'warning-1',
        mockOrganizationId,
        updateDto,
        mockUserId,
      );

      expect(result.title).toBe('Updated Warning Title');
      expect(result.message).toBe('Updated message content');
    });

    it('should throw NotFoundException when updating non-existent message', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.updateWarningMessage('non-existent', mockOrganizationId, updateDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update severity', async () => {
      const severityUpdate = { severity: WarningSeverity.CRITICAL };
      const updatedMessage = { ...mockWarningMessage, severity: 'critical' };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockWarningMessage]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedMessage]),
          }),
        }),
      });

      const result = await service.updateWarningMessage(
        'warning-1',
        mockOrganizationId,
        severityUpdate,
        mockUserId,
      );

      expect(result.severity).toBe('critical');
    });

    it('should update displayOrder', async () => {
      const orderUpdate = { displayOrder: 5 };
      const updatedMessage = { ...mockWarningMessage, displayOrder: 5 };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockWarningMessage]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedMessage]),
          }),
        }),
      });

      const result = await service.updateWarningMessage(
        'warning-1',
        mockOrganizationId,
        orderUpdate,
        mockUserId,
      );

      expect(result.displayOrder).toBe(5);
    });
  });

  describe('archiveWarningMessage', () => {
    it('should archive an active warning message', async () => {
      const archivedMessage = {
        ...mockWarningMessage,
        status: 'archived' as WarningStatus,
        archivedAt: new Date(),
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockWarningMessage]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([archivedMessage]),
          }),
        }),
      });

      const result = await service.archiveWarningMessage(
        'warning-1',
        mockOrganizationId,
        mockUserId,
      );

      expect(result.status).toBe('archived');
      expect(result.archivedAt).toBeDefined();
    });

    it('should throw NotFoundException when archiving non-existent message', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.archiveWarningMessage('non-existent', mockOrganizationId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('restoreWarningMessage', () => {
    const archivedMessage = {
      ...mockWarningMessage,
      status: 'archived' as WarningStatus,
      archivedAt: new Date(),
    };

    it('should restore an archived warning message', async () => {
      const restoredMessage = {
        ...mockWarningMessage,
        status: 'active' as WarningStatus,
        archivedAt: null,
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([archivedMessage]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([restoredMessage]),
          }),
        }),
      });

      const result = await service.restoreWarningMessage(
        'warning-1',
        mockOrganizationId,
        mockUserId,
      );

      expect(result.status).toBe('active');
    });

    it('should throw NotFoundException when restoring non-existent message', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.restoreWarningMessage('non-existent', mockOrganizationId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteWarningMessage', () => {
    it('should soft delete a warning message', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockWarningMessage]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      await expect(
        service.deleteWarningMessage('warning-1', mockOrganizationId, mockUserId),
      ).resolves.toBeUndefined();
    });

    it('should throw NotFoundException when deleting non-existent message', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.deleteWarningMessage('non-existent', mockOrganizationId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorderWarningMessages', () => {
    it('should reorder warning messages successfully', async () => {
      const orderedIds = ['warning-3', 'warning-1', 'warning-2'];

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      await expect(
        service.reorderWarningMessages(mockOrganizationId, orderedIds, mockUserId),
      ).resolves.toBeUndefined();
    });

    it('should update displayOrder based on array position', async () => {
      const orderedIds = ['w1', 'w2', 'w3'];
      const updateCalls: any[] = [];

      mockDb.update.mockImplementation(() => ({
        set: jest.fn().mockImplementation((data) => {
          updateCalls.push(data);
          return {
            where: jest.fn().mockResolvedValue(undefined),
          };
        }),
      }));

      await service.reorderWarningMessages(mockOrganizationId, orderedIds, mockUserId);

      expect(updateCalls.length).toBe(3);
      expect(updateCalls[0].displayOrder).toBe(1);
      expect(updateCalls[1].displayOrder).toBe(2);
      expect(updateCalls[2].displayOrder).toBe(3);
    });

    it('should handle empty array', async () => {
      await expect(
        service.reorderWarningMessages(mockOrganizationId, [], mockUserId),
      ).resolves.toBeUndefined();
    });
  });

  describe('getWarningMessageStats', () => {
    it('should return warning message statistics', async () => {
      // Mock active count
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 10 }]),
        }),
      });

      // Mock archived count
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 3 }]),
        }),
      });

      // Mock by type counts (carrier, sender, recipient)
      for (let i = 0; i < 3; i++) {
        mockDb.select.mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: i + 2 }]),
          }),
        });
      }

      // Mock by severity counts (info, warning, error)
      for (let i = 0; i < 3; i++) {
        mockDb.select.mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: i + 1 }]),
          }),
        });
      }

      const result = await service.getWarningMessageStats(mockOrganizationId);

      expect(result.active).toBe(10);
      expect(result.archived).toBe(3);
      expect(result.total).toBe(13);
      expect(result.byType).toBeDefined();
      expect(result.bySeverity).toBeDefined();
    });

    it('should return zero counts when no messages exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

      const result = await service.getWarningMessageStats(mockOrganizationId);

      expect(result.total).toBe(0);
      expect(result.active).toBe(0);
      expect(result.archived).toBe(0);
    });
  });

  describe('Response Mapping', () => {
    it('should correctly map database record to response DTO', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockWarningMessage]),
        }),
      });

      const result = await service.getWarningMessage('warning-1', mockOrganizationId);

      expect(result).toMatchObject({
        id: mockWarningMessage.id,
        type: mockWarningMessage.type,
        title: mockWarningMessage.title,
        message: mockWarningMessage.message,
        severity: mockWarningMessage.severity,
        status: mockWarningMessage.status,
        displayOrder: mockWarningMessage.displayOrder,
      });
    });

    it('should handle null archivedAt correctly', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockWarningMessage]),
        }),
      });

      const result = await service.getWarningMessage('warning-1', mockOrganizationId);

      expect(result.archivedAt).toBeUndefined();
    });

    it('should handle null displayOrder with default', async () => {
      const messageNoOrder = { ...mockWarningMessage, displayOrder: null };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([messageNoOrder]),
        }),
      });

      const result = await service.getWarningMessage('warning-1', mockOrganizationId);

      expect(result.displayOrder).toBe(0);
    });
  });
});
