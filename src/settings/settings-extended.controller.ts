import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';

// Services
import { ContactsSettingsService } from './contacts-settings.service';
import { BlacklistSettingsService } from './blacklist-settings.service';
import { WarningMessagesService } from './warning-messages.service';
import { LinkedDevicesService } from './linked-devices.service';
import { SupportService } from './support.service';
import { ReportsService } from './reports.service';

// DTOs
import {
  CreateContactDto,
  UpdateContactDto,
  ContactFilterDto,
  ContactType,
  AddToBlacklistDto,
  UpdateBlacklistDto,
  BlacklistFilterDto,
  BlacklistType,
  CreateWarningMessageDto,
  UpdateWarningMessageDto,
  WarningMessageFilterDto,
  LinkedDeviceFilterDto,
  UpdateLinkedDeviceDto,
  CreateSupportTicketDto,
  UpdateSupportTicketDto,
  SupportTicketFilterDto,
  AddTicketMessageDto,
  CreateAppRatingDto,
  CreateReportDto,
  UpdateReportDto,
  ReportFilterDto,
  GenerateReportDto,
} from './dto/settings-extended.dto';

@Controller('settings')
@UseGuards(AuthGuard('jwt'))
export class SettingsExtendedController {
  constructor(
    private readonly contactsService: ContactsSettingsService,
    private readonly blacklistService: BlacklistSettingsService,
    private readonly warningMessagesService: WarningMessagesService,
    private readonly linkedDevicesService: LinkedDevicesService,
    private readonly supportService: SupportService,
    private readonly reportsService: ReportsService,
  ) {}

  // ==================== Contacts Management ====================

  /**
   * Get all contacts
   * GET /settings/contacts
   */
  @Get('contacts')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async getContacts(@Request() req: any, @Query() filters: ContactFilterDto) {
    return this.contactsService.getContacts(req.user.organizationId, filters);
  }

  /**
   * Get single contact
   * GET /settings/contacts/:id
   */
  @Get('contacts/:id')
  async getContact(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contactsService.getContact(id, req.user.organizationId);
  }

  /**
   * Create contact
   * POST /settings/contacts
   */
  @Post('contacts')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async createContact(@Request() req: any, @Body() dto: CreateContactDto) {
    return this.contactsService.createContact(
      req.user.organizationId,
      dto,
      req.user.id,
    );
  }

  /**
   * Update contact
   * PUT /settings/contacts/:id
   */
  @Put('contacts/:id')
  async updateContact(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.updateContact(
      id,
      req.user.organizationId,
      dto,
      req.user.id,
    );
  }

  /**
   * Delete contact
   * DELETE /settings/contacts/:id
   */
  @Delete('contacts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteContact(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.contactsService.deleteContact(id, req.user.organizationId, req.user.id);
  }

  /**
   * Toggle contact status
   * POST /settings/contacts/:id/toggle
   */
  @Post('contacts/:id/toggle')
  async toggleContactStatus(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contactsService.toggleContactStatus(id, req.user.organizationId, req.user.id);
  }

  /**
   * Export contacts
   * GET /settings/contacts/export
   */
  @Get('contacts/export/all')
  async exportContacts(@Request() req: any, @Query('type') type?: ContactType) {
    return this.contactsService.exportContacts(req.user.organizationId, type);
  }

  /**
   * Bulk import contacts
   * POST /settings/contacts/import
   */
  @Post('contacts/import')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async importContacts(@Request() req: any, @Body() contacts: CreateContactDto[]) {
    return this.contactsService.bulkImport(req.user.organizationId, contacts, req.user.id);
  }

  // ==================== Blacklist Management ====================

  /**
   * Get blacklist entries
   * GET /settings/blacklist
   */
  @Get('blacklist')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async getBlacklist(@Request() req: any, @Query() filters: BlacklistFilterDto) {
    return this.blacklistService.getBlacklist(req.user.organizationId, filters);
  }

  /**
   * Get blacklist stats
   * GET /settings/blacklist/stats
   */
  @Get('blacklist/stats')
  async getBlacklistStats(@Request() req: any) {
    return this.blacklistService.getBlacklistStats(req.user.organizationId);
  }

