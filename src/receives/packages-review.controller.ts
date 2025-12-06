import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsArray, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { ReceivesService } from './receives.service';
import {
  ReceivesFilterDto,
  ApprovePackageDto,
  FlagPackageDto,
  CancelPackageDto,
} from './dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

type FlagBodyDto = Omit<FlagPackageDto, 'packageId'>;

class PackageReviewBatchActionDto {
  @IsOptional()
  @IsString()
  batchId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  packageIds: string[];

  @IsString()
  @IsIn(['approve', 'reject', 'flag'])
  action: 'approve' | 'reject' | 'flag';

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  severity?: string;
}

@Controller('packages')
@UseGuards(AuthGuard)
export class PackagesReviewController {
  constructor(private readonly receivesService: ReceivesService) {}

  /**
   * Alias for GET /packages/review
   * Mirrors Receive list endpoint but keeps public URI aligned with design.
   */
  @Get('review')
  async getReviewList(@Query() filter: ReceivesFilterDto, @CurrentUser() user: any) {
    return this.receivesService.getReceivesList(filter, user.id);
  }

  /**
   * Alias for PUT /packages/{id}/approve
   */
  @Put(':id/approve')
  async approvePackage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovePackageDto,
    @CurrentUser() user: any,
  ) {
    return this.receivesService.approvePackage(id, dto, user.id);
  }

  /**
   * Alias for PUT /packages/{id}/flag
   */
  @Put(':id/flag')
  async flagPackage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FlagBodyDto,
    @CurrentUser() user: any,
  ) {
    return this.receivesService.flagPackage({ ...dto, packageId: id }, user.id);
  }

  /**
   * Alias for PUT /packages/{id}/reject
   */
  @Put(':id/reject')
  async rejectPackage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelPackageDto,
    @CurrentUser() user: any,
  ) {
    return this.receivesService.cancelPackage(id, dto, user.id);
  }

  /**
   * Alias for GET /packages/{id}/review-details
   */
  @Get(':id/review-details')
  async getReviewDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.receivesService.getReceiveDetail(id);
  }

  /**
   * Alias for POST /packages/{id}/confirm-receipt
   */
  @Post(':id/confirm-receipt')
  async confirmReceipt(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovePackageDto,
    @CurrentUser() user: any,
  ) {
    return this.receivesService.approvePackage(id, dto, user.id);
  }

  /**
   * Alias for POST /packages/batch-action
   */
  @Post('batch-action')
  @HttpCode(HttpStatus.OK)
  async handleBatchAction(
    @Body() dto: PackageReviewBatchActionDto,
    @CurrentUser() user: any,
  ) {
    switch (dto.action) {
      case 'approve':
        return this.receivesService.bulkApprove(dto.packageIds, user.id);
      case 'reject':
        if (!dto.reason) {
          throw new BadRequestException('reason is required to reject packages');
        }
        return this.receivesService.bulkCancel(dto.packageIds, dto.reason, user.id);
      case 'flag':
        if (!dto.reason) {
          throw new BadRequestException('reason is required to flag packages');
        }
        for (const packageId of dto.packageIds) {
          await this.receivesService.flagPackage(
            {
              packageId,
              reason: dto.reason,
              notes: dto.notes,
            },
            user.id,
          );
        }
        return {
          status: 'success',
          processed: dto.packageIds.length,
          successful: dto.packageIds.length,
          failed: 0,
          details: dto.packageIds.map((packageId) => ({ packageId, status: 'flagged' })),
        };
      default:
        throw new BadRequestException(`Unsupported batch action: ${dto.action}`);
    }
  }
}
