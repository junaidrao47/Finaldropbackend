import { DevicesController } from './src/devices/devices.controller';
import { DevicesService, TrustedDevice } from './src/devices/devices.service';

describe('DevicesController', () => {
  let controller: DevicesController;
  let mockDevicesService: jest.Mocked<Partial<DevicesService>>;

  const mockDevice: TrustedDevice = {
    id: 1,
    userId: 100,
    deviceFingerprint: 'fingerprint-123',
    deviceName: 'Chrome on Windows',
    userAgent: 'Mozilla/5.0 Chrome',
    ipAddress: '192.168.1.1',
    lastUsedAt: new Date(),
    isActive: true,
    createdAt: new Date(),
  };

  const mockUser = { id: 100, email: 'test@example.com' };
  const mockRequest = {
    headers: { 'user-agent': 'Mozilla/5.0 Chrome' },
    ip: '192.168.1.1',
    connection: { remoteAddress: '192.168.1.1' },
  };

  beforeEach(() => {
    mockDevicesService = {
      findAllByUser: jest.fn().mockResolvedValue([mockDevice]),
      registerDevice: jest.fn().mockResolvedValue(mockDevice),
      revokeDevice: jest.fn().mockResolvedValue(undefined),
      revokeAllDevices: jest.fn().mockResolvedValue(3),
    };

    controller = new DevicesController(mockDevicesService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  // ==================== GET /devices ====================
  describe('GET /devices', () => {
    it('should list all devices for user', async () => {
      const result = await controller.listDevices(mockUser);

      expect(result).toEqual([mockDevice]);
      expect(mockDevicesService.findAllByUser).toHaveBeenCalledWith(100);
    });

    it('should return empty array when no devices', async () => {
      mockDevicesService.findAllByUser = jest.fn().mockResolvedValue([]);

      const result = await controller.listDevices(mockUser);

      expect(result).toHaveLength(0);
    });
  });

  // ==================== POST /devices/register ====================
  describe('POST /devices/register', () => {
    it('should register a new device', async () => {
      const body = {
        deviceFingerprint: 'fingerprint-123',
        deviceName: 'Chrome on Windows',
      };

      const result = await controller.registerDevice(mockUser, body, mockRequest);

      expect(result).toEqual(mockDevice);
      expect(mockDevicesService.registerDevice).toHaveBeenCalledWith(
        100,
        'fingerprint-123',
        'Chrome on Windows',
        'Mozilla/5.0 Chrome',
        '192.168.1.1',
      );
    });

    it('should use connection remote address if req.ip is undefined', async () => {
      const requestWithoutIp = {
        headers: { 'user-agent': 'Mozilla/5.0' },
        ip: undefined,
        connection: { remoteAddress: '10.0.0.1' },
      };
      const body = { deviceFingerprint: 'fp-123' };

      await controller.registerDevice(mockUser, body, requestWithoutIp);

      expect(mockDevicesService.registerDevice).toHaveBeenCalledWith(
        100,
        'fp-123',
        undefined,
        'Mozilla/5.0',
        '10.0.0.1',
      );
    });
  });

  // ==================== DELETE /devices/:id ====================
  describe('DELETE /devices/:id', () => {
    it('should revoke a device', async () => {
      const result = await controller.revokeDevice(mockUser, '1');

      expect(result).toEqual({ success: true, message: 'Device revoked' });
      expect(mockDevicesService.revokeDevice).toHaveBeenCalledWith(100, 1);
    });

    it('should handle string device ID correctly', async () => {
      await controller.revokeDevice(mockUser, '42');

      expect(mockDevicesService.revokeDevice).toHaveBeenCalledWith(100, 42);
    });
  });

  // ==================== DELETE /devices ====================
  describe('DELETE /devices', () => {
    it('should revoke all devices', async () => {
      const result = await controller.revokeAllDevices(mockUser);

      expect(result).toEqual({ success: true, message: 'Revoked 3 devices' });
      expect(mockDevicesService.revokeAllDevices).toHaveBeenCalledWith(100);
    });

    it('should handle zero devices revoked', async () => {
      mockDevicesService.revokeAllDevices = jest.fn().mockResolvedValue(0);

      const result = await controller.revokeAllDevices(mockUser);

      expect(result).toEqual({ success: true, message: 'Revoked 0 devices' });
    });
  });

  // ==================== Error Handling ====================
  describe('Error Handling', () => {
    it('should propagate service errors on listDevices', async () => {
      mockDevicesService.findAllByUser = jest.fn().mockRejectedValue(new Error('DB error'));

      await expect(controller.listDevices(mockUser)).rejects.toThrow('DB error');
    });

    it('should propagate service errors on registerDevice', async () => {
      mockDevicesService.registerDevice = jest.fn().mockRejectedValue(new Error('Registration failed'));

      await expect(
        controller.registerDevice(mockUser, { deviceFingerprint: 'fp' }, mockRequest),
      ).rejects.toThrow('Registration failed');
    });

    it('should propagate service errors on revokeDevice', async () => {
      mockDevicesService.revokeDevice = jest.fn().mockRejectedValue(new Error('Device not found'));

      await expect(controller.revokeDevice(mockUser, '999')).rejects.toThrow('Device not found');
    });
  });
});
