import { OrganizationsController } from './organizations.controller';

describe('OrganizationsController (unit)', () => {
  it('switchOrganization returns success when switch succeeds', async () => {
    const mockOrgService: any = {};
    const mockUsersService: any = { switchOrganization: jest.fn().mockResolvedValue({ id: 1, organization: { id: 2 } }) };
    const mockCloudinaryService: any = {};
    const controller = new OrganizationsController(mockOrgService, mockUsersService, mockCloudinaryService);

    const result = await controller.switchOrganization(2, { id: 1 } as any);
    expect(result).toMatchObject({ success: true, user: { id: 1 } });
  });
});
