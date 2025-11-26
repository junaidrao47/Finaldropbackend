import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { pool } from '../drizzle/drizzle-client';

export interface TrustedDevice {
  id: number;
  userId: number;
  deviceFingerprint: string;
  deviceName: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  lastUsedAt: Date;
  isActive: boolean;
  createdAt: Date;
}

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  async registerDevice(
    userId: number,
    deviceFingerprint: string,
    deviceName?: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TrustedDevice> {
    // Check if device already exists for this user
    const existing = await this.findByFingerprint(userId, deviceFingerprint);
    if (existing) {
      // Update last used time
      await this.updateLastUsed(existing.id);
      return existing;
    }

    // Insert new trusted device
    const result = await pool.query(
      `INSERT INTO trusted_devices (user_id, device_fingerprint, device_name, user_agent, ip_address, last_used_at, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), true, NOW())
       RETURNING *`,
      [userId, deviceFingerprint, deviceName || null, userAgent || null, ipAddress || null],
    );

    this.logger.log(`Registered trusted device for user ${userId}`);
    return this.mapRow(result.rows[0]);
  }

  async findByFingerprint(userId: number, deviceFingerprint: string): Promise<TrustedDevice | null> {
    const result = await pool.query(
      `SELECT * FROM trusted_devices WHERE user_id = $1 AND device_fingerprint = $2 AND is_active = true`,
      [userId, deviceFingerprint],
    );
    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  async findAllByUser(userId: number): Promise<TrustedDevice[]> {
    const result = await pool.query(
      `SELECT * FROM trusted_devices WHERE user_id = $1 ORDER BY last_used_at DESC`,
      [userId],
    );
    return result.rows.map(this.mapRow);
  }

  async updateLastUsed(deviceId: number): Promise<void> {
    await pool.query(
      `UPDATE trusted_devices SET last_used_at = NOW() WHERE id = $1`,
      [deviceId],
    );
  }

  async revokeDevice(userId: number, deviceId: number): Promise<void> {
    const result = await pool.query(
      `UPDATE trusted_devices SET is_active = false WHERE id = $1 AND user_id = $2`,
      [deviceId, userId],
    );
    if (result.rowCount === 0) {
      throw new NotFoundException('Device not found or already revoked');
    }
    this.logger.log(`Revoked trusted device ${deviceId} for user ${userId}`);
  }

  async revokeAllDevices(userId: number): Promise<number> {
    const result = await pool.query(
      `UPDATE trusted_devices SET is_active = false WHERE user_id = $1 AND is_active = true`,
      [userId],
    );
    this.logger.log(`Revoked all ${result.rowCount} devices for user ${userId}`);
    return result.rowCount || 0;
  }

  async isTrustedDevice(userId: number, deviceFingerprint: string): Promise<boolean> {
    const device = await this.findByFingerprint(userId, deviceFingerprint);
    if (device) {
      await this.updateLastUsed(device.id);
      return true;
    }
    return false;
  }

  private mapRow(row: any): TrustedDevice {
    return {
      id: row.id,
      userId: row.user_id,
      deviceFingerprint: row.device_fingerprint,
      deviceName: row.device_name,
      userAgent: row.user_agent,
      ipAddress: row.ip_address,
      lastUsedAt: row.last_used_at,
      isActive: row.is_active,
      createdAt: row.created_at,
    };
  }
}
