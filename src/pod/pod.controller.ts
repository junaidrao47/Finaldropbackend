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
import { PodService } from './pod.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  CreatePodDto,
  PodFilterDto,
  PhotoCaptureDto,
} from './dto/pod.dto';

// File filter for uploads
const imageFilter = (req: any, file: Express.Multer.File, callback: Function) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
    return callback(new BadRequestException('Only image files are allowed'), false);
  }
  callback(null, true);
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Controller('pod')
@UseGuards(AuthGuard('jwt'))
export class PodController {
  constructor(
    private readonly podService: PodService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Create POD record for package
   * POST /pod
   */
  @Post()
  async create(@Body() dto: CreatePodDto, @Request() req: any) {
    const createdBy = req.user?.sub || req.user?.id;
    return this.podService.create(dto, createdBy);
  }

  /**
   * Get POD by package ID
   * GET /pod/package/:packageId
   */
  @Get('package/:packageId')
  async getByPackageId(@Param('packageId') packageId: string) {
    return this.podService.getByPackageId(packageId);
  }

  /**
   * Get POD files for package
   * GET /pod/package/:packageId/files
   */
  @Get('package/:packageId/files')
  async getFiles(
    @Param('packageId') packageId: string,
    @Query('type') fileType?: string,
  ) {
    return this.podService.getFiles(packageId, fileType);
  }

  /**
   * List all PODs with filters
   * GET /pod
   */
  @Get()
  async findAll(@Query() filter: PodFilterDto) {
    return this.podService.findAll(filter);
  }

  /**
   * Get POD statistics
   * GET /pod/stats/:organizationId
   */
  @Get('stats/:organizationId')
  async getStats(
    @Param('organizationId') organizationId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.podService.getStats(organizationId, dateFrom, dateTo);
  }

  /**
   * Add photo to existing POD
   * POST /pod/package/:packageId/photo
   */
  @Post('package/:packageId/photo')
  async addPhoto(
    @Param('packageId') packageId: string,
    @Body() dto: { organizationId: string; photoBase64: string; description?: string },
    @Request() req: any,
  ) {
    const createdBy = req.user?.sub || req.user?.id;
    return this.podService.addPhoto(
      packageId,
      dto.organizationId,
      dto.photoBase64,
      dto.description,
      createdBy,
    );
  }

  /**
   * Upload POD photo via Cloudinary
   * POST /pod/package/:packageId/upload/photo
   */
  @Post('package/:packageId/upload/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadPodPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Param('packageId') packageId: string,
    @Body('description') description: string,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const organizationId = req.user?.organizationId;
    return this.cloudinaryService.uploadPodPhoto(file, packageId, organizationId, description);
  }

  /**
   * Upload multiple POD photos via Cloudinary
   * POST /pod/package/:packageId/upload/photos
   */
  @Post('package/:packageId/upload/photos')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      fileFilter: imageFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadPodPhotos(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('packageId') packageId: string,
    @Body('description') description: string,
    @Request() req: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }
    const organizationId = req.user?.organizationId;
    const results = await Promise.all(
      files.map(file => this.cloudinaryService.uploadPodPhoto(file, packageId, organizationId, description)),
    );
    return results;
  }

  /**
   * Upload signature via Cloudinary (base64)
   * POST /pod/package/:packageId/upload/signature
   */
  @Post('package/:packageId/upload/signature')
  async uploadSignature(
    @Param('packageId') packageId: string,
    @Body('signature') signatureData: string,
    @Body('recipientName') recipientName: string,
    @Request() req: any,
  ) {
    if (!signatureData) {
      throw new BadRequestException('Signature data is required');
    }
    const organizationId = req.user?.organizationId;
    return this.cloudinaryService.uploadSignature(signatureData, packageId, organizationId, recipientName);
  }

  /**
   * Upload driver ID photo via Cloudinary
   * POST /pod/package/:packageId/upload/driver-id
   */
  @Post('package/:packageId/upload/driver-id')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadDriverId(
    @UploadedFile() file: Express.Multer.File,
    @Param('packageId') packageId: string,
    @Body('driverName') driverName: string,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const organizationId = req.user?.organizationId;
    return this.cloudinaryService.uploadDriverId(file, packageId, organizationId, driverName);
  }

  /**
   * Verify POD (admin only)
   * POST /pod/:remarkId/verify
   */
  @Post(':remarkId/verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Param('remarkId') remarkId: string, @Request() req: any) {
    const verifiedBy = req.user?.sub || req.user?.id;
    return this.podService.verify(remarkId, verifiedBy);
  }

  /**
   * Delete POD file
   * DELETE /pod/files/:fileId
   */
  @Delete('files/:fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(@Param('fileId') fileId: string, @Request() req: any) {
    const deletedBy = req.user?.sub || req.user?.id;
    await this.podService.deleteFile(fileId, deletedBy);
  }
}
