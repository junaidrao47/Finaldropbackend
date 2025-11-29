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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WarehousesService } from './warehouses.service';

@Controller('warehouses')
@UseGuards(AuthGuard('jwt'))
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  // ==================== Warehouse Endpoints ====================

  /**
   * Create a new warehouse
   * POST /warehouses
   */
  @Post()
  async create(@Body() dto: any, @Request() req: any) {
    const createdBy = req.user?.sub || req.user?.id;
    return this.warehousesService.create(dto, createdBy);
  }

  /**
   * Get all warehouses with filters
   * GET /warehouses
   */
  @Get()
  async findAll(@Query() filter: any) {
    return this.warehousesService.findAll(filter);
  }

  /**
   * Get active warehouses for dropdown
   * GET /warehouses/active/:organizationId
   */
  @Get('active/:organizationId')
  async getActiveWarehouses(@Param('organizationId') organizationId: string) {
    return this.warehousesService.getActiveWarehouses(organizationId);
  }

  /**
   * Get warehouse stats
   * GET /warehouses/stats/:organizationId
   */
  @Get('stats/:organizationId')
  async getStats(@Param('organizationId') organizationId: string) {
    return this.warehousesService.getStats(organizationId);
  }

  /**
   * Get warehouse by ID
   * GET /warehouses/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.warehousesService.findById(id);
  }

  /**
   * Update warehouse
   * PUT /warehouses/:id
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
    const updatedBy = req.user?.sub || req.user?.id;
    return this.warehousesService.update(id, dto, updatedBy);
  }

  /**
   * Restore soft-deleted warehouse
   * POST /warehouses/:id/restore
   */
  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id') id: string, @Request() req: any) {
    const restoredBy = req.user?.sub || req.user?.id;
    return this.warehousesService.restore(id, restoredBy);
  }

  /**
   * Lock warehouse
   * POST /warehouses/:id/lock
   */
  @Post(':id/lock')
  @HttpCode(HttpStatus.OK)
  async lock(@Param('id') id: string, @Request() req: any) {
    const updatedBy = req.user?.sub || req.user?.id;
    return this.warehousesService.toggleLock(id, true, updatedBy);
  }

  /**
   * Unlock warehouse
   * POST /warehouses/:id/unlock
   */
  @Post(':id/unlock')
  @HttpCode(HttpStatus.OK)
  async unlock(@Param('id') id: string, @Request() req: any) {
    const updatedBy = req.user?.sub || req.user?.id;
    return this.warehousesService.toggleLock(id, false, updatedBy);
  }

  /**
   * Activate warehouse
   * POST /warehouses/:id/activate
   */
  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  async activate(@Param('id') id: string, @Request() req: any) {
    const updatedBy = req.user?.sub || req.user?.id;
    return this.warehousesService.setActive(id, true, updatedBy);
  }

  /**
   * Deactivate warehouse
   * POST /warehouses/:id/deactivate
   */
  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id') id: string, @Request() req: any) {
    const updatedBy = req.user?.sub || req.user?.id;
    return this.warehousesService.setActive(id, false, updatedBy);
  }

  /**
   * Soft delete warehouse
   * DELETE /warehouses/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req: any) {
    const deletedBy = req.user?.sub || req.user?.id;
    await this.warehousesService.remove(id, deletedBy);
  }

  // ==================== Default Options Endpoints ====================

  /**
   * Create default options for warehouse
   * POST /warehouses/:id/default-options
   */
  @Post(':id/default-options')
  async createDefaultOptions(@Param('id') warehouseId: string, @Body() dto: any, @Request() req: any) {
    const createdBy = req.user?.sub || req.user?.id;
    return this.warehousesService.createDefaultOptions({ ...dto, warehouseId }, createdBy);
  }

  /**
   * Get default options for warehouse
   * GET /warehouses/:id/default-options
   */
  @Get(':id/default-options')
  async getDefaultOptions(@Param('id') warehouseId: string) {
    return this.warehousesService.getDefaultOptions(warehouseId);
  }

  /**
   * Update default options
   * PUT /warehouses/:id/default-options
   */
  @Put(':id/default-options')
  async updateDefaultOptions(@Param('id') warehouseId: string, @Body() dto: any, @Request() req: any) {
    const updatedBy = req.user?.sub || req.user?.id;
    return this.warehousesService.updateDefaultOptions(warehouseId, dto, updatedBy);
  }

  // ==================== Storage Layout Endpoints ====================

  /**
   * Create storage layout
   * POST /warehouses/:id/storage-layouts
   */
  @Post(':id/storage-layouts')
  async createStorageLayout(@Param('id') warehouseId: string, @Body() dto: any, @Request() req: any) {
    const createdBy = req.user?.sub || req.user?.id;
    return this.warehousesService.createStorageLayout({ ...dto, warehouseId }, createdBy);
  }

  /**
   * Get storage layouts for warehouse
   * GET /warehouses/:id/storage-layouts
   */
  @Get(':id/storage-layouts')
  async getStorageLayouts(
    @Param('id') warehouseId: string,
    @Query('isActive') isActive?: string,
    @Query('zone') zone?: string,
  ) {
    const filter: any = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (zone) filter.zone = zone;
    return this.warehousesService.getStorageLayouts(warehouseId, filter);
  }

  /**
   * Get storage layout stats for warehouse
   * GET /warehouses/:id/storage-layouts/stats
   */
  @Get(':id/storage-layouts/stats')
  async getStorageLayoutStats(@Param('id') warehouseId: string) {
    return this.warehousesService.getStorageLayoutStats(warehouseId);
  }

  /**
   * Get storage layout by ID
   * GET /warehouses/storage-layouts/:layoutId
   */
  @Get('storage-layouts/:layoutId')
  async getStorageLayoutById(@Param('layoutId') layoutId: string) {
    return this.warehousesService.getStorageLayoutById(layoutId);
  }

  /**
   * Update storage layout
   * PUT /warehouses/storage-layouts/:layoutId
   */
  @Put('storage-layouts/:layoutId')
  async updateStorageLayout(
    @Param('layoutId') layoutId: string,
    @Body() dto: any,
    @Request() req: any,
  ) {
    const updatedBy = req.user?.sub || req.user?.id;
    return this.warehousesService.updateStorageLayout(layoutId, dto, updatedBy);
  }

  /**
   * Delete storage layout
   * DELETE /warehouses/storage-layouts/:layoutId
   */
  @Delete('storage-layouts/:layoutId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeStorageLayout(@Param('layoutId') layoutId: string, @Request() req: any) {
    const deletedBy = req.user?.sub || req.user?.id;
    await this.warehousesService.removeStorageLayout(layoutId, deletedBy);
  }
}
