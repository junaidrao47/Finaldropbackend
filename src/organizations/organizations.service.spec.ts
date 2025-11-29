import { OrganizationsService } from './organizations.service';

describe('OrganizationsService', () => {
  const organization = { id: 1, name: 'FinalDrop' } as any;
  let service: OrganizationsService;
  let repo: {
    create: jest.Mock;
    findAll: jest.Mock;
    findById: jest.Mock;
    findByName: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    repo = {
      create: jest.fn().mockResolvedValue(organization),
      findAll: jest.fn().mockResolvedValue([organization]),
      findById: jest.fn().mockResolvedValue(organization),
      findByName: jest.fn().mockResolvedValue(organization),
      update: jest.fn().mockResolvedValue({ ...organization, name: 'Updated' }),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    service = new OrganizationsService(repo as any);
  });

  it('creates an organization', async () => {
    await expect(service.create({ name: 'FinalDrop' } as any)).resolves.toEqual(organization);
    expect(repo.create).toHaveBeenCalledWith({ name: 'FinalDrop' });
  });

  it('finds by name', async () => {
    await expect(service.findByName('FinalDrop')).resolves.toEqual(organization);
    expect(repo.findByName).toHaveBeenCalledWith('FinalDrop');
  });

  it('updates an organization', async () => {
    await service.update(1, { name: 'Updated' } as any);
    expect(repo.update).toHaveBeenCalledWith(1, { name: 'Updated' });
  });

  it('removes an organization', async () => {
    await service.remove(1);
    expect(repo.delete).toHaveBeenCalledWith(1);
  });
});
