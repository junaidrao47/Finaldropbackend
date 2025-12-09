import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SocialLoginDto, SocialProvider, SocialUserProfile, SocialAuthResponse } from './dto/social-auth.dto';
import { UserWithRelations } from '../drizzle/repositories/users.repository';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import * as bcrypt from 'bcrypt';
import * as admin from 'firebase-admin';
import configuration from '../config/configuration';

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRES = '15m';
const ACCESS_TOKEN_EXPIRES_REMEMBER = '7d'; // Extended for "Remember me"
const REFRESH_TOKEN_EXPIRES = '7d';
const REFRESH_TOKEN_EXPIRES_REMEMBER = '30d'; // Extended for "Remember me"

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Lazy Firebase Admin initialization to avoid issues during tests/build.
   */
  private get firebaseApp(): admin.app.App | null {
    const firebaseCfg = configuration.social.firebase;
    if (!firebaseCfg.projectId || !firebaseCfg.clientEmail || !firebaseCfg.privateKey) {
      return null;
    }

    if (admin.apps.length > 0) {
      return admin.app();
    }

    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: firebaseCfg.projectId,
        clientEmail: firebaseCfg.clientEmail,
        privateKey: firebaseCfg.privateKey,
      }),
    });
  }

  /**
   * Register a new user with the design fields:
   * First Name, Last Name, Email, Password, Phone Number
   */
  async register(registerDto: RegisterDto): Promise<{
    success: boolean;
    message: string;
    user: any;
    accessToken: string;
    refreshToken: string;
  }> {
    // Check if email already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, SALT_ROUNDS);
    const user = await this.usersService.create({ 
      ...registerDto, 
      password: hashedPassword,
    });

    // Generate tokens for auto-login after registration
    const payload: JwtPayload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_EXPIRES });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: REFRESH_TOKEN_EXPIRES });

    return {
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: `${user.firstName} ${user.lastName}`,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login with email/phone number and password
   * Supports the "Remember me" feature from design
   */
  async login(loginDto: LoginDto): Promise<{
    success: boolean;
    accessToken: string;
    refreshToken: string;
    user: any;
  }> {
    // Determine login identifier (email, phone, or combined field)
    let identifier = loginDto.email || loginDto.emailOrPhone || loginDto.username || loginDto.phoneNumber;
    
    if (!identifier) {
      throw new BadRequestException('Email or phone number is required');
    }

    // Try to find user by email or phone
    let user: UserWithRelations | null = null;
    
    // Check if it looks like an email
    if (identifier.includes('@')) {
      user = await this.usersService.findByEmail(identifier);
    } else {
      // Try phone number lookup (need to add this to users service)
      user = await this.usersService.findByEmail(identifier); // Fallback to email for now
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens with extended expiry if "Remember me" is checked
    const payload: JwtPayload = { email: user.email, sub: user.id };
    const tokenExpiry = loginDto.rememberMe ? ACCESS_TOKEN_EXPIRES_REMEMBER : ACCESS_TOKEN_EXPIRES;
    const refreshExpiry = loginDto.rememberMe ? REFRESH_TOKEN_EXPIRES_REMEMBER : REFRESH_TOKEN_EXPIRES;

    return {
      success: true,
      accessToken: this.jwtService.sign(payload, { expiresIn: tokenExpiry }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: refreshExpiry }),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: `${user.firstName} ${user.lastName}`,
      },
    };
  }

  // ==================== Social Authentication ====================

  /**
   * Handle social login (Google, Facebook, Apple)
   */
  async socialLogin(socialLoginDto: SocialLoginDto): Promise<SocialAuthResponse> {
    // Verify the token with the respective provider and get user profile
    const profile = await this.verifySocialToken(socialLoginDto);

    if (!profile || !profile.email) {
      throw new UnauthorizedException('Unable to retrieve profile from social provider');
    }

    // Check if user exists
    let user = await this.usersService.findByEmail(profile.email);
    let isNewUser = false;

    if (!user) {
      // Create new user from social profile
      isNewUser = true;
      const hashedPassword = await bcrypt.hash(Math.random().toString(36), SALT_ROUNDS);
      
      user = await this.usersService.create({
        email: profile.email,
        password: hashedPassword,
        firstName: profile.firstName || profile.displayName?.split(' ')[0] || 'User',
        lastName: profile.lastName || profile.displayName?.split(' ').slice(1).join(' ') || '',
        phoneNumber: '', // Social users may need to add phone later
      } as any);
    }

    // Generate tokens
    const payload: JwtPayload = { email: user.email, sub: user.id };

    return {
      success: true,
      accessToken: this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_EXPIRES }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: REFRESH_TOKEN_EXPIRES }),
      isNewUser,
      user: {
        id: String(user.id),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: `${user.firstName} ${user.lastName}`,
        profileImage: profile.profileImage,
      },
      requiresPhoneVerification: isNewUser, // New social users should add phone
    };
  }

  /**
   * Verify social provider token and extract user profile
   */
  private async verifySocialToken(dto: SocialLoginDto): Promise<SocialUserProfile | null> {
    switch (dto.provider) {
      case SocialProvider.GOOGLE:
        return this.verifyGoogleToken(dto.accessToken);
      case SocialProvider.FACEBOOK:
        return this.verifyFacebookToken(dto.accessToken);
      case SocialProvider.APPLE:
        return this.verifyAppleToken(dto.accessToken, dto.idToken);
      case SocialProvider.FIREBASE:
        return this.verifyFirebaseToken(dto.accessToken);
      default:
        throw new BadRequestException('Unsupported social provider');
    }
  }

  /**
   * Verify Firebase ID token coming from frontend Firebase Auth.
   */
  private async verifyFirebaseToken(idToken: string): Promise<SocialUserProfile | null> {
    const app = this.firebaseApp;
    if (!app) {
      throw new BadRequestException('Firebase is not configured on the server');
    }

    try {
      const decoded = await app.auth().verifyIdToken(idToken);

      return {
        provider: SocialProvider.FIREBASE,
        providerId: decoded.uid,
        email: decoded.email || '',
        firstName: decoded.name?.split(' ')[0] || '',
        lastName: decoded.name?.split(' ').slice(1).join(' ') || '',
        displayName: decoded.name || decoded.email || decoded.uid,
        profileImage: decoded.picture,
        emailVerified: decoded.email_verified,
      };
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      throw new UnauthorizedException('Firebase authentication failed');
    }
  }

  /**
   * Verify Google OAuth token
   */
  private async verifyGoogleToken(accessToken: string): Promise<SocialUserProfile | null> {
    try {
      // Call Google's tokeninfo endpoint to validate the token
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);
      
      if (!response.ok) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const tokenInfo = await response.json();

      // Get user info from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!userResponse.ok) {
        throw new UnauthorizedException('Unable to fetch Google user info');
      }

      const userInfo = await userResponse.json();

      return {
        provider: SocialProvider.GOOGLE,
        providerId: userInfo.id,
        email: userInfo.email,
        firstName: userInfo.given_name,
        lastName: userInfo.family_name,
        displayName: userInfo.name,
        profileImage: userInfo.picture,
        emailVerified: userInfo.verified_email,
      };
    } catch (error) {
      console.error('Google token verification failed:', error);
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  /**
   * Verify Facebook OAuth token
   */
  private async verifyFacebookToken(accessToken: string): Promise<SocialUserProfile | null> {
    try {
      // Verify token and get user info from Facebook Graph API
      const response = await fetch(
        `https://graph.facebook.com/me?fields=id,email,first_name,last_name,name,picture&access_token=${accessToken}`,
      );

      if (!response.ok) {
        throw new UnauthorizedException('Invalid Facebook token');
      }

      const userInfo = await response.json();

      if (!userInfo.email) {
        throw new BadRequestException('Facebook account must have an email address');
      }

      return {
        provider: SocialProvider.FACEBOOK,
        providerId: userInfo.id,
        email: userInfo.email,
        firstName: userInfo.first_name,
        lastName: userInfo.last_name,
        displayName: userInfo.name,
        profileImage: userInfo.picture?.data?.url,
        emailVerified: true, // Facebook emails are verified
      };
    } catch (error) {
      console.error('Facebook token verification failed:', error);
      throw new UnauthorizedException('Facebook authentication failed');
    }
  }

  /**
   * Verify Apple Sign-In token
   */
  private async verifyAppleToken(accessToken: string, idToken?: string): Promise<SocialUserProfile | null> {
    try {
      // Apple uses ID tokens (JWT) that need to be verified
      // For production, you should verify the JWT signature with Apple's public keys
      
      if (!idToken) {
        throw new BadRequestException('Apple Sign-In requires an ID token');
      }

      // Decode the ID token (in production, verify signature first)
      const tokenParts = idToken.split('.');
      if (tokenParts.length !== 3) {
        throw new UnauthorizedException('Invalid Apple ID token format');
      }

      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());

      return {
        provider: SocialProvider.APPLE,
        providerId: payload.sub,
        email: payload.email,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        displayName: payload.name || payload.email?.split('@')[0] || 'User',
        emailVerified: payload.email_verified === 'true',
      };
    } catch (error) {
      console.error('Apple token verification failed:', error);
      throw new UnauthorizedException('Apple authentication failed');
    }
  }

  /**
   * Forgot password - send reset link
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const user = await this.usersService.findByEmail(email);
    
    // Always return success to prevent email enumeration
    if (!user) {
      return {
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link',
      };
    }

    // Generate reset token
    const resetToken = this.jwtService.sign(
      { email: user.email, sub: user.id, type: 'password_reset' },
      { expiresIn: '1h' },
    );

    // TODO: Send email with reset link
    // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return {
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link',
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const payload = this.jwtService.verify(token) as any;
      
      if (payload.type !== 'password_reset') {
        throw new BadRequestException('Invalid reset token');
      }

      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await this.usersService.update(payload.sub, { password: hashedPassword } as any);

      return {
        success: true,
        message: 'Password has been reset successfully',
      };
    } catch (error) {
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  /**
   * Switch to a different organization (SEC-004)
   * Returns new tokens with organization context
   */
  async switchOrganization(
    userId: number,
    organizationId: number,
  ): Promise<{ accessToken: string; refreshToken: string; organizationId: number }> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify user has access to this organization
    const userOrgs = await this.usersService.findOrganizations(userId);
    const hasAccess = userOrgs.some((org) => org.id === organizationId);
    if (!hasAccess) {
      throw new UnauthorizedException('User does not have access to this organization');
    }

    // Create new tokens with organization context
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      organizationId,
    };

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_EXPIRES }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: REFRESH_TOKEN_EXPIRES }),
      organizationId,
    };
  }

  async validateUser(payload: JwtPayload): Promise<UserWithRelations | null> {
    return this.usersService.findByEmail(payload.email);
  }

  async validateUserByCredentials(email: string, password: string): Promise<UserWithRelations> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  // Token helpers used by AuthGuard and controllers
  async validateToken(token: string): Promise<UserWithRelations | null> {
    try {
      const payload = this.jwtService.verify(token) as JwtPayload;
      return this.validateUser(payload as JwtPayload);
    } catch {
      return null;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string } | null> {
    // For now, treat refresh token as a JWT containing same payload; in production
    // store refresh tokens and validate them.
    try {
      const payload = this.jwtService.verify(refreshToken) as JwtPayload;
      const accessToken = this.jwtService.sign({ email: payload.email, sub: payload.sub });
      return { accessToken };
    } catch {
      return null;
    }
  }

  async logout(): Promise<{ success: boolean }> {
    // No-op placeholder; implement token revocation as needed.
    return { success: true };
  }
}