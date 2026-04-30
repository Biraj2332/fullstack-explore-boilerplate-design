import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTweetDto {
  @ApiProperty({ example: 'Hello world!', maxLength: 280 })
  @IsString()
  @MinLength(1)
  @MaxLength(280)
  content: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];
}

export class UpdateTweetDto {
  @ApiProperty({ example: 'Updated content', maxLength: 280 })
  @IsString()
  @MinLength(1)
  @MaxLength(280)
  content: string;
}

export class RetweetDto {
  @ApiPropertyOptional({ example: 'My comment on this', maxLength: 280 })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  comment?: string;
}
