import { IsOptional, IsString } from 'class-validator';

export class UploadMediaDto {
  @IsString()
  entityType: string = 'tweet';

  @IsOptional()
  @IsString()
  entityId?: string;
}
