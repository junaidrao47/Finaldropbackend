import { CarriersService } from './carriers.service';
import { CreateCarrierDto, UpdateCarrierDto, CarrierFilterDto } from './dto/carrier.dto';
import { NotFoundException } from '@nestjs/common';

// Mock drizzle-orm functions
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a, b) => ({ type: 'eq', a, b })),
  and: jest.fn((...conditions) => ({ type: 'and', conditions })),
  or: jest.fn((...conditions) => ({ type: 'or', conditions })),
  desc: jest.fn((col) => ({ type: 'desc', col })),
  ilike: jest.fn((a, b) => ({ type: 'ilike', a, b })),
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
    leftJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    returning: jest.fn(),
  };
  return mockChain;
};

describe('CarriersService', () => {
  let service: CarriersService;
  let mockDb: ReturnType<typeof createMockDb>;

  const mockCarrier = {
    id: 'carrier-123',
    isBusiness: false,
    firstName: 'John',
    lastName: 'Doe',
    businessName: null,
    legalName: null,
    email: 'john@example.com',
    phoneNumber: '+1234567890',
    mobileNumber: '+1234567891',
    whatsAppNumber: null,
    differentWhatsAppNumber: false,
    billingEmail: null,
    differentBillingEmail: false,
    profileImage: null,
    statusId: 'status-1',
    accountHolderId: null,
    isDeleted: false,
    createdAt: new Date(),
    createdBy: 'user-1',
    updatedAt: new Date(),
    updatedBy: 'user-1',
  };

  const mockBusinessCarrier = {
    ...mockCarrier,
    id: 'carrier-456',
    isBusiness: true,
    firstName: null,
    lastName: null,
    businessName: 'Acme Delivery Inc',
    legalName: 'Acme Delivery Inc LLC',
  };

  beforeEach(() => {
    mockDb = createMockDb();
    service = new CarriersService(mockDb as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ==================== create ====================
  describe('create', () => {
    it('should create a new carrier', async () => {
      const dto: CreateCarrierDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
      };
      mockDb.returning.mockResolvedValue([mockCarrier]);

      const result = await service.create(dto, 'user-1');

      expect(result).toEqual(mockCarrier);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalled();
    });

    it('should create a business carrier', async () => {
      const dto: CreateCarrierDto = {
        isBusiness: true,
        businessName: 'Acme Delivery Inc',
        legalName: 'Acme Delivery Inc LLC',
        email: 'contact@acme.com',
      };
      mockDb.returning.mockResolvedValue([mockBusinessCarrier]);

      const result = await service.create(dto, 'user-1');

      expect(result.isBusiness).toBe(true);
      expect(result.businessName).toBe('Acme Delivery Inc');
    });

    it('should set default values for optional fields', async () => {
      const dto: CreateCarrierDto = {
        firstName: 'Jane',
        lastName: 'Smith',
      };
      mockDb.returning.mockResolvedValue([{ ...mockCarrier, firstName: 'Jane', lastName: 'Smith' }]);

      const result = await service.create(dto, 'user-1');

      expect(result).toBeDefined();
      expect(mockDb.values).toHaveBeenCalled();
    });

    it('should handle all carrier fields', async () => {
      const dto: CreateCarrierDto = {
        isBusiness: true,
        firstName: 'John',
        lastName: 'Doe',
        businessName: 'Test Co',
        legalName: 'Test Company LLC',
        dateOfBirthBusinessSince: '2020-01-01',
        federalTaxId: '12-3456789',
        stateTaxId: 'ST-123',
        phoneNumber: '+1234567890',
        mobileNumber: '+1234567891',
        differentWhatsAppNumber: true,
        whatsAppNumber: '+1234567892',
        email: 'test@example.com',
        differentBillingEmail: true,
        billingEmail: 'billing@example.com',
        additionalInformation: 'Test info',
        profileImage: 'https://example.com/image.jpg',
        statusId: 'status-1',
        accountHolderId: 'holder-1',
      };
      mockDb.returning.mockResolvedValue([{ ...mockCarrier, ...dto }]);

      const result = await service.create(dto, 'user-1');

      expect(result).toBeDefined();
    });
  });

  // ==================== findById ====================
  describe('findById', () => {
    it('should find carrier by ID', async () => {
      mockDb.limit.mockResolvedValue([mockCarrier]);

      const result = await service.findById('carrier-123');

      expect(result).toEqual(mockCarrier);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should throw NotFoundException when carrier not found', async () => {
      mockDb.limit.mockResolvedValue([]);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should not return deleted carriers', async () => {
      mockDb.limit.mockResolvedValue([]);

      await expect(service.findById('deleted-carrier')).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== findByEmail ====================
  describe('findByEmail', () => {
    it('should find carrier by email', async () => {
      mockDb.limit.mockResolvedValue([mockCarrier]);

      const result = await service.findByEmail('john@example.com');

      expect(result).toEqual(mockCarrier);
    });

    it('should return null when carrier not found', async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  // ==================== findAll ====================
  describe('findAll', () => {
    const mockCarriers = [mockCarrier, mockBusinessCarrier];

    it('should return paginated carriers', async () => {
      // First chain for count, returns array that can be destructured
      mockDb.where.mockResolvedValueOnce([{ count: 2 }]);
      // Second chain for data: where -> orderBy -> limit -> offset
      mockDb.where.mockReturnValueOnce({
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue(mockCarriers),
          }),
        }),
      });

      const filter: CarrierFilterDto = { page: 1, limit: 10 };
      const result = await service.findAll(filter);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by isBusiness', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.where.mockReturnValueOnce({
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue([mockBusinessCarrier]),
          }),
        }),
      });

      const filter: CarrierFilterDto = { isBusiness: true };
      const result = await service.findAll(filter);

      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should filter by statusId', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 2 }]);
      mockDb.where.mockReturnValueOnce({
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue(mockCarriers),
          }),
        }),
      });

      const filter: CarrierFilterDto = { statusId: 'status-1' };
      await service.findAll(filter);

      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should filter by search term', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 2 }]);
      mockDb.where.mockReturnValueOnce({
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue(mockCarriers),
          }),
        }),
      });

      const filter: CarrierFilterDto = { search: 'John' };
      await service.findAll(filter);

      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should use default pagination', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 2 }]);
      mockDb.where.mockReturnValueOnce({
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue(mockCarriers),
          }),
        }),
      });

      const filter: CarrierFilterDto = {};
      await service.findAll(filter);

      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should filter by isDeleted', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 2 }]);
      mockDb.where.mockReturnValueOnce({
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue(mockCarriers),
          }),
        }),
      });

      const filter: CarrierFilterDto = { isDeleted: true };
      await service.findAll(filter);

      expect(mockDb.where).toHaveBeenCalled();
    });
  });

  // ==================== update ====================
  describe('update', () => {
    beforeEach(() => {
      mockDb.limit.mockResolvedValue([mockCarrier]);
      mockDb.returning.mockResolvedValue([{ ...mockCarrier, firstName: 'Jane' }]);
    });

    it('should update carrier', async () => {
      const dto: UpdateCarrierDto = { firstName: 'Jane' };

      const result = await service.update('carrier-123', dto, 'user-1');

      expect(result.firstName).toBe('Jane');
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when carrier not found', async () => {
      mockDb.limit.mockResolvedValue([]);

      await expect(service.update('nonexistent', {}, 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should update multiple fields', async () => {
      const dto: UpdateCarrierDto = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phoneNumber: '+9876543210',
      };
      mockDb.returning.mockResolvedValue([{ ...mockCarrier, ...dto }]);

      const result = await service.update('carrier-123', dto, 'user-1');

      expect(result).toBeDefined();
    });

    it('should update isBusiness flag', async () => {
      const dto: UpdateCarrierDto = { isBusiness: true, businessName: 'New Business' };
      mockDb.returning.mockResolvedValue([{ ...mockCarrier, ...dto }]);

      const result = await service.update('carrier-123', dto, 'user-1');

      expect(result.isBusiness).toBe(true);
    });

    it('should update isDeleted flag', async () => {
      const dto: UpdateCarrierDto = { isDeleted: true };
      mockDb.returning.mockResolvedValue([{ ...mockCarrier, isDeleted: true }]);

      const result = await service.update('carrier-123', dto, 'user-1');

      expect(result.isDeleted).toBe(true);
    });
  });

  // ==================== remove ====================
  describe('remove', () => {
    beforeEach(() => {
      mockDb.limit.mockResolvedValue([mockCarrier]);
      mockDb.returning.mockResolvedValue([{ ...mockCarrier, isDeleted: true }]);
    });

    it('should soft delete carrier', async () => {
      await service.remove('carrier-123', 'user-1');

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalled();
    });

    it('should throw NotFoundException when carrier not found', async () => {
      mockDb.limit.mockResolvedValue([]);

      await expect(service.remove('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== restore ====================
  describe('restore', () => {
    beforeEach(() => {
      mockDb.limit.mockResolvedValue([{ ...mockCarrier, isDeleted: true }]);
      mockDb.returning.mockResolvedValue([mockCarrier]);
    });

    it('should restore soft-deleted carrier', async () => {
      const result = await service.restore('carrier-123', 'user-1');

      expect(result.isDeleted).toBe(false);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when carrier not found', async () => {
      mockDb.limit.mockResolvedValue([]);

      await expect(service.restore('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== hardDelete ====================
  describe('hardDelete', () => {
    it('should permanently delete carrier', async () => {
      mockDb.where.mockResolvedValue([]);

      await service.hardDelete('carrier-123');

      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  // ==================== getStats ====================
  describe('getStats', () => {
    it('should return carrier statistics', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 10 }]);
      mockDb.where.mockResolvedValueOnce([{ count: 3 }]);

      const result = await service.getStats();

      expect(result.total).toBe(10);
      expect(result.businesses).toBe(3);
      expect(result.individuals).toBe(7);
    });

    it('should handle zero carriers', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 0 }]);
      mockDb.where.mockResolvedValueOnce([{ count: 0 }]);

      const result = await service.getStats();

      expect(result.total).toBe(0);
      expect(result.businesses).toBe(0);
      expect(result.individuals).toBe(0);
    });
  });

  // ==================== getDisplayName ====================
  describe('getDisplayName', () => {
    it('should return business name for business carrier', () => {
      const result = service.getDisplayName(mockBusinessCarrier);

      expect(result).toBe('Acme Delivery Inc');
    });

    it('should return full name for individual carrier', () => {
      const result = service.getDisplayName(mockCarrier);

      expect(result).toBe('John Doe');
    });

    it('should return Unknown for carrier without name', () => {
      const result = service.getDisplayName({ isBusiness: false, firstName: null, lastName: null });

      expect(result).toBe('Unknown');
    });

    it('should handle partial names', () => {
      const result = service.getDisplayName({ isBusiness: false, firstName: 'John', lastName: null });

      expect(result).toBe('John');
    });
  });

  // ==================== getActiveCarriers ====================
  describe('getActiveCarriers', () => {
    it('should return list of active carriers for dropdown', async () => {
      mockDb.orderBy.mockResolvedValue([
        { id: 'c1', isBusiness: false, firstName: 'John', lastName: 'Doe', businessName: null },
        { id: 'c2', isBusiness: true, firstName: null, lastName: null, businessName: 'Acme Inc' },
      ]);

      const result = await service.getActiveCarriers();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
    });

    it('should format names correctly', async () => {
      mockDb.orderBy.mockResolvedValue([
        { id: 'c1', isBusiness: false, firstName: 'John', lastName: 'Doe', businessName: null },
        { id: 'c2', isBusiness: true, firstName: null, lastName: null, businessName: 'Acme Inc' },
      ]);

      const result = await service.getActiveCarriers();

      expect(result[0].name).toBe('John Doe');
      expect(result[1].name).toBe('Acme Inc');
    });
  });
});
