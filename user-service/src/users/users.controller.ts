import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
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
import { GetUserQuery, GetUserByIdQuery, ListUsersQuery, GetDeletedUsersQuery, SearchUsersQuery } from '../application/queries/user.queries';
import { PrismaService } from '../prisma.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly prisma: PrismaService,
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

  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @Get('audit-logs')
  @ApiOperation({ summary: 'List audit logs (admin only)' })
  @ApiOkResponse({ description: 'Paginated audit log entries from user-service' })
  async getAuditLogs(
    @CurrentUser() user: any,
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('commandName') commandName?: string,
    @Query('success') success?: string,
    @Query('limit') limit = '50',
    @Query('cursor') cursor?: string,
  ) {
    if (!user.isAdmin) throw new ForbiddenException('Admin access required');
    const take = Math.min(Number(limit) || 50, 200);
    const where: any = {};
    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (commandName) where.commandName = commandName;
    if (success !== undefined) where.success = success === 'true';
    if (cursor) where.createdAt = { lt: new Date(cursor) };
    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
    });
    const nextCursor = logs.length === take ? logs[logs.length - 1].createdAt.toISOString() : undefined;
    return { logs, nextCursor };
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @Get('search')
  @ApiOperation({ summary: 'Search users by name or email' })
  @ApiOkResponse({ description: 'Matching user profiles' })
  async search(
    @Query('q') q: string,
    @Query('limit') limit = 20,
  ) {
    if (!q?.trim()) return [];
    return this.queryBus.execute(new SearchUsersQuery(q.trim(), Number(limit)));
  }
}
