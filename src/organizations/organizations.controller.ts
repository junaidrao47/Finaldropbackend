import { Controller, Get, Post, Body, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RbacGuard } from '../common/guards/rbac.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Controller('organizations')
@UseGuards(AuthGuard, RbacGuard)
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly usersService: UsersService,
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
}