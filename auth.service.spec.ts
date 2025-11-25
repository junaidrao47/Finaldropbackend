import { AuthService } from './src/auth/auth.service';

describe('AuthService (unit)', () => {
  it('login returns an accessToken when credentials are valid', async () => {
    const mockUser = { id: 1, email: 'test@example.com', password: 'secret' } as any;
    const mockUsersService: any = { findByEmail: jest.fn().mockResolvedValue(mockUser) };
    const mockJwtService: any = { sign: jest.fn().mockReturnValue('jwt-token'), verify: jest.fn() };

    const svc = new AuthService(mockUsersService, mockJwtService);
    // Bypass validateUserByCredentials internals by mocking usersService
    jest.spyOn(svc as any, 'validateUserByCredentials').mockResolvedValue(mockUser);

    const result = await svc.login({ email: 'test@example.com', password: 'secret' } as any);
    expect(result).toHaveProperty('accessToken', 'jwt-token');
  });
});
