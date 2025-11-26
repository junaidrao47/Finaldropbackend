import { IsInt, IsOptional, IsArray, ValidateNested, IsString, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class FileMetaDto {
  @IsString()
  storageKey: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  size?: number;
}

export class CommitReceiveDto {
  @IsOptional()
  @IsInt()
  organizationId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileMetaDto)
  files: FileMetaDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
