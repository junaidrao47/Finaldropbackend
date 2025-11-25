import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  readonly username?: string;

  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @IsOptional()
  @IsString()
  readonly password?: string;

  @IsOptional()
  @IsString()
  readonly role?: string;

  @IsOptional()
  @IsString()
  readonly organizationId?: string;
}