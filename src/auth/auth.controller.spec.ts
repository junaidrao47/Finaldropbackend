import { AuthController } from './src/auth/auth.controller';
import { AuthService } from './src/auth/auth.service';
import { LoginDto, SwitchOrganizationDto, ForgotPasswordDto, ResetPasswordDto } from './src/auth/dto/login.dto';
import { RegisterDto } from './src/auth/dto/register.dto';
import { SocialLoginDto, SocialProvider } from './src/auth/dto/social-auth.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: jest.Mocked<Partial<AuthService>>;

  // ==================== Mock Data ====================
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    displayName: 'John Doe',
  };

  const mockTokens = {
    accessToken: 'mock-access-token-jwt',
    refreshToken: 'mock-refresh-token-jwt',
  };

  const mockRegisterResponse = {
    success: true,
    message: 'Account created successfully',
    user: mockUser,
    ...mockTokens,
  };

  const mockLoginResponse = {
    success: true,
    ...mockTokens,
    user: mockUser,
  };

  const mockSocialLoginResponse = {
    success: true,
    ...mockTokens,
    isNewUser: false,
    user: { ...mockUser, id: String(mockUser.id), profileImage: 'https://example.com/avatar.jpg' },
    requiresPhoneVerification: false,
  };

  beforeEach(() => {
    mockAuthService = {
      register: jest.fn().mockResolvedValue(mockRegisterResponse),
      login: jest.fn().mockResolvedValue(mockLoginResponse),
      socialLogin: jest.fn().mockResolvedValue(mockSocialLoginResponse),
      forgotPassword: jest.fn().mockResolvedValue({ success: true, message: 'Reset link sent' }),
      resetPassword: jest.fn().mockResolvedValue({ success: true, message: 'Password reset successfully' }),
      logout: jest.fn().mockResolvedValue({ success: true }),
      refreshToken: jest.fn().mockResolvedValue({ accessToken: 'new-access-token' }),
      switchOrganization: jest.fn().mockResolvedValue({ ...mockTokens, organizationId: 1 }),
    };

    controller = new AuthController(mockAuthService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== Controller Definition ====================
  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  // ==================== POST /auth/register ====================
  describe('POST /auth/register', () => {
    const registerDto: RegisterDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      phoneNumber: '+1234567890',
    };

    it('should register a new user successfully', async () => {
      const result = await controller.register(registerDto);

      expect(result).toEqual(mockRegisterResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should return success status', async () => {
      const result = await controller.register(registerDto);

      expect(result.success).toBe(true);
    });

    it('should return user data', async () => {
      const result = await controller.register(registerDto);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should return access and refresh tokens', async () => {
      const result = await controller.register(registerDto);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should handle registration with optional fields', async () => {
      const dtoWithOptional: RegisterDto = {
        ...registerDto,
        countryCode: '+1',
        displayName: 'Johnny',
        createOrganization: true,
        isBusiness: true,
        businessName: 'Acme Corp',
        deviceFingerprint: 'device-123',
        trustDevice: true,
        acceptedTerms: true,
      };

      await controller.register(dtoWithOptional);

      expect(mockAuthService.register).toHaveBeenCalledWith(dtoWithOptional);
    });

    it('should handle service errors', async () => {
      mockAuthService.register = jest.fn().mockRejectedValue(new Error('Email already registered'));

      await expect(controller.register(registerDto)).rejects.toThrow('Email already registered');
    });
  });

  // ==================== POST /auth/login ====================
  describe('POST /auth/login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with email', async () => {
      const result = await controller.login(loginDto);

      expect(result).toEqual(mockLoginResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should return success status', async () => {
      const result = await controller.login(loginDto);

      expect(result.success).toBe(true);
    });

    it('should return tokens', async () => {
      const result = await controller.login(loginDto);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should return user data', async () => {
      const result = await controller.login(loginDto);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should login with emailOrPhone field', async () => {
      const dto: LoginDto = {
        emailOrPhone: 'test@example.com',
        password: 'password123',
      };

      await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });

    it('should login with phone number', async () => {
      const dto: LoginDto = {
        phoneNumber: '+1234567890',
        password: 'password123',
      };

      await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });

    it('should handle remember me option', async () => {
      const dto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      };

      await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });

    it('should handle device fingerprint', async () => {
      const dto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
        deviceFingerprint: 'device-fp-123',
        rememberDevice: true,
      };

      await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });

    it('should handle invalid credentials error', async () => {
      mockAuthService.login = jest.fn().mockRejectedValue(new Error('Invalid credentials'));

      await expect(controller.login(loginDto)).rejects.toThrow('Invalid credentials');
    });
  });

  // ==================== POST /auth/social ====================
  describe('POST /auth/social', () => {
    const socialLoginDto: SocialLoginDto = {
      provider: SocialProvider.GOOGLE,
      accessToken: 'google-access-token',
    };

    it('should handle Google social login', async () => {
      const result = await controller.socialLogin(socialLoginDto);

      expect(result).toEqual(mockSocialLoginResponse);
      expect(mockAuthService.socialLogin).toHaveBeenCalledWith(socialLoginDto);
    });

    it('should handle Facebook social login', async () => {
      const dto: SocialLoginDto = {
        provider: SocialProvider.FACEBOOK,
        accessToken: 'facebook-access-token',
      };

      await controller.socialLogin(dto);

      expect(mockAuthService.socialLogin).toHaveBeenCalledWith(dto);
    });

    it('should handle Apple social login with idToken', async () => {
      const dto: SocialLoginDto = {
        provider: SocialProvider.APPLE,
        accessToken: 'apple-access-token',
        idToken: 'apple-id-token',
      };

      await controller.socialLogin(dto);

      expect(mockAuthService.socialLogin).toHaveBeenCalledWith(dto);
    });

    it('should return new user flag for first-time social logins', async () => {
      mockAuthService.socialLogin = jest.fn().mockResolvedValue({
        ...mockSocialLoginResponse,
        isNewUser: true,
        requiresPhoneVerification: true,
      });

      const result = await controller.socialLogin(socialLoginDto);

      expect(result.isNewUser).toBe(true);
      expect(result.requiresPhoneVerification).toBe(true);
    });

    it('should handle social login errors', async () => {
      mockAuthService.socialLogin = jest.fn().mockRejectedValue(new Error('Invalid social token'));

      await expect(controller.socialLogin(socialLoginDto)).rejects.toThrow('Invalid social token');
    });
  });

  // ==================== POST /auth/google ====================
  describe('POST /auth/google', () => {
    it('should handle Google login shortcut', async () => {
      const body = { accessToken: 'google-token' };

      await controller.googleLogin(body);

      expect(mockAuthService.socialLogin).toHaveBeenCalledWith({
        provider: 'google',
        accessToken: 'google-token',
        deviceFingerprint: undefined,
      });
    });

    it('should pass device fingerprint', async () => {
      const body = { accessToken: 'google-token', deviceFingerprint: 'fp-123' };

      await controller.googleLogin(body);

      expect(mockAuthService.socialLogin).toHaveBeenCalledWith({
        provider: 'google',
        accessToken: 'google-token',
        deviceFingerprint: 'fp-123',
      });
    });
  });

  // ==================== POST /auth/facebook ====================
  describe('POST /auth/facebook', () => {
    it('should handle Facebook login shortcut', async () => {
      const body = { accessToken: 'facebook-token' };

      await controller.facebookLogin(body);

      expect(mockAuthService.socialLogin).toHaveBeenCalledWith({
        provider: 'facebook',
        accessToken: 'facebook-token',
        deviceFingerprint: undefined,
      });
    });

    it('should pass device fingerprint', async () => {
      const body = { accessToken: 'facebook-token', deviceFingerprint: 'fp-456' };

      await controller.facebookLogin(body);

      expect(mockAuthService.socialLogin).toHaveBeenCalledWith({
        provider: 'facebook',
        accessToken: 'facebook-token',
        deviceFingerprint: 'fp-456',
      });
    });
  });

  // ==================== POST /auth/apple ====================
  describe('POST /auth/apple', () => {
    it('should handle Apple login shortcut', async () => {
      const body = { accessToken: 'apple-token', idToken: 'apple-id-token' };

      await controller.appleLogin(body);

      expect(mockAuthService.socialLogin).toHaveBeenCalledWith({
        provider: 'apple',
        accessToken: 'apple-token',
        idToken: 'apple-id-token',
        deviceFingerprint: undefined,
      });
    });

    it('should pass device fingerprint', async () => {
      const body = { accessToken: 'apple-token', idToken: 'apple-id-token', deviceFingerprint: 'fp-789' };

      await controller.appleLogin(body);

      expect(mockAuthService.socialLogin).toHaveBeenCalledWith({
        provider: 'apple',
        accessToken: 'apple-token',
        idToken: 'apple-id-token',
        deviceFingerprint: 'fp-789',
      });
    });
  });

  // ==================== POST /auth/forgot-password ====================
  describe('POST /auth/forgot-password', () => {
    it('should request password reset', async () => {
      const dto: ForgotPasswordDto = { email: 'test@example.com' };

      const result = await controller.forgotPassword(dto);

      expect(result.success).toBe(true);
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith('test@example.com');
    });

    it('should return success even for non-existent email (prevent enumeration)', async () => {
      const dto: ForgotPasswordDto = { email: 'nonexistent@example.com' };

      const result = await controller.forgotPassword(dto);

      expect(result.success).toBe(true);
    });
  });

  // ==================== POST /auth/reset-password ====================
  describe('POST /auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const dto: ResetPasswordDto = {
        token: 'valid-reset-token',
        newPassword: 'newPassword123',
      };

      const result = await controller.resetPassword(dto);

      expect(result.success).toBe(true);
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith('valid-reset-token', 'newPassword123');
    });

    it('should handle invalid token error', async () => {
      mockAuthService.resetPassword = jest.fn().mockRejectedValue(new Error('Invalid or expired token'));

      const dto: ResetPasswordDto = {
        token: 'invalid-token',
        newPassword: 'newPassword123',
      };

      await expect(controller.resetPassword(dto)).rejects.toThrow('Invalid or expired token');
    });
  });

  // ==================== POST /auth/logout ====================
  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const result = await controller.logout();

      expect(result.success).toBe(true);
      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });

  // ==================== POST /auth/refresh ====================
  describe('POST /auth/refresh', () => {
    it('should refresh access token', async () => {
      const result = await controller.refresh('valid-refresh-token');

      expect(result).toEqual({ accessToken: 'new-access-token' });
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
    });

    it('should handle invalid refresh token', async () => {
      mockAuthService.refreshToken = jest.fn().mockResolvedValue(null);

      const result = await controller.refresh('invalid-token');

      expect(result).toBeNull();
    });
  });

  // ==================== POST /auth/switch-organization ====================
  describe('POST /auth/switch-organization', () => {
    it('should switch organization successfully', async () => {
      const dto: SwitchOrganizationDto = { organizationId: 1 };
      const req = { user: { id: 'user-123' } };

      const result = await controller.switchOrganization(dto, req);

      expect(result).toEqual({ ...mockTokens, organizationId: 1 });
      expect(mockAuthService.switchOrganization).toHaveBeenCalledWith('user-123', 1);
    });

    it('should return new tokens with organization context', async () => {
      const dto: SwitchOrganizationDto = { organizationId: 2 };
      const req = { user: { id: 'user-456' } };

      mockAuthService.switchOrganization = jest.fn().mockResolvedValue({
        accessToken: 'new-token-with-org',
        refreshToken: 'new-refresh-token',
        organizationId: 2,
      });

      const result = await controller.switchOrganization(dto, req);

      expect(result.organizationId).toBe(2);
      expect(result.accessToken).toBeDefined();
    });

    it('should handle unauthorized organization access', async () => {
      mockAuthService.switchOrganization = jest.fn().mockRejectedValue(new Error('Unauthorized'));

      const dto: SwitchOrganizationDto = { organizationId: 999 };
      const req = { user: { id: 'user-123' } };

      await expect(controller.switchOrganization(dto, req)).rejects.toThrow('Unauthorized');
    });
  });

  // ==================== GET /auth/me ====================
  describe('GET /auth/me', () => {
    it('should return current user', async () => {
      const req = { user: mockUser };

      const result = await controller.getCurrentUser(req);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it('should return user from request context', async () => {
      const customUser = {
        id: 'custom-123',
        email: 'custom@example.com',
        firstName: 'Custom',
        lastName: 'User',
      };
      const req = { user: customUser };

      const result = await controller.getCurrentUser(req);

      expect(result.user).toEqual(customUser);
    });
  });

  // ==================== Error Handling ====================
  describe('Error Handling', () => {
    it('should propagate service errors for register', async () => {
      mockAuthService.register = jest.fn().mockRejectedValue(new Error('Database error'));

      const dto: RegisterDto = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
      };

      await expect(controller.register(dto)).rejects.toThrow('Database error');
    });

    it('should propagate service errors for login', async () => {
      mockAuthService.login = jest.fn().mockRejectedValue(new Error('Service unavailable'));

      await expect(controller.login({ email: 'test@example.com', password: 'pass' })).rejects.toThrow('Service unavailable');
    });

    it('should propagate service errors for social login', async () => {
      mockAuthService.socialLogin = jest.fn().mockRejectedValue(new Error('Provider error'));

      await expect(controller.socialLogin({
        provider: SocialProvider.GOOGLE,
        accessToken: 'token',
      })).rejects.toThrow('Provider error');
    });
  });

  // ==================== Input Validation Edge Cases ====================
  describe('Input Validation Edge Cases', () => {
    it('should handle login with username field', async () => {
      const dto: LoginDto = {
        username: 'testuser',
        password: 'password123',
      };

      await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });

    it('should handle register with minimal required fields', async () => {
      const dto: RegisterDto = {
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
        password: '12345678',
        phoneNumber: '123',
      };

      await controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });
  });
});
