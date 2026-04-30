import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from './decorators/current-user.decorator';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtGuard } from './guards/jwt.guard';

import { CreateUserCommand } from '../application/commands/create-user.command';
import { UpdateUserCommand } from '../application/commands/update-user.command';
import { SoftDeleteUserCommand } from '../application/commands/soft-delete-user.command';
import { RestoreUserCommand } from '../application/commands/restore-user.command';
import { GetUserQuery, GetUserByIdQuery, ListUsersQuery, GetDeletedUsersQuery } from '../application/queries/user.queries';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // Internal — called by auth-service after registration, no JWT required
  @Post('profile')
  @ApiOperation({ summary: 'Create user profile (internal — called by auth-service)' })
  @ApiCreatedResponse({ description: 'Profile created' })
  async createProfile(@Body() dto: CreateProfileDto) {
    const result = await this.commandBus.execute(new CreateUserCommand(dto.authId, dto.email));
    return result._unsafeUnwrap();
  }

  // Internal — called by tweet-service to verify user exists, no JWT required
  @Get('internal/by-auth-id/:authId')
  @ApiOperation({ summary: 'Internal: get user by authId (called by tweet-service)' })
  async getByAuthId(@Param('authId') authId: string) {
    const profile = await this.queryBus.execute(new GetUserQuery(authId));
    if (!profile || profile.isDeleted()) return null;
    return { id: profile.id, authId: profile.authId, email: profile.email };
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @Get('profile')
  @ApiOperation({ summary: 'Get my profile' })
  @ApiOkResponse({ description: 'Returns current user profile' })
  @ApiNotFoundResponse({ description: 'Profile not found' })
  @ApiUnauthorizedResponse()
  async getMyProfile(@CurrentUser() user: any) {
    const profile = await this.queryBus.execute(new GetUserQuery(user.sub));
    if (!profile || profile.isDeleted()) throw new NotFoundException('Profile not found');
    return profile;
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @Patch('profile')
  @ApiOperation({ summary: 'Update my profile' })
  @ApiOkResponse({ description: 'Returns updated profile' })
  @ApiUnauthorizedResponse()
  async updateMyProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto, @Req() req: Request) {
    const result = await this.commandBus.execute(
      new UpdateUserCommand(user.sub, dto, user.sub, req.ip),
    );
    if (result.isErr()) throw new NotFoundException(result.error.message);
    return result._unsafeUnwrap();
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @Delete('profile')
  @ApiOperation({ summary: 'Soft-delete my account' })
  @ApiOkResponse({ description: 'Account deactivated' })
  @ApiUnauthorizedResponse()
  async deleteMyProfile(@CurrentUser() user: any) {
    const result = await this.commandBus.execute(new SoftDeleteUserCommand(user.sub, user.sub));
    if (result.isErr()) throw new NotFoundException(result.error.message);
    return { message: 'Account deactivated' };
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @Post('profile/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted account' })
  @ApiOkResponse({ description: 'Account restored' })
  @ApiUnauthorizedResponse()
  async restoreMyProfile(@CurrentUser() user: any) {
    const result = await this.commandBus.execute(new RestoreUserCommand(user.sub, user.sub));
    if (result.isErr()) throw new NotFoundException(result.error.message);
    return { message: 'Account restored' };
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @Get('list')
  @ApiOperation({ summary: 'List all active users' })
  @ApiOkResponse({ description: 'List of active user profiles' })
  async listUsers() {
    return this.queryBus.execute(new ListUsersQuery(false));
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @Get('deleted')
  @ApiOperation({ summary: 'List all soft-deleted users' })
  @ApiOkResponse({ description: 'List of deleted user profiles' })
  async getDeletedUsers() {
    return this.queryBus.execute(new GetDeletedUsersQuery());
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiOkResponse({ description: 'Returns user profile' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse()
  async getUserById(@Param('id') id: string) {
    const user = await this.queryBus.execute(new GetUserByIdQuery(id));
    if (!user || user.isDeleted()) throw new NotFoundException('User not found');
    return user;
  }
}
