import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService } from './settings.service';
import {
  UserPreferencesDto,
  NotificationSettingsDto,
  SecuritySettingsDto,
  OrganizationSettingsDto,
  WarehouseSettingsDto,
  LabelSettingsDto,
  ApiSettingsDto,
} from './dto/settings.dto';

@Controller('settings')
@UseGuards(AuthGuard('jwt'))
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ==================== User Settings ====================

  /**
   * Get current user's settings
   * GET /settings/user
   */
  @Get('user')
  async getUserSettings(@Request() req: any) {
    return this.settingsService.getUserSettings(req.user.id);
  }

  /**
   * Get specific user's settings (admin only)
   * GET /settings/user/:id
   */
  @Get('user/:id')
  async getUserSettingsById(@Param('id', ParseIntPipe) userId: number) {
    return this.settingsService.getUserSettings(userId);
  }

  /**
   * Update user preferences
   * PUT /settings/user/preferences
   */
  @Put('user/preferences')
  async updateUserPreferences(
    @Request() req: any,
    @Body() dto: UserPreferencesDto,
  ) {
    return this.settingsService.updateUserPreferences(req.user.id, dto);
  }

  /**
   * Update notification settings
   * PUT /settings/user/notifications
   */
  @Put('user/notifications')
  async updateNotificationSettings(
    @Request() req: any,
    @Body() dto: NotificationSettingsDto,
  ) {
    return this.settingsService.updateNotificationSettings(req.user.id, dto);
  }

  /**
   * Update security settings
   * PUT /settings/user/security
   */
  @Put('user/security')
  async updateSecuritySettings(
    @Request() req: any,
    @Body() dto: SecuritySettingsDto,
  ) {
    return this.settingsService.updateSecuritySettings(req.user.id, dto);
  }

  /**
   * Reset user settings to defaults
   * POST /settings/user/reset
   */
  @Post('user/reset')
  @HttpCode(HttpStatus.OK)
  async resetUserSettings(@Request() req: any) {
    return this.settingsService.resetUserSettings(req.user.id);
  }

  /**
   * Export user settings
   * GET /settings/user/export
   */
  @Get('user/export')
  async exportUserSettings(@Request() req: any) {
    return this.settingsService.exportUserSettings(req.user.id);
  }

  /**
   * Import user settings
   * POST /settings/user/import
   */
  @Post('user/import')
  async importUserSettings(
    @Request() req: any,
    @Body() importData: Record<string, any>,
  ) {
    return this.settingsService.importUserSettings(req.user.id, importData);
  }

  // ==================== Organization Settings ====================

  /**
   * Get organization settings
   * GET /settings/organization/:id
   */
  @Get('organization/:id')
  async getOrganizationSettings(@Param('id', ParseIntPipe) organizationId: number) {
    return this.settingsService.getOrganizationSettings(organizationId);
  }

  /**
   * Update organization settings
   * PUT /settings/organization/:id
   */
  @Put('organization/:id')
  async updateOrganizationSettings(
    @Param('id', ParseIntPipe) organizationId: number,
    @Body() dto: OrganizationSettingsDto,
  ) {
    return this.settingsService.updateOrganizationSettings(organizationId, dto);
  }

  /**
   * Update label settings
   * PUT /settings/organization/:id/labels
   */
  @Put('organization/:id/labels')
  async updateLabelSettings(
    @Param('id', ParseIntPipe) organizationId: number,
    @Body() dto: LabelSettingsDto,
  ) {
    return this.settingsService.updateLabelSettings(organizationId, dto);
  }

  /**
   * Update API settings
   * PUT /settings/organization/:id/api
   */
  @Put('organization/:id/api')
  async updateApiSettings(
    @Param('id', ParseIntPipe) organizationId: number,
    @Body() dto: ApiSettingsDto,
  ) {
    return this.settingsService.updateApiSettings(organizationId, dto);
  }

  // ==================== Warehouse Settings ====================

  /**
   * Get warehouse settings
   * GET /settings/warehouse/:id
   */
  @Get('warehouse/:id')
  async getWarehouseSettings(@Param('id', ParseIntPipe) warehouseId: number) {
    return this.settingsService.getWarehouseSettings(warehouseId);
  }

  /**
   * Update warehouse settings
   * PUT /settings/warehouse/:id
   */
  @Put('warehouse/:id')
  async updateWarehouseSettings(
    @Param('id', ParseIntPipe) warehouseId: number,
    @Body() dto: WarehouseSettingsDto,
  ) {
    return this.settingsService.updateWarehouseSettings(warehouseId, dto);
  }
}
