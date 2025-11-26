import { Injectable, Logger } from '@nestjs/common';
import { DrizzleRolesRepository, RoleWithRelations } from '../drizzle/repositories/roles.repository';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private readonly rolesRepo: DrizzleRolesRepository,
  ) {}

  async create(roleName: string, description?: string, permissions?: Record<string, string[]>): Promise<RoleWithRelations> {
    return this.rolesRepo.create({
      name: roleName,
      description: description || null,
      permissions: permissions || null,
    });
  }

  async findByName(name: string): Promise<RoleWithRelations | null> {
    return this.rolesRepo.findByName(name);
  }

  async findAll(): Promise<RoleWithRelations[]> {
    return this.rolesRepo.findAll();
  }

  async findOne(id: number): Promise<RoleWithRelations | null> {
    return this.rolesRepo.findById(id);
  }

  async update(id: number, roleName: string): Promise<RoleWithRelations | null> {
    return this.rolesRepo.update(id, { name: roleName });
  }

  async updatePermissions(id: number, permissions: Record<string, string[]>): Promise<RoleWithRelations | null> {
    return this.rolesRepo.updatePermissions(id, permissions);
  }

  async remove(id: number): Promise<void> {
    await this.rolesRepo.delete(id);
  }
}