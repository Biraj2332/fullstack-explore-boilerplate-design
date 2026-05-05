import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtGuard } from '../guards/jwt.guard';
import { SendNotificationCommand, MarkAsReadCommand, MarkAllAsReadCommand, DeleteNotificationCommand } from '../../application/commands/notification.commands';
import { GetNotificationQuery, ListUserNotificationsQuery } from '../../application/queries/notification.queries';
import { PrismaService } from '../../prisma.service';

class InternalTweetCreatedDto { tweetId: string; userId: string; }
class InternalTweetLikedDto { tweetId: string; tweetOwnerId: string; likerId: string; }
class InternalTweetRetweetedDto { tweetId: string; tweetOwnerId: string; retweeterId: string; }

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly prisma: PrismaService,
  ) {}

  // Internal endpoint — called by tweet-service on tweet creation, no JWT
  @Post('internal/tweet-created')
  @ApiOperation({ summary: 'Internal: called by tweet-service on tweet creation' })
  @HttpCode(201)
  async onTweetCreated(@Body() dto: InternalTweetCreatedDto) {
    // In production: look up followers and send to each
    await this.commandBus.execute(new SendNotificationCommand(
      dto.userId, 'TWEET_CREATED', 'New tweet', 'Your tweet was posted', undefined, dto.tweetId, 'tweet',
    ));
    return { ok: true };
  }

  // Internal endpoint — called by tweet-service when a tweet is liked, no JWT
  @Post('internal/tweet-liked')
  @ApiOperation({ summary: 'Internal: called by tweet-service when a tweet is liked' })
  @HttpCode(201)
  async onTweetLiked(@Body() dto: InternalTweetLikedDto) {
    await this.commandBus.execute(new SendNotificationCommand(
      dto.tweetOwnerId, 'TWEET_LIKED', 'Someone liked your tweet',
      'Your tweet received a like', dto.likerId, dto.tweetId, 'tweet',
    ));
    return { ok: true };
  }

  // Internal endpoint — called by tweet-service when a tweet is retweeted, no JWT
  @Post('internal/tweet-retweeted')
  @ApiOperation({ summary: 'Internal: called by tweet-service when a tweet is retweeted' })
  @HttpCode(201)
  async onTweetRetweeted(@Body() dto: InternalTweetRetweetedDto) {
    await this.commandBus.execute(new SendNotificationCommand(
      dto.tweetOwnerId, 'TWEET_RETWEETED', 'Someone retweeted your tweet',
      'Your tweet was retweeted', dto.retweeterId, dto.tweetId, 'tweet',
    ));
    return { ok: true };
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @Get()
  @ApiOperation({ summary: 'Get my notifications' })
  async getMyNotifications(@CurrentUser() user: any) {
    return this.queryBus.execute(new ListUserNotificationsQuery(user.sub, false));
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @Get('unread')
  @ApiOperation({ summary: 'Get my unread notifications' })
  async getUnread(@CurrentUser() user: any) {
    return this.queryBus.execute(new ListUserNotificationsQuery(user.sub, true));
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @Get(':id')
  @ApiOperation({ summary: 'Get a single notification' })
  async getOne(@Param('id') id: string) {
    const notif = await this.queryBus.execute(new GetNotificationQuery(id));
    if (!notif) throw new NotFoundException('Notification not found');
    return notif;
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(@Param('id') id: string, @CurrentUser() user: any) {
    await this.commandBus.execute(new MarkAsReadCommand(id, user.sub));
    return { message: 'Marked as read' };
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@CurrentUser() user: any) {
    await this.commandBus.execute(new MarkAllAsReadCommand(user.sub));
    return { message: 'All marked as read' };
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @HttpCode(204)
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    await this.commandBus.execute(new DeleteNotificationCommand(id, user.sub));
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @Get('audit-logs')
  @ApiOperation({ summary: 'List audit logs (admin only)' })
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
