import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './src/auth/auth.service';
import { SocialProvider } from './src/auth/dto/social-auth.dto';

// Mock bcrypt module
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService (unit)', () => {
  // Use a real bcrypt hash for testing
  const hashedPassword = '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'; // hash of 'secret'
  
  const mockUser = { 
    id: 1, 
    email: 'test@example.com', 
    password: hashedPassword,
    firstName: 'Test',
    lastName: 'User',
  } as any;

  let mockUsersService: any;
  let mockJwtService: any;
  let service: AuthService;

  beforeEach(() => {
    mockUsersService = { 
      findByEmail: jest.fn().mockResolvedValue(mockUser),
      create: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
      findOrganizations: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(mockUser),
    };
    mockJwtService = { 
      sign: jest.fn().mockReturnValue('jwt-token'), 
      verify: jest.fn().mockReturnValue({ email: mockUser.email, sub: mockUser.id }),
    };

    service = new AuthService(mockUsersService, mockJwtService);
    
    // Reset bcrypt mock
    (bcrypt.compare as jest.Mock).mockReset();
  });

  describe('login', () => {
    it('returns tokens when credentials are valid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ 
        email: 'test@example.com', 
        password: 'secret',
        rememberMe: false,
      } as any);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.success).toBe(true);
    });

    it('supports login with emailOrPhone field', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ 
        emailOrPhone: 'test@example.com', 
        password: 'secret',
      } as any);

      expect(result.success).toBe(true);
    });

    it('throws when no identifier provided', async () => {
      await expect(service.login({ password: 'secret' } as any))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when password is invalid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login({ 
        email: 'test@example.com', 
        password: 'wrongpassword',
      } as any)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('creates a new user and returns tokens', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);
      mockUsersService.create.mockResolvedValueOnce(mockUser);

      const result = await service.register({
        firstName: 'Test',
        lastName: 'User',
        email: 'new@example.com',
        password: 'Password123',
        phoneNumber: '+1234567890',
      } as any);

      expect(result.success).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.user).toBeDefined();
    });

    it('throws when email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(mockUser);

      await expect(service.register({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'Password123',
        phoneNumber: '+1234567890',
      } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('forgotPassword', () => {
    it('returns success even if user not found (prevents enumeration)', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);

      const result = await service.forgotPassword('nonexistent@example.com');

      expect(result.success).toBe(true);
    });
  });

  describe('socialLogin', () => {
    it('creates new user when social login with new email', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);
      mockUsersService.create.mockResolvedValueOnce(mockUser);

      // Mock the social token verification
      jest.spyOn(service as any, 'verifySocialToken').mockResolvedValueOnce({
        provider: SocialProvider.GOOGLE,
        providerId: 'google-123',
        email: 'new@example.com',
        firstName: 'Google',
        lastName: 'User',
      });

      const result = await service.socialLogin({
        provider: SocialProvider.GOOGLE,
        accessToken: 'google-access-token',
      });

      expect(result.success).toBe(true);
      expect(result.isNewUser).toBe(true);
    });

    it('returns existing user for social login with known email', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(mockUser);

      jest.spyOn(service as any, 'verifySocialToken').mockResolvedValueOnce({
        provider: SocialProvider.GOOGLE,
        providerId: 'google-123',
        email: mockUser.email,
        firstName: 'Test',
        lastName: 'User',
      });

      const result = await service.socialLogin({
        provider: SocialProvider.GOOGLE,
        accessToken: 'google-access-token',
      });

      expect(result.success).toBe(true);
      expect(result.isNewUser).toBe(false);
    });
  });
});
