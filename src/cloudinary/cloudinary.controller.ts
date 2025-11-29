import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Req,
  Query,
  Get,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  UploadFileDto,
  DeleteFileDto,
  BulkDeleteDto,
  SignedUploadDto,
  ImageTransformDto,
  CloudinaryFolder,
  UploadType,
} from './dto/upload.dto';

// File filter for uploads
const imageFilter = (req: any, file: Express.Multer.File, callback: Function) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|pdf)$/)) {
    return callback(new BadRequestException('Only image and PDF files are allowed'), false);
  }
  callback(null, true);
};

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Controller('upload')
@UseGuards(AuthGuard)
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  // ==================== General Uploads ====================

  /**
   * Upload a single file
   * POST /upload
   */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.cloudinaryService.uploadFile(file, {
      ...dto,
      organizationId: dto.organizationId || user.organizationId,
      userId: user.userId,
    });
  }

  /**
   * Upload multiple files
   * POST /upload/multiple
   */
  @Post('multiple')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      fileFilter: imageFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadFileDto,
    @CurrentUser() user: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    return this.cloudinaryService.uploadMultipleFiles(files, {
      ...dto,
      organizationId: dto.organizationId || user.organizationId,
      userId: user.userId,
    });
  }

  // ==================== Package Uploads ====================

  /**
   * Upload package image
   * POST /upload/package/:packageId/image
   */
  @Post('package/:packageId/image')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadPackageImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('packageId') packageId: string,
    @Body('description') description: string,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.cloudinaryService.uploadPackageImage(
      file,
      packageId,
      user.organizationId,
      description,
    );
  }

  /**
   * Upload shipping label
   * POST /upload/package/:packageId/label
   */
  @Post('package/:packageId/label')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadShippingLabel(
    @UploadedFile() file: Express.Multer.File,
    @Param('packageId') packageId: string,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.cloudinaryService.uploadShippingLabel(file, packageId, user.organizationId);
  }

  // ==================== POD Uploads ====================

  /**
   * Upload POD signature (base64)
   * POST /upload/pod/:packageId/signature
   */
  @Post('pod/:packageId/signature')
  async uploadSignature(
    @Param('packageId') packageId: string,
    @Body('signature') signatureData: string,
    @Body('recipientName') recipientName: string,
    @CurrentUser() user: any,
  ) {
    if (!signatureData) {
      throw new BadRequestException('Signature data is required');
    }

    return this.cloudinaryService.uploadSignature(
      signatureData,
      packageId,
      user.organizationId,
      recipientName,
    );
  }

  /**
   * Upload POD delivery photo
   * POST /upload/pod/:packageId/photo
   */
  @Post('pod/:packageId/photo')
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
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.cloudinaryService.uploadPodPhoto(
      file,
      packageId,
      user.organizationId,
      description,
    );
  }

  /**
   * Upload driver identification
   * POST /upload/pod/:packageId/driver-id
   */
  @Post('pod/:packageId/driver-id')
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
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.cloudinaryService.uploadDriverId(
      file,
      packageId,
      user.organizationId,
      driverName,
    );
  }

  // ==================== User Uploads ====================

  /**
   * Upload user avatar
   * POST /upload/user/avatar
   */
  @Post('user/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for avatars
    }),
  )
  async uploadUserAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.cloudinaryService.uploadUserAvatar(file, user.userId, user.organizationId);
  }

  // ==================== Organization Uploads ====================

  /**
   * Upload organization logo
   * POST /upload/organization/logo
   */
  @Post('organization/logo')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for logos
    }),
  )
  async uploadOrganizationLogo(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.cloudinaryService.uploadOrganizationLogo(file, user.organizationId);
  }

  // ==================== Delete Operations ====================

  /**
   * Delete a file
   * DELETE /upload/:publicId
   */
  @Delete(':publicId')
  async deleteFile(
    @Param('publicId') publicId: string,
    @Query('resourceType') resourceType?: string,
  ) {
    const decodedPublicId = decodeURIComponent(publicId);
    return this.cloudinaryService.deleteFile(decodedPublicId, resourceType || 'image');
  }

  /**
   * Bulk delete files
   * POST /upload/bulk-delete
   */
  @Post('bulk-delete')
  async bulkDeleteFiles(@Body() dto: BulkDeleteDto) {
    return this.cloudinaryService.deleteMultipleFiles(dto.publicIds, dto.resourceType || 'image');
  }

  // ==================== URL Generation ====================

  /**
   * Get signed upload parameters for direct browser upload
   * POST /upload/signed-params
   */
  @Post('signed-params')
  async getSignedParams(@Body() dto: SignedUploadDto) {
    return this.cloudinaryService.generateSignedUploadParams(dto);
  }

  /**
   * Generate optimized URL
   * POST /upload/optimized-url
   */
  @Post('optimized-url')
  async getOptimizedUrl(
    @Body('publicId') publicId: string,
    @Body() transform: ImageTransformDto,
  ) {
    if (!publicId) {
      throw new BadRequestException('Public ID is required');
    }

    return {
      url: this.cloudinaryService.generateOptimizedUrl(publicId, transform),
    };
  }

  /**
   * Generate thumbnail URL
   * GET /upload/thumbnail/:publicId
   */
  @Get('thumbnail/:publicId')
  async getThumbnailUrl(
    @Param('publicId') publicId: string,
    @Query('size') size?: string,
  ) {
    const decodedPublicId = decodeURIComponent(publicId);
    const thumbnailSize = size ? parseInt(size, 10) : 150;

    return {
      url: this.cloudinaryService.generateThumbnailUrl(decodedPublicId, thumbnailSize),
    };
  }

  // ==================== File Queries ====================

  /**
   * Get files by package
   * GET /upload/package/:packageId/files
   */
  @Get('package/:packageId/files')
  async getPackageFiles(
    @Param('packageId') packageId: string,
    @CurrentUser() user: any,
  ) {
    return this.cloudinaryService.getFilesByPackage(packageId, user.organizationId);
  }

  /**
   * Get files by user
   * GET /upload/user/files
   */
  @Get('user/files')
  async getUserFiles(@CurrentUser() user: any) {
    return this.cloudinaryService.getFilesByUser(user.userId);
  }
}
