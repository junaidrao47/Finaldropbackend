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
import { CarriersService } from './carriers.service';
import { CreateCarrierDto, UpdateCarrierDto, CarrierFilterDto } from './dto/carrier.dto';

@Controller('carriers')
@UseGuards(AuthGuard('jwt'))
export class CarriersController {
  constructor(private readonly carriersService: CarriersService) {}

  /**
   * Create a new carrier
   * POST /carriers
   */
  @Post()
  async create(@Body() dto: CreateCarrierDto, @Request() req: any) {
    const createdBy = req.user?.sub || req.user?.id;
    return this.carriersService.create(dto, createdBy);
  }

  /**
   * Get all carriers with filters
   * GET /carriers
   */
  @Get()
  async findAll(@Query() filter: CarrierFilterDto) {
    return this.carriersService.findAll(filter);
  }

  /**
   * Get active carriers for dropdown
   * GET /carriers/active
   */
  @Get('active')
  async getActiveCarriers() {
    return this.carriersService.getActiveCarriers();
  }

  /**
   * Get carrier stats
   * GET /carriers/stats
   */
  @Get('stats')
  async getStats() {
    return this.carriersService.getStats();
  }

  /**
   * Get carrier by ID
   * GET /carriers/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.carriersService.findById(id);
  }

  /**
   * Update carrier
   * PUT /carriers/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCarrierDto,
    @Request() req: any,
  ) {
    const updatedBy = req.user?.sub || req.user?.id;
    return this.carriersService.update(id, dto, updatedBy);
  }

  /**
   * Restore soft-deleted carrier
   * POST /carriers/:id/restore
   */
  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id') id: string, @Request() req: any) {
    const restoredBy = req.user?.sub || req.user?.id;
    return this.carriersService.restore(id, restoredBy);
  }

  /**
   * Soft delete carrier
   * DELETE /carriers/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req: any) {
    const deletedBy = req.user?.sub || req.user?.id;
    await this.carriersService.remove(id, deletedBy);
  }

  /**
   * Hard delete carrier (permanent)
   * DELETE /carriers/:id/permanent
   */
  @Delete(':id/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDelete(@Param('id') id: string) {
    await this.carriersService.hardDelete(id);
  }
}
