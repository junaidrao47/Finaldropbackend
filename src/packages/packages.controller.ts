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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { PackagesService } from './packages.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  CreatePackageDto,
  PackageFilterDto,
  CreatePackageRemarkDto,
  CreatePackageFileDto,
  CreatePackageTransferDto,
  ScanPackageDto,
  BulkPackageActionDto,
} from './dto/package.dto';

// File filter for uploads
const imageFilter = (req: any, file: Express.Multer.File, callback: Function) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|pdf)$/)) {
    return callback(new BadRequestException('Only image and PDF files are allowed'), false);
  }
  callback(null, true);
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Controller('packages')
@UseGuards(AuthGuard('jwt'))
export class PackagesController {
  constructor(
    private readonly packagesService: PackagesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ==================== Package CRUD Endpoints ====================

  /**
   * Create a new package
   * POST /packages
   */
  @Post()
  async create(@Body() dto: CreatePackageDto, @Request() req: any) {
    const createdBy = req.user?.sub || req.user?.id;
    return this.packagesService.create(dto, createdBy);
  }

  /**
   * Get all packages with filters
   * GET /packages
   */
  @Get()
  async findAll(@Query() filter: PackageFilterDto) {
    return this.packagesService.findAll(filter);
  }

  /**
   * Get recent packages for organization
   * GET /packages/recent/:organizationId
   */
  @Get('recent/:organizationId')
  async getRecent(
    @Param('organizationId') organizationId: string,
    @Query('limit') limit?: string,
  ) {
    return this.packagesService.getRecent(organizationId, limit ? parseInt(limit) : 10);
  }

  /**
   * Get package stats for dashboard
   * GET /packages/stats/:organizationId
   */
  @Get('stats/:organizationId')
  async getStats(
    @Param('organizationId') organizationId: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.packagesService.getStats(organizationId, warehouseId);
  }

  /**
   * Search packages
   * GET /packages/search
   */
  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('organizationId') organizationId: string,
    @Query('limit') limit?: string,
  ) {
    return this.packagesService.search(query, organizationId, limit ? parseInt(limit) : 20);
  }

  /**
   * Get remark types
   * GET /packages/remark-types
   */
  @Get('remark-types')
  async getRemarkTypes() {
    return this.packagesService.getRemarkTypes();
  }

