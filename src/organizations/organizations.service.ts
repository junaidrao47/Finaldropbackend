import { Injectable, Logger } from '@nestjs/common';
import { DrizzleOrganizationsRepository, OrganizationWithRelations } from '../drizzle/repositories/organizations.repository';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly organizationsRepo: DrizzleOrganizationsRepository,
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto): Promise<OrganizationWithRelations> {
    return this.organizationsRepo.create({
      name: createOrganizationDto.name,
    });
  }

  async findAll(): Promise<OrganizationWithRelations[]> {
    return this.organizationsRepo.findAll();
  }

  async findOne(id: number): Promise<OrganizationWithRelations | null> {
    return this.organizationsRepo.findById(id);
  }

  async findByName(name: string): Promise<OrganizationWithRelations | null> {
    return this.organizationsRepo.findByName(name);
  }

  async update(id: number, updateOrganizationDto: CreateOrganizationDto): Promise<OrganizationWithRelations | null> {
    return this.organizationsRepo.update(id, {
      name: updateOrganizationDto.name,
    });
  }

  async remove(id: number): Promise<void> {
    await this.organizationsRepo.delete(id);
  }
}