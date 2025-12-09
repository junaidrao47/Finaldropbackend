import { PackagesController } from './packages.controller';
import { PackagesService, PackageStatus } from './packages.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

describe('PackagesController', () => {
  let controller: PackagesController;
  let mockPackagesService: jest.Mocked<Partial<PackagesService>>;
  let mockCloudinaryService: jest.Mocked<Partial<CloudinaryService>>;

  const mockPackage = {
    id: 'pkg-001',
    organizationId: 'org-001',
    warehouseId: 'wh-001',
    trackingNumber: 'TRK-12345',
    senderName: 'Sender Inc',
    recipientName: 'John Doe',
    phoneNumber: '+1234567890',
    status: PackageStatus.PENDING,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = { sub: 'user-001', id: 'user-001' };
  const mockRequest = { user: mockUser };

  beforeEach(() => {
    mockPackagesService = {
      create: jest.fn().mockResolvedValue(mockPackage),
      findAll: jest.fn().mockResolvedValue({
        data: [mockPackage],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
      findById: jest.fn().mockResolvedValue(mockPackage),
      findByTrackingNumber: jest.fn().mockResolvedValue(mockPackage),
      update: jest.fn().mockResolvedValue(mockPackage),
      updateStatus: jest.fn().mockResolvedValue(mockPackage),
      getRecent: jest.fn().mockResolvedValue([mockPackage]),
      getStats: jest.fn().mockResolvedValue({
        total: 100,
        pending: 20,
        delivered: 60,
        returned: 10,
        cancelled: 10,
      }),
      search: jest.fn().mockResolvedValue([mockPackage]),
      getRemarkTypes: jest.fn().mockResolvedValue([{ id: 1, name: 'General' }]),
      addRemark: jest.fn().mockResolvedValue({ id: 'remark-001', content: 'Test' }),
      getRemarks: jest.fn().mockResolvedValue([]),
      addFile: jest.fn().mockResolvedValue({ id: 'file-001' }),
      getFiles: jest.fn().mockResolvedValue([]),
      deleteFile: jest.fn().mockResolvedValue(undefined),
      transfer: jest.fn().mockResolvedValue(mockPackage),
      bulkUpdateStatus: jest.fn().mockResolvedValue({ updated: 5 }),
      bulkDelete: jest.fn().mockResolvedValue({ deleted: 3 }),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };

    mockCloudinaryService = {
      uploadFile: jest.fn().mockResolvedValue({ secure_url: 'https://cloudinary.com/test.jpg' }),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };

    controller = new PackagesController(
      mockPackagesService as any,
      mockCloudinaryService as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  // ==================== POST /packages ====================
  describe('POST /packages', () => {
    it('should create a package', async () => {
      const dto = {
        organizationId: 'org-001',
        trackingNumber: 'TRK-12345',
        recipientName: 'John Doe',
      };

      const result = await controller.create(dto, mockRequest);

      expect(result).toEqual(mockPackage);
      expect(mockPackagesService.create).toHaveBeenCalledWith(dto, 'user-001');
    });

    it('should extract user ID from request', async () => {
      const dto = { organizationId: 'org-001', trackingNumber: 'TRK-001' };

      await controller.create(dto, { user: { sub: 'sub-user' } });

      expect(mockPackagesService.create).toHaveBeenCalledWith(dto, 'sub-user');
    });
  });

  // ==================== GET /packages ====================
  describe('GET /packages', () => {
    it('should return packages with pagination', async () => {
      const filter = { organizationId: 'org-001', page: 1, limit: 10 };

      const result = await controller.findAll(filter);

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toBeDefined();
      expect(mockPackagesService.findAll).toHaveBeenCalledWith(filter);
    });

    it('should return empty data when no packages', async () => {
      mockPackagesService.findAll = jest.fn().mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      const result = await controller.findAll({});

      expect(result.data).toHaveLength(0);
    });
  });

  // ==================== GET /packages/recent/:organizationId ====================
  describe('GET /packages/recent/:organizationId', () => {
    it('should return recent packages', async () => {
      const result = await controller.getRecent('org-001');

      expect(result).toEqual([mockPackage]);
      expect(mockPackagesService.getRecent).toHaveBeenCalledWith('org-001', 10);
    });

    it('should accept custom limit', async () => {
      await controller.getRecent('org-001', '5');

      expect(mockPackagesService.getRecent).toHaveBeenCalledWith('org-001', 5);
    });
  });

  // ==================== GET /packages/stats/:organizationId ====================
  describe('GET /packages/stats/:organizationId', () => {
    it('should return package stats', async () => {
      const result = await controller.getStats('org-001');

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('pending');
      expect(result).toHaveProperty('delivered');
      expect(mockPackagesService.getStats).toHaveBeenCalledWith('org-001', undefined);
    });

    it('should filter by warehouseId', async () => {
      await controller.getStats('org-001', 'wh-001');

      expect(mockPackagesService.getStats).toHaveBeenCalledWith('org-001', 'wh-001');
    });
  });

  // ==================== GET /packages/search ====================
  describe('GET /packages/search', () => {
    it('should search packages', async () => {
      const result = await controller.search('TRK-12345', 'org-001');

      expect(result).toEqual([mockPackage]);
      expect(mockPackagesService.search).toHaveBeenCalledWith('TRK-12345', 'org-001', 20);
    });

    it('should accept custom limit', async () => {
      await controller.search('TRK', 'org-001', '50');

      expect(mockPackagesService.search).toHaveBeenCalledWith('TRK', 'org-001', 50);
    });
  });

  // ==================== GET /packages/remark-types ====================
  describe('GET /packages/remark-types', () => {
    it('should return remark types', async () => {
      const result = await controller.getRemarkTypes();

      expect(result).toEqual([{ id: 1, name: 'General' }]);
      expect(mockPackagesService.getRemarkTypes).toHaveBeenCalled();
    });
  });

  // ==================== GET /packages/:id ====================
  describe('GET /packages/:id', () => {
    it('should return package by ID', async () => {
      const result = await controller.findOne('pkg-001');

      expect(result).toEqual(mockPackage);
      expect(mockPackagesService.findById).toHaveBeenCalledWith('pkg-001');
    });
  });

  // ==================== PUT /packages/:id ====================
  describe('PUT /packages/:id', () => {
    it('should update package', async () => {
      const dto = { recipientName: 'Jane Doe' };

      const result = await controller.update('pkg-001', dto, mockRequest);

      expect(result).toEqual(mockPackage);
      expect(mockPackagesService.update).toHaveBeenCalledWith('pkg-001', dto, 'user-001');
    });
  });

  // ==================== PUT /packages/:id/status ====================
  describe('PUT /packages/:id/status', () => {
    it('should update package status', async () => {
      mockPackagesService.updateStatus = jest.fn().mockResolvedValue({
        ...mockPackage,
        status: PackageStatus.DELIVERED,
      });

      const result = await controller.updateStatus('pkg-001', PackageStatus.DELIVERED, mockRequest);

      expect(result.status).toBe(PackageStatus.DELIVERED);
      expect(mockPackagesService.updateStatus).toHaveBeenCalledWith(
        'pkg-001',
        PackageStatus.DELIVERED,
        'user-001',
      );
    });
  });

  // ==================== Error Handling ====================
  describe('Error Handling', () => {
    it('should propagate service errors on create', async () => {
      mockPackagesService.create = jest.fn().mockRejectedValue(new Error('Create failed'));

      await expect(controller.create({} as any, mockRequest)).rejects.toThrow('Create failed');
    });

    it('should propagate service errors on findById', async () => {
      mockPackagesService.findById = jest.fn().mockRejectedValue(new Error('Not found'));

      await expect(controller.findOne('pkg-999')).rejects.toThrow('Not found');
    });

    it('should propagate service errors on update', async () => {
      mockPackagesService.update = jest.fn().mockRejectedValue(new Error('Update failed'));

      await expect(controller.update('pkg-001', {}, mockRequest)).rejects.toThrow('Update failed');
    });
  });

  // ==================== Status Transitions ====================
  describe('Status Transitions', () => {
    const statuses = [
      PackageStatus.PENDING,
      PackageStatus.RECEIVED,
      PackageStatus.AVAILABLE,
      PackageStatus.IN_TRANSIT,
      PackageStatus.OUT_FOR_DELIVERY,
      PackageStatus.DELIVERED,
      PackageStatus.RETURNED,
      PackageStatus.CANCELLED,
      PackageStatus.ON_HOLD,
    ];

    statuses.forEach((status) => {
      it(`should update status to ${status}`, async () => {
        mockPackagesService.updateStatus = jest.fn().mockResolvedValue({
          ...mockPackage,
          status,
        });

        const result = await controller.updateStatus('pkg-001', status, mockRequest);

        expect(result.status).toBe(status);
      });
    });
  });
});
