import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RbacGuard } from '../common/guards/rbac.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

// File filter for uploads
const imageFilter = (req: any, file: Express.Multer.File, callback: Function) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|svg)$/)) {
    return callback(new BadRequestException('Only image files are allowed'), false);
  }
  callback(null, true);
};

const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB

@Controller('organizations')
@UseGuards(AuthGuard, RbacGuard)
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @Roles('admin')
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.organizationsService.findOne(id);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.organizationsService.remove(id);
  }

  @Post(':id/switch')
  async switchOrganization(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    try {
      const updated = await this.usersService.switchOrganization(user.id, id);
      return { success: true, user: updated };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Failed to switch organization' };
    }
  }

  /**
   * Upload organization logo
   * POST /organizations/:id/logo
   */
  @Post(':id/logo')
  @Roles('admin')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFilter,
      limits: { fileSize: MAX_LOGO_SIZE },
    }),
  )
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.cloudinaryService.uploadOrganizationLogo(file, String(id));
  }

  /**
   * Delete organization logo
   * DELETE /organizations/:id/logo
   */
  @Delete(':id/logo')
  @Roles('admin')
  async deleteLogo(@Param('id', ParseIntPipe) id: number) {
    return this.cloudinaryService.deleteOrganizationLogo(String(id));
  }

  /**
   * Get organization files
   * GET /organizations/:id/files
   */
  @Get(':id/files')
  async getFiles(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    // Get files associated with the organization
    return this.cloudinaryService.getFilesByPackage('', String(id));
  }
}