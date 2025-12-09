import { NotFoundException } from '@nestjs/common';
import { LinkedDevicesService } from './linked-devices.service';
import { DeviceType } from './dto/settings-extended.dto';

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

describe('LinkedDevicesService', () => {
  let service: LinkedDevicesService;
  let mockDb: ReturnType<typeof createMockDb>;

  const mockUserId = 'user-1';
  const mockOrganizationId = 'org-1';

  const mockLinkedDevice = {
    id: 'device-1',
    userId: mockUserId,
    organizationId: mockOrganizationId,
    deviceName: 'iPhone 14 Pro',
    deviceType: 'mobile',
    deviceModel: 'iPhone 14 Pro',
    osName: 'iOS',
    osVersion: '17.0',
    appVersion: '1.0.0',
    deviceFingerprint: 'fp-12345-abcde',
    pushToken: 'push-token-123',
    lastIpAddress: '192.168.1.100',
    lastLocation: 'New York, USA',
    lastActiveAt: new Date('2024-01-15T10:30:00'),
    isActive: true,
    isTrusted: true,
    createdBy: mockUserId,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    updatedBy: mockUserId,
    isDeleted: false,
  };

  beforeEach(() => {
    mockDb = createMockDb();
    service = new LinkedDevicesService(mockDb as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('getLinkedDevices', () => {
    it('should return paginated linked devices with default filters', async () => {
      const mockDevices = [mockLinkedDevice];
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
                offset: jest.fn().mockResolvedValue(mockDevices),
              }),
            }),
          }),
        }),
      });

      const result = await service.getLinkedDevices(mockUserId, {});

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should filter by device type', async () => {
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
                offset: jest.fn().mockResolvedValue([mockLinkedDevice]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getLinkedDevices(mockUserId, {
        deviceType: DeviceType.MOBILE,
      });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by active status', async () => {
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
                offset: jest.fn().mockResolvedValue([mockLinkedDevice]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getLinkedDevices(mockUserId, {
        isActive: true,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].isActive).toBe(true);
    });

    it('should filter by trusted status', async () => {
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
                offset: jest.fn().mockResolvedValue([mockLinkedDevice]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getLinkedDevices(mockUserId, {
        isTrusted: true,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].isTrusted).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 25 }]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([mockLinkedDevice]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getLinkedDevices(mockUserId, {
        page: 2,
        limit: 5,
      });

      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(5);
      expect(result.meta.totalPages).toBe(5);
    });

    it('should return empty result when no devices exist', async () => {
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

      const result = await service.getLinkedDevices(mockUserId, {});

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('getDevice', () => {
    it('should return a single device by ID', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockLinkedDevice]),
        }),
      });

      const result = await service.getDevice('device-1', mockUserId);

      expect(result.id).toBe('device-1');
      expect(result.deviceName).toBe('iPhone 14 Pro');
    });

    it('should throw NotFoundException for non-existent device', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.getDevice('non-existent', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('registerDevice', () => {
    const newDeviceData = {
      deviceName: 'Samsung Galaxy S23',
      deviceType: 'mobile',
      deviceModel: 'SM-S911B',
      osName: 'Android',
      osVersion: '14.0',
      appVersion: '1.0.0',
      deviceFingerprint: 'fp-new-device-123',
      pushToken: 'push-new-token',
      ipAddress: '192.168.1.101',
      location: 'Los Angeles, USA',
    };

    it('should register a new device successfully', async () => {
      const createdDevice = { ...mockLinkedDevice, ...newDeviceData, id: 'device-new' };

      // Mock check for existing device - none found
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      // Mock insert
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdDevice]),
        }),
      });

      const result = await service.registerDevice(mockUserId, newDeviceData, mockOrganizationId);

      expect(result.deviceName).toBe('Samsung Galaxy S23');
    });

    it('should update existing device if fingerprint matches', async () => {
      const existingDevice = { ...mockLinkedDevice };
      const updatedDevice = { ...existingDevice, lastActiveAt: new Date() };

      // Mock check for existing device - found
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([existingDevice]),
        }),
      });

      // Mock update
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedDevice]),
          }),
        }),
      });

      const result = await service.registerDevice(
        mockUserId,
        { ...newDeviceData, deviceFingerprint: mockLinkedDevice.deviceFingerprint },
        mockOrganizationId,
      );

      expect(result).toBeDefined();
    });

    it('should set isActive to true and isTrusted to false for new device', async () => {
      const createdDevice = {
        ...mockLinkedDevice,
        ...newDeviceData,
        id: 'device-new',
        isActive: true,
        isTrusted: false,
      };

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdDevice]),
        }),
      });

      const result = await service.registerDevice(mockUserId, newDeviceData, mockOrganizationId);

      expect(result.isActive).toBe(true);
      expect(result.isTrusted).toBe(false);
    });

    it('should handle missing optional fields', async () => {
      const minimalDeviceData = {
        deviceFingerprint: 'fp-minimal-device',
      };
      const createdDevice = {
        ...mockLinkedDevice,
        id: 'device-minimal',
        deviceName: null,
        deviceType: null,
      };

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdDevice]),
        }),
      });

      const result = await service.registerDevice(mockUserId, minimalDeviceData);

      expect(result).toBeDefined();
    });
  });

  describe('updateDevice', () => {
    const updateDto = {
      deviceName: 'Updated Device Name',
      isTrusted: true,
    };

    it('should update an existing device', async () => {
      const updatedDevice = { ...mockLinkedDevice, ...updateDto };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockLinkedDevice]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedDevice]),
          }),
        }),
      });

      const result = await service.updateDevice('device-1', mockUserId, updateDto);

      expect(result.deviceName).toBe('Updated Device Name');
      expect(result.isTrusted).toBe(true);
    });

    it('should throw NotFoundException when updating non-existent device', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.updateDevice('non-existent', mockUserId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleDeviceTrust', () => {
    it('should toggle trust from true to false', async () => {
      const trustedDevice = { ...mockLinkedDevice, isTrusted: true };
      const updatedDevice = { ...trustedDevice, isTrusted: false };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([trustedDevice]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedDevice]),
          }),
        }),
      });

      const result = await service.toggleDeviceTrust('device-1', mockUserId);

      expect(result.isTrusted).toBe(false);
    });

    it('should toggle trust from false to true', async () => {
      const untrustedDevice = { ...mockLinkedDevice, isTrusted: false };
      const updatedDevice = { ...untrustedDevice, isTrusted: true };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([untrustedDevice]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedDevice]),
          }),
        }),
      });

      const result = await service.toggleDeviceTrust('device-1', mockUserId);

      expect(result.isTrusted).toBe(true);
    });

    it('should throw NotFoundException when toggling non-existent device', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.toggleDeviceTrust('non-existent', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('revokeDevice', () => {
    it('should revoke (soft delete) a device', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockLinkedDevice]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      await expect(
        service.revokeDevice('device-1', mockUserId),
      ).resolves.toBeUndefined();
    });

    it('should throw NotFoundException when revoking non-existent device', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.revokeDevice('non-existent', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('revokeAllDevicesExcept', () => {
    it('should revoke all devices except current', async () => {
      const devices = [
        mockLinkedDevice,
        { ...mockLinkedDevice, id: 'device-2', deviceFingerprint: 'fp-other' },
        { ...mockLinkedDevice, id: 'device-3', deviceFingerprint: 'fp-another' },
      ];

      // Mock bulk update
      mockDb.update.mockReturnValueOnce({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue(devices),
          }),
        }),
      });

      // Mock find current device
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockLinkedDevice]),
        }),
      });

      // Mock restore current device
      mockDb.update.mockReturnValueOnce({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await service.revokeAllDevicesExcept(mockUserId, mockLinkedDevice.deviceFingerprint);

      expect(result.revokedCount).toBe(2); // 3 devices - 1 current = 2 revoked
    });

    it('should revoke all devices when no current fingerprint provided', async () => {
      const devices = [mockLinkedDevice];

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue(devices),
          }),
        }),
      });

      const result = await service.revokeAllDevicesExcept(mockUserId, '');

      expect(result.revokedCount).toBe(1);
    });

    it('should return zero revoked count when no devices exist', async () => {
      mockDb.update.mockReturnValueOnce({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Mock the select for checking current device
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.revokeAllDevicesExcept(mockUserId, 'some-fingerprint');

      expect(result.revokedCount).toBe(0);
    });
  });

  describe('getDeviceStats', () => {
    it('should return device statistics', async () => {
      // Mock total count
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 5 }]),
        }),
      });

      // Mock active count
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 4 }]),
        }),
      });

      // Mock trusted count
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 2 }]),
        }),
      });

      // Mock by type counts (mobile, tablet, desktop, other)
      for (let i = 0; i < 4; i++) {
        mockDb.select.mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: i + 1 }]),
          }),
        });
      }

      const result = await service.getDeviceStats(mockUserId);

      expect(result.total).toBe(5);
      expect(result.active).toBe(4);
      expect(result.trusted).toBe(2);
      expect(result.byType).toBeDefined();
    });

    it('should return zero counts when no devices exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

      const result = await service.getDeviceStats(mockUserId);

      expect(result.total).toBe(0);
      expect(result.active).toBe(0);
      expect(result.trusted).toBe(0);
    });
  });

  describe('updateDeviceActivity', () => {
    it('should update device activity with IP address', async () => {
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      await expect(
        service.updateDeviceActivity('fp-12345', mockUserId, '192.168.1.200'),
      ).resolves.toBeUndefined();
    });

    it('should update device activity without IP address', async () => {
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      await expect(
        service.updateDeviceActivity('fp-12345', mockUserId),
      ).resolves.toBeUndefined();
    });
  });

  describe('Response Mapping', () => {
    it('should correctly map database record to response DTO', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockLinkedDevice]),
        }),
      });

      const result = await service.getDevice('device-1', mockUserId);

      expect(result).toMatchObject({
        id: mockLinkedDevice.id,
        deviceName: mockLinkedDevice.deviceName,
        deviceType: mockLinkedDevice.deviceType,
        deviceModel: mockLinkedDevice.deviceModel,
        osName: mockLinkedDevice.osName,
        osVersion: mockLinkedDevice.osVersion,
        appVersion: mockLinkedDevice.appVersion,
        lastIpAddress: mockLinkedDevice.lastIpAddress,
        lastLocation: mockLinkedDevice.lastLocation,
        isActive: mockLinkedDevice.isActive,
        isTrusted: mockLinkedDevice.isTrusted,
      });
    });

    it('should handle null values correctly in response', async () => {
      const deviceWithNulls = {
        ...mockLinkedDevice,
        deviceName: null,
        deviceModel: null,
        osName: null,
        osVersion: null,
        appVersion: null,
        lastIpAddress: null,
        lastLocation: null,
        lastActiveAt: null,
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([deviceWithNulls]),
        }),
      });

      const result = await service.getDevice('device-1', mockUserId);

      expect(result.deviceName).toBeUndefined();
      expect(result.deviceModel).toBeUndefined();
      expect(result.lastIpAddress).toBeUndefined();
    });
  });
});
