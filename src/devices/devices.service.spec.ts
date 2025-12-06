import { NotFoundException } from '@nestjs/common';
import { DevicesService, TrustedDevice } from './src/devices/devices.service';

jest.mock('./src/drizzle/drizzle-client', () => {
  const pool = { query: jest.fn() };
  return { pool };
});

const { pool: mockPool } = require('./src/drizzle/drizzle-client');

describe('DevicesService', () => {
  let service: DevicesService;

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

  const mockDbRow = {
    id: 1,
    user_id: 100,
    device_fingerprint: 'fingerprint-123',
    device_name: 'Chrome on Windows',
    user_agent: 'Mozilla/5.0 Chrome',
    ip_address: '192.168.1.1',
    last_used_at: new Date(),
    is_active: true,
    created_at: new Date(),
  };

  beforeEach(() => {
    service = new DevicesService();
    jest.clearAllMocks();
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ==================== registerDevice Tests ====================
  describe('registerDevice', () => {
    it('should register a new device', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // findByFingerprint returns empty
        .mockResolvedValueOnce({ rows: [mockDbRow] }); // INSERT returns new device

      const result = await service.registerDevice(
        100,
        'fingerprint-123',
        'Chrome on Windows',
        'Mozilla/5.0 Chrome',
        '192.168.1.1',
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('deviceFingerprint', 'fingerprint-123');
      expect(result).toHaveProperty('deviceName', 'Chrome on Windows');
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should return existing device if fingerprint exists', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockDbRow] }) // findByFingerprint returns existing
        .mockResolvedValueOnce({ rowCount: 1 }); // updateLastUsed

      const result = await service.registerDevice(100, 'fingerprint-123');

      expect(result.id).toBe(1);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should handle optional parameters', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ ...mockDbRow, device_name: null }] });

      const result = await service.registerDevice(100, 'fingerprint-123');

      expect(result).toHaveProperty('deviceFingerprint');
    });
  });

  // ==================== findByFingerprint Tests ====================
  describe('findByFingerprint', () => {
    it('should find device by fingerprint', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [mockDbRow] });

      const result = await service.findByFingerprint(100, 'fingerprint-123');

      expect(result).not.toBeNull();
      expect(result?.deviceFingerprint).toBe('fingerprint-123');
    });

    it('should return null when device not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.findByFingerprint(100, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  // ==================== findAllByUser Tests ====================
  describe('findAllByUser', () => {
    it('should return all devices for user', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [mockDbRow, { ...mockDbRow, id: 2 }] });

      const result = await service.findAllByUser(100);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('userId', 100);
    });

    it('should return empty array when no devices', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.findAllByUser(100);

      expect(result).toHaveLength(0);
    });
  });

  // ==================== updateLastUsed Tests ====================
  describe('updateLastUsed', () => {
    it('should update last used time', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      await service.updateLastUsed(1);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE trusted_devices SET last_used_at'),
        [1],
      );
    });
  });

  // ==================== revokeDevice Tests ====================
  describe('revokeDevice', () => {
    it('should revoke a device', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      await service.revokeDevice(100, 1);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE trusted_devices SET is_active = false'),
        [1, 100],
      );
    });

    it('should throw NotFoundException when device not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

      await expect(service.revokeDevice(100, 999)).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== revokeAllDevices Tests ====================
  describe('revokeAllDevices', () => {
    it('should revoke all devices for user', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 5 });

      const result = await service.revokeAllDevices(100);

      expect(result).toBe(5);
    });

    it('should return 0 when no active devices', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

      const result = await service.revokeAllDevices(100);

      expect(result).toBe(0);
    });
  });

  // ==================== isTrustedDevice Tests ====================
  describe('isTrustedDevice', () => {
    it('should return true for trusted device', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockDbRow] }) // findByFingerprint
        .mockResolvedValueOnce({ rowCount: 1 }); // updateLastUsed

      const result = await service.isTrustedDevice(100, 'fingerprint-123');

      expect(result).toBe(true);
    });

    it('should return false for untrusted device', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.isTrustedDevice(100, 'unknown-fingerprint');

      expect(result).toBe(false);
    });
  });
});
