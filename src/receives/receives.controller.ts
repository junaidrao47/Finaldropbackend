import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ReceivesService } from './receives.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  ReceivesFilterDto,
  CreateReceiveDto,
  UpdateReceiveStatusDto,
  BulkUpdateStatusDto,
  MovePackageDto,
  FlagPackageDto,
  ApprovePackageDto,
  CancelPackageDto,
  UpdateReceiveDto,
  AddRemarkDto,
  SearchPackagesDto,
} from './dto';

/**
 * Receives Controller
 * 
 * API Endpoints for package receiving management.
 * Matches design with Kanban board, list views, and action buttons.
 * 
 * Rate Limits:
 * - Read operations: 100 requests per minute
 * - Write operations: 30 requests per minute
 * - Bulk operations: 10 requests per minute
 */
@Controller('receives')
@UseGuards(AuthGuard)
export class ReceivesController {
  constructor(private readonly service: ReceivesService) {}

  // ==================== Read Operations ====================

  /**
   * Get receives as Kanban board - matches design layout
   * GET /receives/kanban
   * 
   * Columns: Transferred, Flagged, Unassigned, Cancelled
   */
  @Get('kanban')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async getKanbanBoard(@Query() filter: ReceivesFilterDto, @CurrentUser() user: any) {
    return this.service.getKanbanBoard(filter, user.id);
  }

  /**
   * Get receives as paginated list
   * GET /receives/list
   */
  @Get('list')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async getList(@Query() filter: ReceivesFilterDto, @CurrentUser() user: any) {
    return this.service.getReceivesList(filter, user.id);
  }

  /**
   * Get receive statistics
   * GET /receives/stats
   */
  @Get('stats')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async getStats(@Query() filter: ReceivesFilterDto) {
    return this.service.getStats(filter);
  }

  /**
   * Search packages with autocomplete
   * GET /receives/search
   */
  @Get('search')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async search(@Query() dto: SearchPackagesDto) {
    return this.service.searchPackages(dto);
  }

  /**
   * Get single receive detail
   * GET /receives/:id
   */
  @Get(':id')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async getDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getReceiveDetail(id);
  }

  /**
   * Get package activity history - "View Activity" button
   * GET /receives/:id/activity
   */
  @Get(':id/activity')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async getActivity(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getPackageActivity(id);
  }

  // ==================== Write Operations ====================

  /**
   * Create new receive/package
   * POST /receives
   */
  @Post()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateReceiveDto, @CurrentUser() user: any) {
    return this.service.createReceive(dto, user.id);
  }

  /**
   * Update package details
   * PUT /receives/:id
   */
  @Put(':id')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReceiveDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePackage(id, dto, user.id);
  }

  /**
   * Update receive status
   * PATCH /receives/:id/status
   */
  @Patch(':id/status')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReceiveStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateStatus(id, dto, user.id);
  }

  /**
   * Approve package - "Approve" button action
   * POST /receives/:id/approve
   */
  @Post(':id/approve')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovePackageDto,
    @CurrentUser() user: any,
  ) {
    return this.service.approvePackage(id, dto, user.id);
  }

  /**
   * Cancel package - "Cancel" button action
   * POST /receives/:id/cancel
   */
  @Post(':id/cancel')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelPackageDto,
    @CurrentUser() user: any,
  ) {
    return this.service.cancelPackage(id, dto, user.id);
  }

  /**
   * Flag a package
   * POST /receives/:id/flag
   */
  @Post(':id/flag')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async flag(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Omit<FlagPackageDto, 'packageId'>,
    @CurrentUser() user: any,
  ) {
    return this.service.flagPackage({ ...dto, packageId: id }, user.id);
  }

  /**
   * Add remark to package
   * POST /receives/:id/remarks
   */
  @Post(':id/remarks')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async addRemark(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddRemarkDto,
    @CurrentUser() user: any,
  ) {
    return this.service.addRemark(id, dto, user.id);
  }

  /**
   * Move package (Kanban drag-drop)
   * POST /receives/move
   */
  @Post('move')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async movePackage(@Body() dto: MovePackageDto, @CurrentUser() user: any) {
    return this.service.movePackage(dto, user.id);
  }

  /**
   * Delete package (soft delete)
   * DELETE /receives/:id
   */
  @Delete(':id')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.deletePackage(id, user.id);
  }

  // ==================== Bulk Operations ====================

  /**
   * Bulk update statuses
   * PUT /receives/bulk/status
   */
  @Put('bulk/status')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async bulkUpdateStatus(@Body() dto: BulkUpdateStatusDto, @CurrentUser() user: any) {
    return this.service.bulkUpdateStatus(dto, user.id);
  }

  /**
   * Bulk approve packages
   * POST /receives/bulk/approve
   */
  @Post('bulk/approve')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async bulkApprove(
    @Body() dto: { packageIds: string[] },
    @CurrentUser() user: any,
  ) {
    return this.service.bulkApprove(dto.packageIds, user.id);
  }

  /**
   * Bulk cancel packages
   * POST /receives/bulk/cancel
   */
  @Post('bulk/cancel')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async bulkCancel(
    @Body() dto: { packageIds: string[]; reason: string },
    @CurrentUser() user: any,
  ) {
    return this.service.bulkCancel(dto.packageIds, dto.reason, user.id);
  }
}
