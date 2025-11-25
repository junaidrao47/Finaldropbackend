import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Membership } from '../memberships/membership.entity';
import { Organization } from '../organizations/entities/organization.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Membership)
    private membershipsRepository: Repository<Membership>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Create a shallow user object — repository.create expects entity-like input.
    // DTOs may carry role/organization as IDs (strings); let TypeORM accept relation ids by casting.
    const user = this.usersRepository.create(createUserDto as any);
    return this.usersRepository.save(user as any);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  async findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async findOrganizations(userId: number): Promise<Organization[]> {
    // Find memberships for the user and return the organizations
    const memberships = await this.membershipsRepository.find({
      where: { user: { id: userId } },
      relations: ['organization'],
    });
    return memberships.map(m => m.organization);
  }

  async switchOrganization(userId: number, orgId: number): Promise<User> {
    // Ensure membership exists
    const membership = await this.membershipsRepository.findOne({
      where: { user: { id: userId }, organization: { id: orgId } },
      relations: ['organization'],
    });
    if (!membership) {
      throw new ForbiddenException('User is not a member of the target organization');
    }
    // Update user's active organization
    const user = await this.findOne(userId);
    if (!user) throw new NotFoundException('User not found');
    user.organization = membership.organization;
    await this.usersRepository.save(user as any);
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User | null> {
    await this.usersRepository.update(id, updateUserDto as any);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }
}