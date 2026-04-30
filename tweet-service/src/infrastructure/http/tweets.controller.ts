import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtGuard } from '../guards/jwt.guard';
import { CreateTweetDto, RetweetDto, UpdateTweetDto } from './dto/tweet.dto';

import { CreateTweetCommand, DeleteTweetCommand, LikeTweetCommand, RetweetCommand, UnlikeTweetCommand, UpdateTweetCommand } from '../../application/commands/tweet.commands';
import { GetLikesCountQuery, GetTweetQuery, ListTimelineQuery, ListUserTweetsQuery } from '../../application/queries/tweet.queries';

@ApiTags('tweets')
@ApiBearerAuth('access-token')
@UseGuards(JwtGuard)
@Controller('tweets')
export class TweetsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a tweet (max 280 chars)' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTweetDto, @CurrentUser() user: any, @Req() req: Request) {
    const result = await this.commandBus.execute(
      new CreateTweetCommand(user.sub, dto.content, dto.mediaUrls ?? [], req.ip),
    );
    if (result.isErr()) {
      const { code, message } = result.error;
      if (code === 'EMPTY_CONTENT' || code === 'CONTENT_TOO_LONG') throw new ConflictException(message);
    }
    return result._unsafeUnwrap();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tweet (only owner)' })
  async update(@Param('id') id: string, @Body() dto: UpdateTweetDto, @CurrentUser() user: any, @Req() req: Request) {
    const result = await this.commandBus.execute(
      new UpdateTweetCommand(id, user.sub, dto.content, req.ip),
    );
    if (result.isErr()) throw new NotFoundException(result.error.message);
    return result._unsafeUnwrap();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tweet (only owner)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.commandBus.execute(new DeleteTweetCommand(id, user.sub));
    if (result.isErr()) throw new NotFoundException(result.error.message);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like a tweet' })
  async like(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.commandBus.execute(new LikeTweetCommand(id, user.sub));
    if (result.isErr()) throw new ConflictException(result.error.message);
    return { message: 'Liked' };
  }

  @Delete(':id/like')
  @ApiOperation({ summary: 'Unlike a tweet' })
  async unlike(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.commandBus.execute(new UnlikeTweetCommand(id, user.sub));
    if (result.isErr()) throw new ConflictException(result.error.message);
    return { message: 'Unliked' };
  }

  @Post(':id/retweet')
  @ApiOperation({ summary: 'Retweet (with optional comment)' })
  async retweet(@Param('id') id: string, @Body() dto: RetweetDto, @CurrentUser() user: any, @Req() req: Request) {
    const result = await this.commandBus.execute(
      new RetweetCommand(id, user.sub, dto.comment ?? '', req.ip),
    );
    if (result.isErr()) throw new NotFoundException(result.error.message);
    return result._unsafeUnwrap();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single tweet' })
  async getTweet(@Param('id') id: string) {
    const tweet = await this.queryBus.execute(new GetTweetQuery(id));
    if (!tweet || tweet.isDeleted()) throw new NotFoundException('Tweet not found');
    return tweet;
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'List all tweets by a user' })
  async getUserTweets(@Param('userId') userId: string) {
    return this.queryBus.execute(new ListUserTweetsQuery(userId));
  }

  @Get(':id/likes')
  @ApiOperation({ summary: 'Get likes count for a tweet' })
  @ApiOkResponse({ description: 'Returns likes count' })
  async getLikesCount(@Param('id') id: string) {
    const count = await this.queryBus.execute(new GetLikesCountQuery(id));
    return { tweetId: id, likesCount: count };
  }

  @Get()
  @ApiOperation({ summary: 'Timeline — tweets from given userIds' })
  async timeline(
    @Query('userIds') userIds: string,
    @Query('limit') limit = 20,
    @Query('cursor') cursor?: string,
  ) {
    const ids = userIds ? userIds.split(',') : [];
    return this.queryBus.execute(new ListTimelineQuery(ids, Number(limit), cursor));
  }
}
