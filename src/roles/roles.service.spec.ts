import { RolesService } from './roles.service';

describe('RolesService', () => {
  const role = { id: 1, name: 'Admin' } as any;
  let service: RolesService;
  let repo: {
    create: jest.Mock;
    findByName: jest.Mock;
    findAll: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    updatePermissions: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    repo = {
      create: jest.fn().mockResolvedValue(role),
      findByName: jest.fn().mockResolvedValue(role),
      findAll: jest.fn().mockResolvedValue([role]),
      findById: jest.fn().mockResolvedValue(role),
      update: jest.fn().mockResolvedValue({ ...role, name: 'Manager' }),
      updatePermissions: jest.fn().mockResolvedValue({ ...role, permissions: { packages: ['read'] } }),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    service = new RolesService(repo as any);
  });

  it('creates a role with default values', async () => {
    await expect(service.create('Admin')).resolves.toEqual(role);
    expect(repo.create).toHaveBeenCalledWith({ name: 'Admin', description: null, permissions: null });
  });

  it('updates permissions', async () => {
    const perms = { packages: ['read'] } as Record<string, string[]>;
    await service.updatePermissions(1, perms);
    expect(repo.updatePermissions).toHaveBeenCalledWith(1, perms);
  });

  it('removes a role', async () => {
    await service.remove(1);
    expect(repo.delete).toHaveBeenCalledWith(1);
  });
});
