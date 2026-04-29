import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class CreateProfileDto {
  @ApiProperty({ example: 'auth-uuid-from-auth-service' })
  @IsString()
  authId: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}
