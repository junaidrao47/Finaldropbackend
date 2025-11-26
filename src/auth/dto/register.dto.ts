import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsBoolean, MaxLength, IsUUID } from 'class-validator';

/**
 * Register DTO - New user registration
 */
export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  mobileNumber?: string;

  @IsOptional()
  @IsString()
  organizationId?: string;

  // For creating organization during registration
  @IsOptional()
  @IsBoolean()
  createOrganization?: boolean;

  @IsOptional()
  @IsBoolean()
  isBusiness?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  businessName?: string;

  // Device trust during registration
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deviceFingerprint?: string;

  @IsOptional()
  @IsBoolean()
  trustDevice?: boolean;
}

/**
 * Registration Response
 */
export interface RegisterResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  requiresEmailVerification: boolean;
}

/**
 * Invite User DTO
 * For inviting new users to an organization
 */
export class InviteUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsUUID()
  organizationId: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsString()
  message?: string; // Custom invitation message
}

/**
 * Accept Invitation DTO
 */
export class AcceptInvitationDto {
  @IsString()
  invitationToken: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  deviceFingerprint?: string;
}

/**
 * Verify Email DTO
 */
export class VerifyEmailDto {
  @IsString()
  token: string;
}