  /**
   * Get single blacklist entry
   * GET /settings/blacklist/:id
   */
  @Get('blacklist/:id')
  async getBlacklistEntry(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.blacklistService.getBlacklistEntry(id, req.user.organizationId);
  }

  /**
   * Add to blacklist
   * POST /settings/blacklist
   */
  @Post('blacklist')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async addToBlacklist(@Request() req: any, @Body() dto: AddToBlacklistDto) {
    return this.blacklistService.addToBlacklist(
      req.user.organizationId,
      dto,
      req.user.id,
    );
  }

  /**
   * Update blacklist entry
   * PUT /settings/blacklist/:id
   */
  @Put('blacklist/:id')
  async updateBlacklistEntry(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBlacklistDto,
  ) {
    return this.blacklistService.updateBlacklistEntry(
      id,
      req.user.organizationId,
      dto,
      req.user.id,
    );
  }

  /**
   * Archive blacklist entry
   * POST /settings/blacklist/:id/archive
   */
  @Post('blacklist/:id/archive')
  async archiveBlacklistEntry(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.blacklistService.archiveBlacklistEntry(id, req.user.organizationId, req.user.id);
  }

  /**
   * Restore blacklist entry
   * POST /settings/blacklist/:id/restore
   */
  @Post('blacklist/:id/restore')
  async restoreBlacklistEntry(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.blacklistService.restoreBlacklistEntry(id, req.user.organizationId, req.user.id);
  }

  /**
   * Remove from blacklist
   * DELETE /settings/blacklist/:id
   */
  @Delete('blacklist/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFromBlacklist(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.blacklistService.removeFromBlacklist(id, req.user.organizationId, req.user.id);
  }

  /**
   * Check if entity is blacklisted
   * POST /settings/blacklist/check
   */
  @Post('blacklist/check')
  async checkBlacklisted(
    @Request() req: any,
    @Body() body: { type: BlacklistType; email?: string; phone?: string; entityId?: string },
  ) {
    const isBlacklisted = await this.blacklistService.isBlacklisted(
      req.user.organizationId,
      body.type,
      { email: body.email, phone: body.phone, entityId: body.entityId },
    );
    return { isBlacklisted };
  }

  // ==================== Warning Messages ====================

  /**
   * Get warning messages
   * GET /settings/warning-messages
   */
  @Get('warning-messages')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async getWarningMessages(@Request() req: any, @Query() filters: WarningMessageFilterDto) {
    return this.warningMessagesService.getWarningMessages(req.user.organizationId, filters);
  }

  /**
   * Get warning message stats
   * GET /settings/warning-messages/stats
   */
  @Get('warning-messages/stats')
  async getWarningMessageStats(@Request() req: any) {
    return this.warningMessagesService.getWarningMessageStats(req.user.organizationId);
  }

  /**
   * Get active warnings for type (for display)
   * GET /settings/warning-messages/active/:type
   */
  @Get('warning-messages/active/:type')
  async getActiveWarnings(@Request() req: any, @Param('type') type: ContactType) {
    return this.warningMessagesService.getActiveWarningsForType(req.user.organizationId, type);
  }

  /**
   * Get single warning message
   * GET /settings/warning-messages/:id
   */
  @Get('warning-messages/:id')
  async getWarningMessage(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.warningMessagesService.getWarningMessage(id, req.user.organizationId);
  }

  /**
   * Create warning message
   * POST /settings/warning-messages
   */
  @Post('warning-messages')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async createWarningMessage(@Request() req: any, @Body() dto: CreateWarningMessageDto) {
    return this.warningMessagesService.createWarningMessage(
      req.user.organizationId,
      dto,
      req.user.id,
    );
  }

  /**
   * Update warning message
   * PUT /settings/warning-messages/:id
   */
  @Put('warning-messages/:id')
  async updateWarningMessage(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarningMessageDto,
  ) {
    return this.warningMessagesService.updateWarningMessage(
      id,
      req.user.organizationId,
      dto,
      req.user.id,
    );
  }

