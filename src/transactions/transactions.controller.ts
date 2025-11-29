import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AuthGuard } from '../common/guards/auth.guard';
import {
  ReceivePackageDto,
  AssignStorageDto,
  AddPackagePhotoDto,
  CompleteReceiptDto,
  PrepareDeliveryDto,
  StartDeliveryDto,
  CompleteDeliveryDto,
  DeliveryFailedDto,
  InitiateReturnDto,
  ProcessReturnDto,
  UpdateTransactionStatusDto,
  BulkStatusUpdateDto,
} from './dto/transaction.dto';

@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // ================== RECEIVE FLOW ==================

  /**
   * Receive a new package (AGNT-001)
   * POST /transactions/receive
   */
  @Post('receive')
  async receivePackage(@Body() dto: ReceivePackageDto, @Request() req: any) {
    return this.transactionsService.receivePackage(dto, req.user.id);
  }

  /**
   * Assign storage location (AGNT-002)
   * POST /transactions/receive/assign-storage
   */
  @Post('receive/assign-storage')
  async assignStorage(@Body() dto: AssignStorageDto, @Request() req: any) {
    await this.transactionsService.assignStorage(dto, req.user.id);
    return { success: true, message: 'Storage location assigned' };
  }

  /**
   * Add package photo
   * POST /transactions/packages/:id/photos
   */
  @Post('packages/:id/photos')
  async addPackagePhoto(
    @Param('id') packageId: string,
    @Body() dto: Omit<AddPackagePhotoDto, 'packageId'>,
    @Request() req: any,
  ) {
    return this.transactionsService.addPackagePhoto(
      { ...dto, packageId },
      req.user.id,
    );
  }

  /**
   * Complete package receipt
   * POST /transactions/receive/complete
   */
  @Post('receive/complete')
  async completeReceipt(@Body() dto: CompleteReceiptDto, @Request() req: any) {
    await this.transactionsService.completeReceipt(dto, req.user.id);
    return { success: true, message: 'Receipt completed' };
  }

  // ================== DELIVER FLOW ==================

  /**
   * Prepare package for delivery (AGNT-003)
   * POST /transactions/deliver/prepare
   */
  @Post('deliver/prepare')
  async prepareDelivery(@Body() dto: PrepareDeliveryDto, @Request() req: any) {
    await this.transactionsService.prepareDelivery(dto, req.user.id);
    return { success: true, message: 'Package prepared for delivery' };
  }

  /**
   * Start delivery - mark packages as out for delivery
   * POST /transactions/deliver/start
   */
  @Post('deliver/start')
  async startDelivery(@Body() dto: StartDeliveryDto, @Request() req: any) {
    return this.transactionsService.startDelivery(dto, req.user.id);
  }

  /**
   * Complete delivery with POD (AGNT-004)
   * POST /transactions/deliver/complete
   */
  @Post('deliver/complete')
  async completeDelivery(@Body() dto: CompleteDeliveryDto, @Request() req: any) {
    await this.transactionsService.completeDelivery(dto, req.user.id);
    return { success: true, message: 'Delivery completed' };
  }

  /**
   * Mark delivery as failed
   * POST /transactions/deliver/failed
   */
  @Post('deliver/failed')
  async deliveryFailed(@Body() dto: DeliveryFailedDto, @Request() req: any) {
    await this.transactionsService.deliveryFailed(dto, req.user.id);
    return { success: true, message: 'Delivery failure recorded' };
  }

  // ================== RETURN FLOW ==================

  /**
   * Initiate a return (AGNT-005)
   * POST /transactions/return/initiate
   */
  @Post('return/initiate')
  async initiateReturn(@Body() dto: InitiateReturnDto, @Request() req: any) {
    await this.transactionsService.initiateReturn(dto, req.user.id);
    return { success: true, message: 'Return initiated' };
  }

  /**
   * Process a return
   * POST /transactions/return/process
   */
  @Post('return/process')
  async processReturn(@Body() dto: ProcessReturnDto, @Request() req: any) {
    await this.transactionsService.processReturn(dto, req.user.id);
    return { success: true, message: 'Return processed' };
  }

  // ================== COMMON OPERATIONS ==================

  /**
   * Update package status
   * PUT /transactions/packages/:id/status
   */
  @Put('packages/:id/status')
  async updateStatus(
    @Param('id') packageId: string,
    @Body() dto: Omit<UpdateTransactionStatusDto, 'packageId'>,
    @Request() req: any,
  ) {
    await this.transactionsService.updateStatus(
      { ...dto, packageId },
      req.user.id,
    );
    return { success: true, message: 'Status updated' };
  }

  /**
   * Bulk status update
   * PUT /transactions/packages/bulk-status
   */
  @Put('packages/bulk-status')
  async bulkStatusUpdate(@Body() dto: BulkStatusUpdateDto, @Request() req: any) {
    return this.transactionsService.bulkStatusUpdate(dto, req.user.id);
  }

  /**
   * Get package details with timeline
   * GET /transactions/packages/:id
   */
  @Get('packages/:id')
  async getPackageDetails(@Param('id') packageId: string) {
    return this.transactionsService.getPackageDetails(packageId);
  }
}
