import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import {
  UserPreferencesDto,
  NotificationSettingsDto,
  SecuritySettingsDto,
  OrganizationSettingsDto,
  WarehouseSettingsDto,
  LabelSettingsDto,
  ApiSettingsDto,
  UserSettingsResponseDto,
  OrganizationSettingsResponseDto,
  WarehouseSettingsResponseDto,
  ThemeMode,
  Language,
  DateFormat,
  TimeFormat,
} from './dto/settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  // Default settings templates
  private readonly defaultUserPreferences: UserPreferencesDto = {
    theme: ThemeMode.SYSTEM,
    language: Language.EN,
    dateFormat: DateFormat.US,
    timeFormat: TimeFormat.TWELVE_HOUR,
    timezone: 'America/New_York',
    compactMode: false,
    showAnimations: true,
    defaultPageSize: 20,
    defaultCurrency: 'USD',
  };

  private readonly defaultNotificationSettings: NotificationSettingsDto = {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    inAppNotifications: true,
    packageReceived: true,
    packageDelivered: true,
    packageReturned: true,
    newMessage: true,
    systemAlerts: true,
    promotionalEmails: false,
    weeklyReport: true,
    dailyDigest: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  };

  private readonly defaultSecuritySettings: SecuritySettingsDto = {
    twoFactorEnabled: false,
    twoFactorMethod: 'app',
    loginAlerts: true,
    sessionTimeoutMinutes: 60,
    rememberDevices: true,
    trustedIps: [],
  };

  private readonly defaultLabelSettings: LabelSettingsDto = {
    defaultLabelSize: '4x6',
    defaultPrinter: '',
    autoPrint: false,
    includeReturnLabel: false,
    barcodeFormat: 'QR',
    ocrEnabled: true,
    ocrProvider: 'tesseract',
  };

  private readonly defaultApiSettings: ApiSettingsDto = {
    apiEnabled: false,
    rateLimitPerMinute: 60,
    allowedOrigins: [],
    webhookUrls: [],
    webhooksEnabled: false,
    webhookEvents: ['package.received', 'package.delivered', 'package.returned'],
  };

  constructor(
    @Inject('DRIZZLE_DB')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // ==================== User Settings ====================

  /**
   * Get user settings
   */
  async getUserSettings(userId: number): Promise<UserSettingsResponseDto> {
    this.logger.log(`Getting settings for user ${userId}`);

    // Try to get existing settings from database
    // For now, we'll use in-memory defaults + any persisted overrides
    const settings = await this.getOrCreateUserSettings(userId);

    return {
      userId,
      preferences: settings.preferences,
      notifications: settings.notifications,
      security: settings.security,
      updatedAt: new Date(),
    };
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: number, dto: UserPreferencesDto): Promise<UserPreferencesDto> {
    this.logger.log(`Updating preferences for user ${userId}`);
    
    const settings = await this.getOrCreateUserSettings(userId);
    const updated = { ...settings.preferences, ...dto };
    
    // Save to database (placeholder - implement actual persistence)
    await this.saveUserSettings(userId, { ...settings, preferences: updated });
    
    return updated;
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(
    userId: number,
    dto: NotificationSettingsDto,
  ): Promise<NotificationSettingsDto> {
    this.logger.log(`Updating notification settings for user ${userId}`);
    
    const settings = await this.getOrCreateUserSettings(userId);
    const updated = { ...settings.notifications, ...dto };
    
    await this.saveUserSettings(userId, { ...settings, notifications: updated });
    
    return updated;
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(
    userId: number,
    dto: SecuritySettingsDto,
  ): Promise<SecuritySettingsDto> {
    this.logger.log(`Updating security settings for user ${userId}`);
    
    const settings = await this.getOrCreateUserSettings(userId);
    const updated = { ...settings.security, ...dto };
    
    await this.saveUserSettings(userId, { ...settings, security: updated });
    
    return updated;
  }

  /**
   * Reset user settings to defaults
   */
  async resetUserSettings(userId: number): Promise<UserSettingsResponseDto> {
    this.logger.log(`Resetting settings for user ${userId}`);
    
    const defaultSettings = {
      preferences: { ...this.defaultUserPreferences },
      notifications: { ...this.defaultNotificationSettings },
      security: { ...this.defaultSecuritySettings },
    };
    
    await this.saveUserSettings(userId, defaultSettings);
    
    return {
      userId,
      ...defaultSettings,
      updatedAt: new Date(),
    };
  }

  // ==================== Organization Settings ====================

  /**
   * Get organization settings
   */
  async getOrganizationSettings(organizationId: number): Promise<OrganizationSettingsResponseDto> {
    this.logger.log(`Getting settings for organization ${organizationId}`);
    
    const settings = await this.getOrCreateOrgSettings(organizationId);
    
    return {
      organizationId,
      settings: settings.organization,
      labelSettings: settings.label,
      apiSettings: settings.api,
      updatedAt: new Date(),
    };
  }

  /**
   * Update organization settings
   */
  async updateOrganizationSettings(
    organizationId: number,
    dto: OrganizationSettingsDto,
  ): Promise<OrganizationSettingsDto> {
    this.logger.log(`Updating settings for organization ${organizationId}`);
    
    const settings = await this.getOrCreateOrgSettings(organizationId);
    const updated = { ...settings.organization, ...dto };
    
    await this.saveOrgSettings(organizationId, { ...settings, organization: updated });
    
    return updated;
  }

  /**
   * Update label settings
   */
  async updateLabelSettings(
    organizationId: number,
    dto: LabelSettingsDto,
  ): Promise<LabelSettingsDto> {
    this.logger.log(`Updating label settings for organization ${organizationId}`);
    
    const settings = await this.getOrCreateOrgSettings(organizationId);
    const updated = { ...settings.label, ...dto };
    
    await this.saveOrgSettings(organizationId, { ...settings, label: updated });
    
    return updated;
  }

  /**
   * Update API settings
   */
  async updateApiSettings(
    organizationId: number,
    dto: ApiSettingsDto,
  ): Promise<ApiSettingsDto> {
    this.logger.log(`Updating API settings for organization ${organizationId}`);
    
    const settings = await this.getOrCreateOrgSettings(organizationId);
    const updated = { ...settings.api, ...dto };
    
    await this.saveOrgSettings(organizationId, { ...settings, api: updated });
    
    return updated;
  }

  // ==================== Warehouse Settings ====================

  /**
   * Get warehouse settings
   */
  async getWarehouseSettings(warehouseId: number): Promise<WarehouseSettingsResponseDto> {
    this.logger.log(`Getting settings for warehouse ${warehouseId}`);
    
    const settings = await this.getOrCreateWarehouseSettings(warehouseId);
    
    return {
      warehouseId,
      settings,
      updatedAt: new Date(),
    };
  }

  /**
   * Update warehouse settings
   */
  async updateWarehouseSettings(
    warehouseId: number,
    dto: WarehouseSettingsDto,
  ): Promise<WarehouseSettingsDto> {
    this.logger.log(`Updating settings for warehouse ${warehouseId}`);
    
    const settings = await this.getOrCreateWarehouseSettings(warehouseId);
    const updated = { ...settings, ...dto };
    
    await this.saveWarehouseSettings(warehouseId, updated);
    
    return updated;
  }

  // ==================== Private Helper Methods ====================

  /**
   * Get or create user settings
   */
  private async getOrCreateUserSettings(userId: number): Promise<{
    preferences: UserPreferencesDto;
    notifications: NotificationSettingsDto;
    security: SecuritySettingsDto;
  }> {
    // In a full implementation, this would query a user_settings table
    // For now, return defaults (can be extended to use JSONB column on users table)
    return {
      preferences: { ...this.defaultUserPreferences },
      notifications: { ...this.defaultNotificationSettings },
      security: { ...this.defaultSecuritySettings },
    };
  }

  /**
   * Save user settings
   */
  private async saveUserSettings(
    userId: number,
    settings: {
      preferences: UserPreferencesDto;
      notifications: NotificationSettingsDto;
      security: SecuritySettingsDto;
    },
  ): Promise<void> {
    // Placeholder for database persistence
    // Would typically update a user_settings table or JSONB column
    this.logger.debug(`Saving settings for user ${userId}: ${JSON.stringify(settings)}`);
  }

  /**
   * Get or create organization settings
   */
  private async getOrCreateOrgSettings(organizationId: number): Promise<{
    organization: OrganizationSettingsDto;
    label: LabelSettingsDto;
    api: ApiSettingsDto;
  }> {
    // In a full implementation, this would query an organization_settings table
    return {
      organization: {
        businessName: '',
        autoAssignAgent: true,
        requireSignature: false,
        requirePhoto: false,
        defaultRetentionDays: 30,
        defaultCurrency: 'USD',
        defaultTimezone: 'America/New_York',
      },
      label: { ...this.defaultLabelSettings },
      api: { ...this.defaultApiSettings },
    };
  }

  /**
   * Save organization settings
   */
  private async saveOrgSettings(
    organizationId: number,
    settings: {
      organization: OrganizationSettingsDto;
      label: LabelSettingsDto;
      api: ApiSettingsDto;
    },
  ): Promise<void> {
    this.logger.debug(`Saving settings for organization ${organizationId}: ${JSON.stringify(settings)}`);
  }

  /**
   * Get or create warehouse settings
   */
  private async getOrCreateWarehouseSettings(warehouseId: number): Promise<WarehouseSettingsDto> {
    return {
      isActive: true,
      acceptsReturns: true,
      acceptsPickups: true,
      operatingHours: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: { start: '10:00', end: '14:00' },
        sunday: { start: '00:00', end: '00:00', closed: true },
      },
    };
  }

  /**
   * Save warehouse settings
   */
  private async saveWarehouseSettings(
    warehouseId: number,
    settings: WarehouseSettingsDto,
  ): Promise<void> {
    this.logger.debug(`Saving settings for warehouse ${warehouseId}: ${JSON.stringify(settings)}`);
  }

  // ==================== Bulk Export/Import ====================

  /**
   * Export all user settings
   */
  async exportUserSettings(userId: number): Promise<Record<string, any>> {
    const settings = await this.getUserSettings(userId);
    return {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      userId,
      settings: {
        preferences: settings.preferences,
        notifications: settings.notifications,
        security: settings.security,
      },
    };
  }

  /**
   * Import user settings
   */
  async importUserSettings(
    userId: number,
    importData: Record<string, any>,
  ): Promise<UserSettingsResponseDto> {
    if (importData.version !== '1.0') {
      throw new Error('Unsupported settings version');
    }

    const { preferences, notifications, security } = importData.settings || {};

    if (preferences) {
      await this.updateUserPreferences(userId, preferences);
    }
    if (notifications) {
      await this.updateNotificationSettings(userId, notifications);
    }
    if (security) {
      await this.updateSecuritySettings(userId, security);
    }

    return this.getUserSettings(userId);
  }
}
