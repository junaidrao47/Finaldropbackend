import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async create(roleName: string): Promise<Role> {
    const role = this.rolesRepository.create({ name: roleName });
    return this.rolesRepository.save(role);
  }

  async findByName(name: string): Promise<Role | null> {
    return this.rolesRepository.findOneBy({ name });
  }

  async findAll(): Promise<Role[]> {
    return this.rolesRepository.find();
  }

  async findOne(id: number): Promise<Role | null> {
    return this.rolesRepository.findOneBy({ id });
  }

  async update(id: number, roleName: string): Promise<Role | null> {
    await this.rolesRepository.update(id, { name: roleName });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.rolesRepository.delete(id);
  }
}