  /**
   * Archive warning message
   * POST /settings/warning-messages/:id/archive
   */
  @Post('warning-messages/:id/archive')
  async archiveWarningMessage(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.warningMessagesService.archiveWarningMessage(id, req.user.organizationId, req.user.id);
  }

  /**
   * Restore warning message
   * POST /settings/warning-messages/:id/restore
   */
  @Post('warning-messages/:id/restore')
  async restoreWarningMessage(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.warningMessagesService.restoreWarningMessage(id, req.user.organizationId, req.user.id);
  }

  /**
   * Delete warning message
   * DELETE /settings/warning-messages/:id
   */
  @Delete('warning-messages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteWarningMessage(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.warningMessagesService.deleteWarningMessage(id, req.user.organizationId, req.user.id);
  }

  /**
   * Reorder warning messages
   * POST /settings/warning-messages/reorder
   */
  @Post('warning-messages/reorder')
  @HttpCode(HttpStatus.OK)
  async reorderWarningMessages(
    @Request() req: any,
    @Body() body: { orderedIds: string[] },
  ) {
    await this.warningMessagesService.reorderWarningMessages(
      req.user.organizationId,
      body.orderedIds,
      req.user.id,
    );
    return { success: true };
  }

  // ==================== Linked Devices ====================

  /**
   * Get user's linked devices
   * GET /settings/devices
   */
  @Get('devices')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async getLinkedDevices(@Request() req: any, @Query() filters: LinkedDeviceFilterDto) {
    return this.linkedDevicesService.getLinkedDevices(req.user.id, filters);
  }

  /**
   * Get device stats
   * GET /settings/devices/stats
   */
  @Get('devices/stats')
  async getDeviceStats(@Request() req: any) {
    return this.linkedDevicesService.getDeviceStats(req.user.id);
  }

  /**
   * Get single device
   * GET /settings/devices/:id
   */
  @Get('devices/:id')
  async getDevice(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.linkedDevicesService.getDevice(id, req.user.id);
  }

  /**
   * Update device
   * PUT /settings/devices/:id
   */
  @Put('devices/:id')
  async updateDevice(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLinkedDeviceDto,
  ) {
    return this.linkedDevicesService.updateDevice(id, req.user.id, dto);
  }

  /**
   * Toggle device trust
   * POST /settings/devices/:id/trust
   */
  @Post('devices/:id/trust')
  async toggleDeviceTrust(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.linkedDevicesService.toggleDeviceTrust(id, req.user.id);
  }

  /**
   * Revoke device
   * DELETE /settings/devices/:id
   */
  @Delete('devices/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeDevice(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.linkedDevicesService.revokeDevice(id, req.user.id);
  }

  /**
   * Revoke all devices except current
   * POST /settings/devices/revoke-all
   */
  @Post('devices/revoke-all')
  async revokeAllDevices(
    @Request() req: any,
    @Body() body: { currentDeviceFingerprint?: string },
  ) {
    return this.linkedDevicesService.revokeAllDevicesExcept(
      req.user.id,
      body.currentDeviceFingerprint || '',
    );
  }

  // ==================== Support Tickets ====================

  /**
   * Get support tickets
   * GET /settings/support/tickets
   */
  @Get('support/tickets')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async getTickets(@Request() req: any, @Query() filters: SupportTicketFilterDto) {
    return this.supportService.getTickets(req.user.id, filters, req.user.isAdmin, req.user.organizationId);
  }

  /**
   * Get ticket stats
   * GET /settings/support/tickets/stats
   */
  @Get('support/tickets/stats')
  async getTicketStats(@Request() req: any) {
    return this.supportService.getTicketStats(req.user.organizationId);
  }

  /**
   * Get single ticket
   * GET /settings/support/tickets/:id
   */
  @Get('support/tickets/:id')
  async getTicket(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.supportService.getTicket(id, req.user.id, req.user.isAdmin);
  }

  /**
   * Create support ticket
   * POST /settings/support/tickets
   */
  @Post('support/tickets')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async createTicket(@Request() req: any, @Body() dto: CreateSupportTicketDto) {
    return this.supportService.createTicket(req.user.id, dto, req.user.organizationId);
  }

