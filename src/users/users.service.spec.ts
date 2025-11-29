import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const baseUser = {
    id: 1,
    email: 'user@example.com',
    password: 'hashed',
  } as any;

  let service: UsersService;
  let repo: {
    create: jest.Mock;
    findAll: jest.Mock;
    findByEmail: jest.Mock;
    findById: jest.Mock;
    findUserOrganizations: jest.Mock;
    checkMembership: jest.Mock;
    updateOrganization: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    repo = {
      create: jest.fn().mockResolvedValue(baseUser),
      findAll: jest.fn().mockResolvedValue([baseUser]),
      findByEmail: jest.fn().mockResolvedValue(baseUser),
      findById: jest.fn().mockResolvedValue(baseUser),
      findUserOrganizations: jest.fn().mockResolvedValue([{ id: 10, name: 'Acme' }]),
      checkMembership: jest.fn().mockResolvedValue(true),
      updateOrganization: jest.fn().mockResolvedValue({ ...baseUser, organizationId: 10 }),
      update: jest.fn().mockResolvedValue({ ...baseUser, firstName: 'Updated' }),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    service = new UsersService(repo as any);
  });

  it('creates a user via repository', async () => {
    await expect(
      service.create({ email: 'user@example.com', password: 'secret' } as any),
    ).resolves.toEqual(baseUser);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'user@example.com', password: 'secret' }),
    );
  });

  it('returns all users', async () => {
    await expect(service.findAll()).resolves.toEqual([baseUser]);
    expect(repo.findAll).toHaveBeenCalledTimes(1);
  });

  it('switchOrganization throws when user is not member', async () => {
    repo.checkMembership.mockResolvedValueOnce(false);

    await expect(service.switchOrganization(1, 10)).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.updateOrganization).not.toHaveBeenCalled();
  });

  it('switchOrganization throws when user cannot be updated', async () => {
    repo.updateOrganization.mockResolvedValueOnce(undefined);

    await expect(service.switchOrganization(1, 10)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('switchOrganization returns updated user when member exists', async () => {
    const updated = { ...baseUser, organizationId: 10 };
    repo.updateOrganization.mockResolvedValueOnce(updated);

    await expect(service.switchOrganization(1, 10)).resolves.toEqual(updated);
    expect(repo.checkMembership).toHaveBeenCalledWith(1, 10);
  });

  it('remove delegates to repository', async () => {
    await service.remove(1);
    expect(repo.delete).toHaveBeenCalledWith(1);
  });
});
