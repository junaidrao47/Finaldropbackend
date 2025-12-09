import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BlacklistSettingsService } from './blacklist-settings.service';
import { BlacklistType, BlacklistStatus } from './dto/settings-extended.dto';

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
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
  };
}

describe('BlacklistSettingsService', () => {
  let service: BlacklistSettingsService;
  let mockDb: ReturnType<typeof createMockDb>;

  const mockOrganizationId = 'org-1';
  const mockUserId = 'user-1';

  const mockBlacklistEntry = {
    id: 'blacklist-1',
    organizationId: mockOrganizationId,
    type: 'carrier' as BlacklistType,
    entityId: 'entity-1',
    name: 'Blocked Carrier',
    email: 'carrier@example.com',
    phone: '+1234567890',
    reason: 'Fraudulent activity',
    status: 'active' as BlacklistStatus,
    blacklistedAt: new Date('2024-01-15'),
    archivedAt: null,
    expiresAt: null,
    createdBy: mockUserId,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    updatedBy: mockUserId,
    isDeleted: false,
  };

  beforeEach(() => {
    mockDb = createMockDb();
    service = new BlacklistSettingsService(mockDb as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('getBlacklist', () => {
    it('should return paginated blacklist entries with default filters', async () => {
      const mockEntries = [mockBlacklistEntry];
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
                offset: jest.fn().mockResolvedValue(mockEntries),
              }),
            }),
          }),
        }),
      });

      const result = await service.getBlacklist(mockOrganizationId, {});

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should filter by blacklist type', async () => {
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
                offset: jest.fn().mockResolvedValue([mockBlacklistEntry]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getBlacklist(mockOrganizationId, {
        type: BlacklistType.CARRIER,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe('carrier');
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

      const result = await service.getBlacklist(mockOrganizationId, {
        status: BlacklistStatus.ARCHIVED,
      });

      expect(result.data).toHaveLength(0);
    });

    it('should handle search functionality', async () => {
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
                offset: jest.fn().mockResolvedValue([mockBlacklistEntry]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getBlacklist(mockOrganizationId, {
        search: 'Blocked',
      });

      expect(result.data).toHaveLength(1);
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
                offset: jest.fn().mockResolvedValue([mockBlacklistEntry]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getBlacklist(mockOrganizationId, {
        page: 2,
        limit: 10,
      });

      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(5);
    });

    it('should return empty result when no entries match', async () => {
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

      const result = await service.getBlacklist(mockOrganizationId, {});

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('getBlacklistEntry', () => {
    it('should return a single blacklist entry by ID', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockBlacklistEntry]),
        }),
      });

      const result = await service.getBlacklistEntry('blacklist-1', mockOrganizationId);

      expect(result.id).toBe('blacklist-1');
      expect(result.name).toBe('Blocked Carrier');
    });

    it('should throw NotFoundException for non-existent entry', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.getBlacklistEntry('non-existent', mockOrganizationId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addToBlacklist', () => {
    const addDto = {
      type: BlacklistType.CARRIER,
      name: 'New Blocked Entity',
      email: 'new@example.com',
      phone: '+1987654321',
      reason: 'Suspicious behavior',
    };

    it('should add a new entry to blacklist successfully', async () => {
      const createdEntry = { ...mockBlacklistEntry, ...addDto, id: 'new-blacklist-1' };
      
      // Mock check for existing entry
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });
      
      // Mock insert
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdEntry]),
        }),
      });

      const result = await service.addToBlacklist(mockOrganizationId, addDto, mockUserId);

      expect(result.name).toBe('New Blocked Entity');
      expect(result.email).toBe('new@example.com');
    });

    it('should throw BadRequestException if entity already blacklisted', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockBlacklistEntry]),
        }),
      });

      await expect(
        service.addToBlacklist(mockOrganizationId, addDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow adding with expiration date', async () => {
      const dtoWithExpiry = {
        ...addDto,
        expiresAt: '2025-12-31T23:59:59.000Z',
      };
      const createdEntry = {
        ...mockBlacklistEntry,
        ...dtoWithExpiry,
        id: 'blacklist-expiry',
        expiresAt: new Date('2025-12-31'),
      };

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });
      
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdEntry]),
        }),
      });

      const result = await service.addToBlacklist(mockOrganizationId, dtoWithExpiry, mockUserId);

      expect(result.expiresAt).toBeDefined();
    });

    it('should handle different blacklist types', async () => {
      for (const type of [BlacklistType.CARRIER, BlacklistType.SENDER, BlacklistType.RECIPIENT]) {
        const dto = { ...addDto, type };
        const createdEntry = { ...mockBlacklistEntry, type, id: `blacklist-${type}` };

        mockDb.select.mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        });

        mockDb.insert.mockReturnValue({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([createdEntry]),
          }),
        });

        const result = await service.addToBlacklist(mockOrganizationId, dto, mockUserId);
        expect(result.type).toBe(type);
      }
    });
  });

  describe('updateBlacklistEntry', () => {
    const updateDto = {
      name: 'Updated Name',
      reason: 'Updated reason',
    };

    it('should update an existing blacklist entry', async () => {
      const updatedEntry = { ...mockBlacklistEntry, ...updateDto };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockBlacklistEntry]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedEntry]),
          }),
        }),
      });

      const result = await service.updateBlacklistEntry(
        'blacklist-1',
        mockOrganizationId,
        updateDto,
        mockUserId,
      );

      expect(result.name).toBe('Updated Name');
      expect(result.reason).toBe('Updated reason');
    });

    it('should throw NotFoundException when updating non-existent entry', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.updateBlacklistEntry('non-existent', mockOrganizationId, updateDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update expiration date', async () => {
      const dtoWithExpiry = { expiresAt: '2026-06-30T23:59:59.000Z' };
      const updatedEntry = {
        ...mockBlacklistEntry,
        expiresAt: new Date('2026-06-30'),
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockBlacklistEntry]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedEntry]),
          }),
        }),
      });

      const result = await service.updateBlacklistEntry(
        'blacklist-1',
        mockOrganizationId,
        dtoWithExpiry,
        mockUserId,
      );

      expect(result.expiresAt).toBeDefined();
    });
  });

  describe('archiveBlacklistEntry', () => {
    it('should archive an active blacklist entry', async () => {
      const archivedEntry = {
        ...mockBlacklistEntry,
        status: 'archived' as BlacklistStatus,
        archivedAt: new Date(),
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockBlacklistEntry]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([archivedEntry]),
          }),
        }),
      });

      const result = await service.archiveBlacklistEntry(
        'blacklist-1',
        mockOrganizationId,
        mockUserId,
      );

      expect(result.status).toBe('archived');
      expect(result.archivedAt).toBeDefined();
    });

    it('should throw NotFoundException when archiving non-existent entry', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.archiveBlacklistEntry('non-existent', mockOrganizationId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('restoreBlacklistEntry', () => {
    const archivedEntry = {
      ...mockBlacklistEntry,
      status: 'archived' as BlacklistStatus,
      archivedAt: new Date(),
    };

    it('should restore an archived blacklist entry', async () => {
      const restoredEntry = {
        ...mockBlacklistEntry,
        status: 'active' as BlacklistStatus,
        archivedAt: null,
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([archivedEntry]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([restoredEntry]),
          }),
        }),
      });

      const result = await service.restoreBlacklistEntry(
        'blacklist-1',
        mockOrganizationId,
        mockUserId,
      );

      expect(result.status).toBe('active');
    });

    it('should throw NotFoundException when restoring non-existent entry', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.restoreBlacklistEntry('non-existent', mockOrganizationId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeFromBlacklist', () => {
    it('should soft delete a blacklist entry', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockBlacklistEntry]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      await expect(
        service.removeFromBlacklist('blacklist-1', mockOrganizationId, mockUserId),
      ).resolves.toBeUndefined();
    });

    it('should throw NotFoundException when removing non-existent entry', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.removeFromBlacklist('non-existent', mockOrganizationId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('isBlacklisted', () => {
    it('should return true if entity is blacklisted by email', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      const result = await service.isBlacklisted(
        mockOrganizationId,
        BlacklistType.CARRIER,
        { email: 'blocked@example.com' },
      );

      expect(result).toBe(true);
    });

    it('should return true if entity is blacklisted by phone', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      const result = await service.isBlacklisted(
        mockOrganizationId,
        BlacklistType.SENDER,
        { phone: '+1234567890' },
      );

      expect(result).toBe(true);
    });

    it('should return true if entity is blacklisted by entityId', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      const result = await service.isBlacklisted(
        mockOrganizationId,
        BlacklistType.RECIPIENT,
        { entityId: 'entity-123' },
      );

      expect(result).toBe(true);
    });

    it('should return false if entity is not blacklisted', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

      const result = await service.isBlacklisted(
        mockOrganizationId,
        BlacklistType.CARRIER,
        { email: 'safe@example.com' },
      );

      expect(result).toBe(false);
    });

    it('should return false if no identifier provided', async () => {
      const result = await service.isBlacklisted(
        mockOrganizationId,
        BlacklistType.CARRIER,
        {},
      );

      expect(result).toBe(false);
    });
  });

  describe('getBlacklistStats', () => {
    it('should return blacklist statistics', async () => {
      // Mock active count
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 10 }]),
        }),
      });

      // Mock archived count
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 5 }]),
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

      const result = await service.getBlacklistStats(mockOrganizationId);

      expect(result.active).toBe(10);
      expect(result.archived).toBe(5);
      expect(result.total).toBe(15);
      expect(result.byType).toBeDefined();
    });

    it('should return zero counts when no entries exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

      const result = await service.getBlacklistStats(mockOrganizationId);

      expect(result.total).toBe(0);
      expect(result.active).toBe(0);
      expect(result.archived).toBe(0);
    });
  });

  describe('Response Mapping', () => {
    it('should correctly map database record to response DTO', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockBlacklistEntry]),
        }),
      });

      const result = await service.getBlacklistEntry('blacklist-1', mockOrganizationId);

      expect(result).toMatchObject({
        id: mockBlacklistEntry.id,
        type: mockBlacklistEntry.type,
        name: mockBlacklistEntry.name,
        email: mockBlacklistEntry.email,
        phone: mockBlacklistEntry.phone,
        reason: mockBlacklistEntry.reason,
        status: mockBlacklistEntry.status,
      });
    });

    it('should handle null values correctly in response', async () => {
      const entryWithNulls = {
        ...mockBlacklistEntry,
        entityId: null,
        email: null,
        phone: null,
        reason: null,
        archivedAt: null,
        expiresAt: null,
        createdBy: null,
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([entryWithNulls]),
        }),
      });

      const result = await service.getBlacklistEntry('blacklist-1', mockOrganizationId);

      expect(result.entityId).toBeUndefined();
      expect(result.email).toBeUndefined();
      expect(result.phone).toBeUndefined();
    });
  });
});