  /**
   * Update ticket (admin only for status/assignment)
   * PUT /settings/support/tickets/:id
   */
  @Put('support/tickets/:id')
  async updateTicket(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupportTicketDto,
  ) {
    return this.supportService.updateTicket(id, dto, req.user.id);
  }

  /**
   * Add message to ticket
   * POST /settings/support/tickets/:id/messages
   */
  @Post('support/tickets/:id/messages')
  async addTicketMessage(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddTicketMessageDto,
  ) {
    return this.supportService.addMessage(id, dto, req.user.id, req.user.isAdmin);
  }

  /**
   * Close ticket
   * POST /settings/support/tickets/:id/close
   */
  @Post('support/tickets/:id/close')
  async closeTicket(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.supportService.closeTicket(id, req.user.id);
  }

  // ==================== Help & Support Content ====================

  /**
   * Get FAQ categories
   * GET /settings/support/faq/categories
   */
  @Get('support/faq/categories')
  getFaqCategories() {
    return this.supportService.getFaqCategories();
  }

  /**
   * Get FAQs
   * GET /settings/support/faq
   */
  @Get('support/faq')
  getFaqs(@Query('category') category?: string) {
    return this.supportService.getFaqs(category);
  }

  /**
   * Get support contact info
   * GET /settings/support/contact
   */
  @Get('support/contact')
  getSupportContactInfo() {
    return this.supportService.getSupportContactInfo();
  }

  // ==================== App Rating ====================

  /**
   * Submit app rating
   * POST /settings/rate
   */
  @Post('rate')
  @Throttle({ default: { limit: 3, ttl: 86400000 } }) // 3 per day
  async submitRating(@Request() req: any, @Body() dto: CreateAppRatingDto) {
    return this.supportService.submitRating(req.user.id, dto, req.user.organizationId);
  }

  /**
   * Get rating stats
   * GET /settings/rate/stats
   */
  @Get('rate/stats')
  async getRatingStats() {
    return this.supportService.getRatingStats();
  }

  /**
   * Get user's rating
   * GET /settings/rate/me
   */
  @Get('rate/me')
  async getUserRating(@Request() req: any) {
    return this.supportService.getUserRating(req.user.id);
  }

  // ==================== Reports ====================

  /**
   * Get saved reports
   * GET /settings/reports
   */
  @Get('reports')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async getReports(@Request() req: any, @Query() filters: ReportFilterDto) {
    return this.reportsService.getReports(req.user.organizationId, filters);
  }

  /**
   * Get report types
   * GET /settings/reports/types
   */
  @Get('reports/types')
  getReportTypes() {
    return this.reportsService.getReportTypes();
  }

  /**
   * Get quick stats for reports overview
   * GET /settings/reports/quick-stats
   */
  @Get('reports/quick-stats')
  async getQuickStats(@Request() req: any) {
    return this.reportsService.getQuickStats(req.user.organizationId);
  }

  /**
   * Get single report
   * GET /settings/reports/:id
   */
  @Get('reports/:id')
  async getReport(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reportsService.getReport(id, req.user.organizationId);
  }

  /**
   * Create saved report
   * POST /settings/reports
   */
  @Post('reports')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async createReport(@Request() req: any, @Body() dto: CreateReportDto) {
    return this.reportsService.createReport(req.user.organizationId, dto, req.user.id);
  }

  /**
   * Update report
   * PUT /settings/reports/:id
   */
  @Put('reports/:id')
  async updateReport(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReportDto,
  ) {
    return this.reportsService.updateReport(id, req.user.organizationId, dto, req.user.id);
  }

  /**
   * Delete report
   * DELETE /settings/reports/:id
   */
  @Delete('reports/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReport(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.reportsService.deleteReport(id, req.user.organizationId, req.user.id);
  }

  /**
   * Generate report data
   * POST /settings/reports/:id/generate
   */
  @Post('reports/:id/generate')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async generateReport(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() options: GenerateReportDto,
  ) {
    return this.reportsService.generateReportData(id, req.user.organizationId, options, req.user.id);
  }
}
