import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsBoolean, MaxLength, IsUUID, Matches } from 'class-validator';

/**
 * Register DTO - New user registration
 * Matches the design: First Name, Last Name, Email, Password, Phone Number
 */
export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(100)
  lastName: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @MaxLength(30)
  phoneNumber: string;

  // Optional country code for phone number formatting
  @IsOptional()
  @IsString()
  @MaxLength(5)
  countryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

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

  // Terms acceptance
  @IsOptional()
  @IsBoolean()
  acceptedTerms?: boolean;
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