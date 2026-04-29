import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from './decorators/current-user.decorator';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtGuard } from './guards/jwt.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('profile')
  @ApiOperation({ summary: 'Create user profile (called after registration)' })
  @ApiCreatedResponse({ description: 'Profile created' })
  @ApiUnauthorizedResponse()
  async createProfile(@Body() dto: CreateProfileDto) {
    const result = await this.usersService.createProfile(dto);
    return result._unsafeUnwrap();
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get my profile' })
  @ApiOkResponse({ description: 'Returns current user profile' })
  @ApiNotFoundResponse({ description: 'Profile not found' })
  async getMyProfile(@CurrentUser() user: any) {
    const result = await this.usersService.getMyProfile(user.sub);
    if (result.isErr()) throw new NotFoundException(result.error.message);
    return result._unsafeUnwrap();
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update my profile' })
  @ApiOkResponse({ description: 'Returns updated profile' })
  async updateMyProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    const result = await this.usersService.updateMyProfile(user.sub, dto);
    if (result.isErr()) throw new NotFoundException(result.error.message);
    return result._unsafeUnwrap();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiOkResponse({ description: 'Returns user profile' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    const result = await this.usersService.getUserById(id);
    if (result.isErr()) throw new NotFoundException(result.error.message);
    return result._unsafeUnwrap();
  }
}
