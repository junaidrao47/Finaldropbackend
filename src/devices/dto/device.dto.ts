import { IsString, IsOptional } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  deviceFingerprint: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class TrustDeviceLoginDto {
  @IsString()
  deviceFingerprint: string;
}
