import { CarriersController } from './src/carriers/carriers.controller';
import { CarriersService } from './src/carriers/carriers.service';
import { CreateCarrierDto, UpdateCarrierDto, CarrierFilterDto } from './src/carriers/dto/carrier.dto';

describe('CarriersController', () => {
  let controller: CarriersController;
  let mockCarriersService: jest.Mocked<Partial<CarriersService>>;

  const mockCarrier = {
    id: 'carrier-123',
    isBusiness: false,
    firstName: 'John',
    lastName: 'Doe',
    businessName: null,
    email: 'john@example.com',
    phoneNumber: '+1234567890',
    isDeleted: false,
    createdAt: new Date(),
  };

  const mockBusinessCarrier = {
    ...mockCarrier,
    id: 'carrier-456',
    isBusiness: true,
    firstName: null,
    lastName: null,
    businessName: 'Acme Delivery Inc',
  };

  beforeEach(() => {
    mockCarriersService = {
      create: jest.fn().mockResolvedValue(mockCarrier),
      findAll: jest.fn().mockResolvedValue({ data: [mockCarrier, mockBusinessCarrier], total: 2 }),
      findById: jest.fn().mockResolvedValue(mockCarrier),
      update: jest.fn().mockResolvedValue({ ...mockCarrier, firstName: 'Jane' }),
      remove: jest.fn().mockResolvedValue(undefined),
      restore: jest.fn().mockResolvedValue(mockCarrier),
      hardDelete: jest.fn().mockResolvedValue(undefined),
      getStats: jest.fn().mockResolvedValue({ total: 10, businesses: 3, individuals: 7 }),
      getActiveCarriers: jest.fn().mockResolvedValue([
        { id: 'c1', name: 'John Doe' },
        { id: 'c2', name: 'Acme Inc' },
      ]),
    };

    controller = new CarriersController(mockCarriersService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  // ==================== POST /carriers ====================
  describe('POST /carriers', () => {
    const createDto: CreateCarrierDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
    };

    it('should create a new carrier', async () => {
      const req = { user: { id: 'user-123' } };

      const result = await controller.create(createDto, req);

      expect(result).toEqual(mockCarrier);
      expect(mockCarriersService.create).toHaveBeenCalledWith(createDto, 'user-123');
    });

    it('should use sub from user if available', async () => {
      const req = { user: { sub: 'user-sub-123' } };

      await controller.create(createDto, req);

      expect(mockCarriersService.create).toHaveBeenCalledWith(createDto, 'user-sub-123');
    });

    it('should create a business carrier', async () => {
      const businessDto: CreateCarrierDto = {
        isBusiness: true,
        businessName: 'Acme Inc',
        email: 'contact@acme.com',
      };
      const req = { user: { id: 'user-123' } };
      mockCarriersService.create = jest.fn().mockResolvedValue(mockBusinessCarrier);

      const result = await controller.create(businessDto, req);

      expect(result.isBusiness).toBe(true);
    });

    it('should handle service errors', async () => {
      mockCarriersService.create = jest.fn().mockRejectedValue(new Error('Database error'));
      const req = { user: { id: 'user-123' } };

      await expect(controller.create(createDto, req)).rejects.toThrow('Database error');
    });
  });

  // ==================== GET /carriers ====================
  describe('GET /carriers', () => {
    it('should return paginated carriers', async () => {
      const filter: CarrierFilterDto = { page: 1, limit: 10 };

      const result = await controller.findAll(filter);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockCarriersService.findAll).toHaveBeenCalledWith(filter);
    });

    it('should filter by isBusiness', async () => {
      const filter: CarrierFilterDto = { isBusiness: true };

      await controller.findAll(filter);

      expect(mockCarriersService.findAll).toHaveBeenCalledWith(filter);
    });

    it('should filter by search term', async () => {
      const filter: CarrierFilterDto = { search: 'John' };

      await controller.findAll(filter);

      expect(mockCarriersService.findAll).toHaveBeenCalledWith(filter);
    });

    it('should filter by statusId', async () => {
      const filter: CarrierFilterDto = { statusId: 'status-123' };

      await controller.findAll(filter);

      expect(mockCarriersService.findAll).toHaveBeenCalledWith(filter);
    });

    it('should handle empty results', async () => {
      mockCarriersService.findAll = jest.fn().mockResolvedValue({ data: [], total: 0 });

      const result = await controller.findAll({});

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // ==================== GET /carriers/active ====================
  describe('GET /carriers/active', () => {
    it('should return active carriers for dropdown', async () => {
      const result = await controller.getActiveCarriers();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
    });

    it('should return empty array when no active carriers', async () => {
      mockCarriersService.getActiveCarriers = jest.fn().mockResolvedValue([]);

      const result = await controller.getActiveCarriers();

      expect(result).toHaveLength(0);
    });
  });

  // ==================== GET /carriers/stats ====================
  describe('GET /carriers/stats', () => {
    it('should return carrier statistics', async () => {
      const result = await controller.getStats();

      expect(result).toEqual({ total: 10, businesses: 3, individuals: 7 });
    });

    it('should return stats with all properties', async () => {
      const result = await controller.getStats();

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('businesses');
      expect(result).toHaveProperty('individuals');
    });
  });

  // ==================== GET /carriers/:id ====================
  describe('GET /carriers/:id', () => {
    it('should return carrier by ID', async () => {
      const result = await controller.findOne('carrier-123');

      expect(result).toEqual(mockCarrier);
      expect(mockCarriersService.findById).toHaveBeenCalledWith('carrier-123');
    });

    it('should handle not found error', async () => {
      mockCarriersService.findById = jest.fn().mockRejectedValue(new Error('Not found'));

      await expect(controller.findOne('nonexistent')).rejects.toThrow('Not found');
    });
  });

  // ==================== PUT /carriers/:id ====================
  describe('PUT /carriers/:id', () => {
    const updateDto: UpdateCarrierDto = { firstName: 'Jane' };

    it('should update carrier', async () => {
      const req = { user: { id: 'user-123' } };

      const result = await controller.update('carrier-123', updateDto, req);

      expect(result.firstName).toBe('Jane');
      expect(mockCarriersService.update).toHaveBeenCalledWith('carrier-123', updateDto, 'user-123');
    });

    it('should use sub from user if available', async () => {
      const req = { user: { sub: 'user-sub-123' } };

      await controller.update('carrier-123', updateDto, req);

      expect(mockCarriersService.update).toHaveBeenCalledWith('carrier-123', updateDto, 'user-sub-123');
    });

    it('should handle not found error', async () => {
      mockCarriersService.update = jest.fn().mockRejectedValue(new Error('Not found'));
      const req = { user: { id: 'user-123' } };

      await expect(controller.update('nonexistent', updateDto, req)).rejects.toThrow('Not found');
    });

    it('should update multiple fields', async () => {
      const dto: UpdateCarrierDto = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
      };
      const req = { user: { id: 'user-123' } };

      await controller.update('carrier-123', dto, req);

      expect(mockCarriersService.update).toHaveBeenCalledWith('carrier-123', dto, 'user-123');
    });
  });

  // ==================== POST /carriers/:id/restore ====================
  describe('POST /carriers/:id/restore', () => {
    it('should restore soft-deleted carrier', async () => {
      const req = { user: { id: 'user-123' } };

      const result = await controller.restore('carrier-123', req);

      expect(result).toEqual(mockCarrier);
      expect(mockCarriersService.restore).toHaveBeenCalledWith('carrier-123', 'user-123');
    });

    it('should use sub from user if available', async () => {
      const req = { user: { sub: 'user-sub-123' } };

      await controller.restore('carrier-123', req);

      expect(mockCarriersService.restore).toHaveBeenCalledWith('carrier-123', 'user-sub-123');
    });

    it('should handle not found error', async () => {
      mockCarriersService.restore = jest.fn().mockRejectedValue(new Error('Not found'));
      const req = { user: { id: 'user-123' } };

      await expect(controller.restore('nonexistent', req)).rejects.toThrow('Not found');
    });
  });

  // ==================== DELETE /carriers/:id ====================
  describe('DELETE /carriers/:id', () => {
    it('should soft delete carrier', async () => {
      const req = { user: { id: 'user-123' } };

      await controller.remove('carrier-123', req);

      expect(mockCarriersService.remove).toHaveBeenCalledWith('carrier-123', 'user-123');
    });

    it('should use sub from user if available', async () => {
      const req = { user: { sub: 'user-sub-123' } };

      await controller.remove('carrier-123', req);

      expect(mockCarriersService.remove).toHaveBeenCalledWith('carrier-123', 'user-sub-123');
    });

    it('should handle not found error', async () => {
      mockCarriersService.remove = jest.fn().mockRejectedValue(new Error('Not found'));
      const req = { user: { id: 'user-123' } };

      await expect(controller.remove('nonexistent', req)).rejects.toThrow('Not found');
    });
  });

  // ==================== DELETE /carriers/:id/permanent ====================
  describe('DELETE /carriers/:id/permanent', () => {
    it('should permanently delete carrier', async () => {
      await controller.hardDelete('carrier-123');

      expect(mockCarriersService.hardDelete).toHaveBeenCalledWith('carrier-123');
    });

    it('should handle errors', async () => {
      mockCarriersService.hardDelete = jest.fn().mockRejectedValue(new Error('Delete failed'));

      await expect(controller.hardDelete('carrier-123')).rejects.toThrow('Delete failed');
    });
  });

  // ==================== Error Handling ====================
  describe('Error Handling', () => {
    it('should propagate service errors', async () => {
      mockCarriersService.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(controller.findAll({})).rejects.toThrow('Database error');
    });
  });
});
