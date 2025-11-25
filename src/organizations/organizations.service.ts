import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { Organization } from './entities/organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    const organization = this.organizationsRepository.create(createOrganizationDto);
    return this.organizationsRepository.save(organization);
  }

  async findAll(): Promise<Organization[]> {
    return this.organizationsRepository.find();
  }

  async findOne(id: number): Promise<Organization | null> {
    return this.organizationsRepository.findOneBy({ id });
  }

  async update(id: number, updateOrganizationDto: CreateOrganizationDto): Promise<Organization | null> {
    await this.organizationsRepository.update(id, updateOrganizationDto as any);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.organizationsRepository.delete(id);
  }
}