  /**
   * Get package by ID
   * GET /packages/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.packagesService.findById(id);
  }

  /**
   * Update package
   * PUT /packages/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: CreatePackageDto,
    @Request() req: any,
  ) {
    const updatedBy = req.user?.sub || req.user?.id;
    return this.packagesService.update(id, dto, updatedBy);
  }

  /**
   * Update package status
   * PUT /packages/:id/status
   */
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Request() req: any,
  ) {
    const updatedBy = req.user?.sub || req.user?.id;
    return this.packagesService.updateStatus(id, status, updatedBy);
  }

  /**
   * Update package storage location
   * PUT /packages/:id/location
   */
  @Put(':id/location')
  async updateLocation(
    @Param('id') id: string,
    @Body() location: { zone?: string; isle?: string; shelf?: string; bin?: string },
    @Request() req: any,
  ) {
    const updatedBy = req.user?.sub || req.user?.id;
    return this.packagesService.updateStorageLocation(id, location, updatedBy);
  }

  /**
   * Restore soft-deleted package
   * POST /packages/:id/restore
   */
  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id') id: string, @Request() req: any) {
    const restoredBy = req.user?.sub || req.user?.id;
    return this.packagesService.restore(id, restoredBy);
  }

  /**
   * Soft delete package
   * DELETE /packages/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req: any) {
    const deletedBy = req.user?.sub || req.user?.id;
    await this.packagesService.remove(id, deletedBy);
  }

  // ==================== Bulk Actions ====================

  /**
   * Bulk package action
   * POST /packages/bulk
   */
  @Post('bulk')
  async bulkAction(@Body() dto: BulkPackageActionDto, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;

    switch (dto.action) {
      case 'updateStatus':
        if (!dto.newStatus) {
          throw new Error('newStatus is required for updateStatus action');
        }
        return this.packagesService.bulkUpdateStatus(dto.packageIds, dto.newStatus, userId);

      case 'delete':
        return this.packagesService.bulkDelete(dto.packageIds, userId);

      default:
        throw new Error(`Unknown bulk action: ${dto.action}`);
    }
  }

  // ==================== Scan Endpoints ====================

  /**
   * Scan package for receive
   * POST /packages/scan/receive
   */
  @Post('scan/receive')
  async scanForReceive(@Body() dto: ScanPackageDto, @Request() req: any) {
    const organizationId = dto.warehouseId; // Should get from context or DTO
    return this.packagesService.scanForReceive(dto.trackingNumber, organizationId!, dto.warehouseId);
  }

  /**
   * Scan package for deliver
   * POST /packages/scan/deliver
   */
  @Post('scan/deliver')
  async scanForDeliver(@Body() dto: ScanPackageDto, @Request() req: any) {
    const organizationId = dto.warehouseId; // Should get from context or DTO
    return this.packagesService.scanForDeliver(dto.trackingNumber, organizationId!);
  }

  // ==================== Remarks Endpoints ====================

  /**
   * Create remark for package
   * POST /packages/:id/remarks
   */
  @Post(':id/remarks')
  async createRemark(
    @Param('id') packageId: string,
    @Body() dto: CreatePackageRemarkDto,
    @Request() req: any,
  ) {
    const createdBy = req.user?.sub || req.user?.id;
    const organizationId = req.user?.organizationId; // Needs to come from user context
    return this.packagesService.createRemark({ ...dto, packageId }, organizationId, createdBy);
  }

  /**
   * Get remarks for package
   * GET /packages/:id/remarks
   */
  @Get(':id/remarks')
  async getRemarks(@Param('id') packageId: string) {
    return this.packagesService.getRemarks(packageId);
  }

  /**
   * Delete remark
   * DELETE /packages/remarks/:remarkId
   */
  @Delete('remarks/:remarkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRemark(@Param('remarkId') remarkId: string, @Request() req: any) {
    const deletedBy = req.user?.sub || req.user?.id;
    await this.packagesService.deleteRemark(remarkId, deletedBy);
  }

  // ==================== Files Endpoints ====================

  /**
   * Upload file for package
   * POST /packages/:id/files
   */
  @Post(':id/files')
  async createFile(
    @Param('id') packageId: string,
    @Body() dto: CreatePackageFileDto,
    @Request() req: any,
  ) {
    const createdBy = req.user?.sub || req.user?.id;
    const organizationId = req.user?.organizationId;
    return this.packagesService.createFile({ ...dto, packageId }, organizationId, createdBy);
  }

  /**
   * Upload package image via Cloudinary
   * POST /packages/:id/upload/image
   */
  @Post(':id/upload/image')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadPackageImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') packageId: string,
    @Body('description') description: string,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const organizationId = req.user?.organizationId;
    return this.cloudinaryService.uploadPackageImage(file, packageId, organizationId, description);
  }

  /**
   * Upload multiple package images via Cloudinary
   * POST /packages/:id/upload/images
   */
  @Post(':id/upload/images')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      fileFilter: imageFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadPackageImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('id') packageId: string,
    @Request() req: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }
    const organizationId = req.user?.organizationId;
    const results = await Promise.all(
      files.map(file => this.cloudinaryService.uploadPackageImage(file, packageId, organizationId)),
    );
    return results;
  }

  /**
   * Upload shipping label via Cloudinary
   * POST /packages/:id/upload/label
   */
  @Post(':id/upload/label')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadShippingLabel(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') packageId: string,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const organizationId = req.user?.organizationId;
    return this.cloudinaryService.uploadShippingLabel(file, packageId, organizationId);
  }

  /**
   * Get files for package
   * GET /packages/:id/files
   */
  @Get(':id/files')
  async getFiles(@Param('id') packageId: string) {
    return this.packagesService.getFiles(packageId);
  }

  /**
   * Get files by type
   * GET /packages/:id/files/:type
   */
  @Get(':id/files/:type')
  async getFilesByType(
    @Param('id') packageId: string,
    @Param('type') fileType: string,
  ) {
    return this.packagesService.getFilesByType(packageId, fileType);
  }

  /**
   * Delete file
   * DELETE /packages/files/:fileId
   */
  @Delete('files/:fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(@Param('fileId') fileId: string, @Request() req: any) {
    const deletedBy = req.user?.sub || req.user?.id;
    await this.packagesService.deleteFile(fileId, deletedBy);
  }

  // ==================== Transfers Endpoints ====================

  /**
   * Create transfer record
   * POST /packages/:id/transfers
   */
  @Post(':id/transfers')
  async createTransfer(
    @Param('id') packageId: string,
    @Body() dto: CreatePackageTransferDto,
    @Request() req: any,
  ) {
    const createdBy = req.user?.sub || req.user?.id;
    return this.packagesService.createTransfer({ ...dto, packageId }, createdBy);
  }

  /**
   * Get transfer history for package
   * GET /packages/:id/transfers
   */
  @Get(':id/transfers')
  async getTransferHistory(@Param('id') packageId: string) {
    return this.packagesService.getTransferHistory(packageId);
  }

  // ==================== Remark Types ====================

  /**
   * Create remark type
   * POST /packages/remark-types
   */
  @Post('remark-types')
  async createRemarkType(@Body() data: any, @Request() req: any) {
    const createdBy = req.user?.sub || req.user?.id;
    return this.packagesService.createRemarkType(data, createdBy);
  }
}
