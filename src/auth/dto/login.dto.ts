import { IsString, IsEmail, IsOptional, IsBoolean, IsUUID, MaxLength } from 'class-validator';

/**
 * Login DTO
 */
export class LoginDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  deviceFingerprint?: string;

  @IsOptional()
  @IsBoolean()
  rememberDevice?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ipAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  userAgent?: string;
}

/**
 * Login Response
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    profileImage?: string;
  };
  requiresOtp: boolean;
  isNewDevice: boolean;
  organizations: OrganizationAccess[];
  currentOrganization?: OrganizationAccess;
}

export interface OrganizationAccess {
  id: string;
  name: string;
  isBusiness: boolean;
  role: string;
  isDefault: boolean;
}

/**
 * Verify OTP Login DTO
 */
export class VerifyOtpLoginDto {
  @IsString()
  @MaxLength(10)
  code: string;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsBoolean()
  trustDevice?: boolean;
}

/**
 * Switch Organization DTO (SEC-004)
 */
export class SwitchOrganizationDto {
  @IsUUID()
  organizationId: string;
}

/**
 * Refresh Token DTO
 */
export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

/**
 * Forgot Password DTO
 */
export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

/**
 * Reset Password DTO
 */
export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MaxLength(255)
  newPassword: string;
}

/**
 * Change Password DTO
 */
export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MaxLength(255)
  newPassword: string;
}

/**
 * Trust Device DTO
 */
export class TrustDeviceDto {
  @IsString()
  @MaxLength(500)
  deviceFingerprint: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  userAgent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ipAddress?: string;
}

/**
 * Untrust Device DTO
 */
export class UntrustDeviceDto {
  @IsUUID()
  deviceId: string;
}

/**
 * Logout DTO
 */
export class LogoutDto {
  @IsOptional()
  @IsBoolean()
  allDevices?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  deviceFingerprint?: string;
}