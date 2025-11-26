import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { DrizzleUsersRepository, UserWithRelations } from '../drizzle/repositories/users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepo: DrizzleUsersRepository,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserWithRelations> {
    return this.usersRepo.create({
      email: createUserDto.email,
      password: createUserDto.password,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      organizationId: (createUserDto as any).organizationId || null,
      roleId: (createUserDto as any).roleId || null,
    });
  }

  async findAll(): Promise<UserWithRelations[]> {
    return this.usersRepo.findAll();
  }

  async findByEmail(email: string): Promise<UserWithRelations | null> {
    return this.usersRepo.findByEmail(email);
  }

  async findOne(id: number): Promise<UserWithRelations | null> {
    return this.usersRepo.findById(id);
  }

  async findOrganizations(userId: number): Promise<Array<{ id: number; name: string }>> {
    return this.usersRepo.findUserOrganizations(userId);
  }

  async switchOrganization(userId: number, orgId: number): Promise<UserWithRelations> {
    // Ensure membership exists
    const isMember = await this.usersRepo.checkMembership(userId, orgId);
    if (!isMember) {
      throw new ForbiddenException('User is not a member of the target organization');
    }
    
    // Update user's active organization
    const user = await this.usersRepo.updateOrganization(userId, orgId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserWithRelations | null> {
    return this.usersRepo.update(id, updateUserDto as any);
  }

  async remove(id: number): Promise<void> {
    await this.usersRepo.delete(id);
  }
}