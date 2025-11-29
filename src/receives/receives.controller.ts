import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
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
} from './dto';

@Controller('receives')
@UseGuards(AuthGuard)
export class ReceivesController {
  constructor(private readonly service: ReceivesService) {}

  /**
   * Get receives as Kanban board - matches design layout
   * GET /receives/kanban
   */
  @Get('kanban')
  async getKanbanBoard(@Query() filter: ReceivesFilterDto, @CurrentUser() user: any) {
    return this.service.getKanbanBoard(filter, user.id);
  }

  /**
   * Get receives as paginated list
   * GET /receives/list
   */
  @Get('list')
  async getList(@Query() filter: ReceivesFilterDto, @CurrentUser() user: any) {
    return this.service.getReceivesList(filter, user.id);
  }

  /**
   * Get receive statistics
   * GET /receives/stats
   */
  @Get('stats')
  async getStats(@Query() filter: ReceivesFilterDto) {
    return this.service.getStats(filter);
  }

  /**
   * Get single receive detail
   * GET /receives/:id
   */
  @Get(':id')
  async getDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getReceiveDetail(id);
  }

  /**
   * Create new receive/package
   * POST /receives
   */
  @Post()
  async create(@Body() dto: CreateReceiveDto, @CurrentUser() user: any) {
    return this.service.createReceive(dto, user.id);
  }

  /**
   * Update receive status
   * PATCH /receives/:id/status
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReceiveStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateStatus(id, dto, user.id);
  }

  /**
   * Bulk update statuses
   * PUT /receives/bulk-status
   */
  @Put('bulk-status')
  async bulkUpdateStatus(@Body() dto: BulkUpdateStatusDto, @CurrentUser() user: any) {
    return this.service.bulkUpdateStatus(dto, user.id);
  }

  /**
   * Move package (Kanban drag-drop)
   * POST /receives/move
   */
  @Post('move')
  async movePackage(@Body() dto: MovePackageDto, @CurrentUser() user: any) {
    return this.service.movePackage(dto, user.id);
  }

  /**
   * Flag a package
   * POST /receives/flag
   */
  @Post('flag')
  async flagPackage(@Body() dto: FlagPackageDto, @CurrentUser() user: any) {
    return this.service.flagPackage(dto, user.id);
  }
}
