import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum } from 'class-validator';

/**
 * Social Auth Providers
 */
export enum SocialProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
}

/**
 * Social Login DTO
 * Used when user authenticates via Google, Facebook, or Apple
 */
export class SocialLoginDto {
  @IsEnum(SocialProvider)
  @IsNotEmpty()
  provider: SocialProvider;

  @IsString()
  @IsNotEmpty()
  accessToken: string; // Token from social provider (Google/Facebook/Apple)

  @IsOptional()
  @IsString()
  idToken?: string; // For Apple Sign-In

  @IsOptional()
  @IsString()
  deviceFingerprint?: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}

/**
 * Social User Profile - data received from social providers
 */
export interface SocialUserProfile {
  provider: SocialProvider;
  providerId: string; // Unique ID from the provider
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  profileImage?: string;
  emailVerified?: boolean;
}

/**
 * Social Auth Response
 */
export interface SocialAuthResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    profileImage?: string;
  };
  requiresPhoneVerification?: boolean;
}

/**
 * Link Social Account DTO
 * For linking a social account to an existing user
 */
export class LinkSocialAccountDto {
  @IsEnum(SocialProvider)
  @IsNotEmpty()
  provider: SocialProvider;

  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsOptional()
  @IsString()
  idToken?: string;
}

/**
 * Unlink Social Account DTO
 */
export class UnlinkSocialAccountDto {
  @IsEnum(SocialProvider)
  @IsNotEmpty()
  provider: SocialProvider;
}
