import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtGuard } from './guards/jwt.guard';

import { PrismaService } from '../prisma.service';
import { RegisterCommand } from '../application/commands/register.command';
import { LoginCommand } from '../application/commands/login.command';
import { LogoutCommand } from '../application/commands/logout.command';
import { RefreshTokenCommand } from '../application/commands/refresh-token.command';
import { GetUserQuery } from '../application/queries/get-user.query';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly prisma: PrismaService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ description: 'User created successfully' })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const result = await this.commandBus.execute(
      new RegisterCommand(dto.email, dto.password, req.ip, req.get('user-agent')),
    );
    if (result.isErr()) {
      const { code, message } = result.error;
      if (code === 'EMAIL_IN_USE') throw new ConflictException(message);
    }
    return result._unsafeUnwrap();
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and receive access + refresh tokens' })
  @ApiOkResponse({ description: 'Returns access and refresh tokens' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const result = await this.commandBus.execute(
      new LoginCommand(dto.email, dto.password, req.ip, req.get('user-agent')),
    );
    if (result.isErr()) throw new UnauthorizedException(result.error.message);
    return result._unsafeUnwrap();
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token and get new token pair' })
  @ApiOkResponse({ description: 'Returns new access and refresh tokens' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' })
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    const result = await this.commandBus.execute(
      new RefreshTokenCommand(dto.refreshToken, req.ip),
    );
    if (result.isErr()) throw new UnauthorizedException(result.error.message);
    return result._unsafeUnwrap();
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiOkResponse({ description: 'Logged out successfully' })
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: LogoutDto, @CurrentUser() user: any) {
    const result = await this.commandBus.execute(
      new LogoutCommand(dto.refreshToken, user?.sub),
    );
    return result._unsafeUnwrap();
  }

  @UseGuards(JwtGuard)
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiOkResponse({ description: 'Returns decoded JWT payload' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async getMe(@CurrentUser() user: any) {
    const authUser = await this.queryBus.execute(new GetUserQuery(user.sub));
    if (!authUser) throw new UnauthorizedException('User not found');
    return { id: authUser.id, email: authUser.email, isAdmin: authUser.isAdmin, createdAt: authUser.createdAt };
  }

  @UseGuards(JwtGuard)
  @Get('audit-logs')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List audit logs (admin only)' })
  @ApiOkResponse({ description: 'Paginated audit log entries' })
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
}

