import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { err, ok, Result } from 'neverthrow';
import { CreateTweetCommand, UpdateTweetCommand, DeleteTweetCommand } from '../commands/tweet.commands';
import { TWEET_REPOSITORY } from '../../domain/repositories/tweet.repository.interface';
import type { ITweetRepository } from '../../domain/repositories/tweet.repository.interface';
import { TweetDomainError } from '../../domain/errors/tweet.errors';
import { TweetContent } from '../../domain/value-objects/tweet-content.vo';
import { Tweet } from '../../domain/entities/tweet.entity';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { fetchWithRetry } from '../../common/http-retry';

@CommandHandler(CreateTweetCommand)
export class CreateTweetHandler implements ICommandHandler<CreateTweetCommand> {
  private readonly logger = new Logger(CreateTweetHandler.name);

  constructor(
    @Inject(TWEET_REPOSITORY) private readonly tweetRepo: ITweetRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: CreateTweetCommand): Promise<Result<Tweet, TweetDomainError>> {
    const start = Date.now();

    // Value object enforces 280 char rule and empty check
    let content: TweetContent;
    try {
      content = new TweetContent(command.content);
    } catch (e: any) {
      if (e.message.includes('empty')) return err({ code: 'EMPTY_CONTENT', message: e.message });
      return err({ code: 'CONTENT_TOO_LONG', message: e.message });
    }

    // Verify user exists via user-service (fail-open: if service is unreachable the JWT is still valid)
    const userSvcUrl = process.env.USER_SERVICE_URL ?? 'http://user-service:3002';
    try {
      const res = await fetchWithRetry(
        `${userSvcUrl}/api/users/internal/by-auth-id/${command.userId}`,
        { method: 'GET' },
        2,
        200,
      );
      if (res.status === 404 || (res.ok && (await res.json()) === null)) {
        return err({ code: 'USER_NOT_FOUND', message: 'User profile not found' });
      }
    } catch (e: any) {
      // User service temporarily unavailable — proceed (JWT was already validated by the guard)
      this.logger.warn(`user-service unavailable during tweet creation: ${e.message}`);
    }

    const tweet = await this.tweetRepo.create(command.userId, content.value, command.mediaUrls);
    this.logger.log(`tweet created: id=${tweet.id} userId=${command.userId}`);

    await this.auditService.log({ userId: command.userId, commandName: 'CreateTweetCommand', entityType: 'Tweet', entityId: tweet.id, newData: { content: content.value }, success: true, ipAddress: command.ipAddress, durationMs: Date.now() - start });

    // Notify notification-service (fire-and-forget with retry)
    const notifUrl = process.env.NOTIFICATION_SERVICE_URL ?? 'http://notification-service:3003';
    fetchWithRetry(`${notifUrl}/api/notifications/internal/tweet-created`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tweetId: tweet.id, userId: command.userId }),
    }, 2, 300).catch((e) => this.logger.warn(`notification-service unreachable: ${e.message}`));

    return ok(tweet);
  }
}

@CommandHandler(UpdateTweetCommand)
export class UpdateTweetHandler implements ICommandHandler<UpdateTweetCommand> {
  private readonly logger = new Logger(UpdateTweetHandler.name);

  constructor(
    @Inject(TWEET_REPOSITORY) private readonly tweetRepo: ITweetRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: UpdateTweetCommand): Promise<Result<Tweet, TweetDomainError>> {
    const start = Date.now();
    const existing = await this.tweetRepo.findById(command.tweetId);
    if (!existing || existing.isDeleted()) return err({ code: 'TWEET_NOT_FOUND', message: 'Tweet not found' });
    if (existing.userId !== command.userId) return err({ code: 'NOT_TWEET_OWNER', message: 'Not the tweet owner' });

    let content: TweetContent;
    try { content = new TweetContent(command.content); }
    catch (e: any) { return err({ code: 'CONTENT_TOO_LONG', message: e.message }); }

    const updated = await this.tweetRepo.update(command.tweetId, content.value);
    await this.auditService.log({ userId: command.userId, commandName: 'UpdateTweetCommand', entityType: 'Tweet', entityId: existing.id, oldData: { content: existing.content }, newData: { content: content.value }, success: true, ipAddress: command.ipAddress, durationMs: Date.now() - start });
    return ok(updated);
  }
}

@CommandHandler(DeleteTweetCommand)
export class DeleteTweetHandler implements ICommandHandler<DeleteTweetCommand> {
  constructor(
    @Inject(TWEET_REPOSITORY) private readonly tweetRepo: ITweetRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: DeleteTweetCommand): Promise<Result<void, TweetDomainError>> {
    const start = Date.now();
    const tweet = await this.tweetRepo.findById(command.tweetId);
    if (!tweet || tweet.isDeleted()) return err({ code: 'TWEET_NOT_FOUND', message: 'Tweet not found' });
    if (tweet.userId !== command.userId) return err({ code: 'NOT_TWEET_OWNER', message: 'Not the tweet owner' });

    await this.tweetRepo.softDelete(command.tweetId);
    await this.auditService.log({ userId: command.userId, commandName: 'DeleteTweetCommand', entityType: 'Tweet', entityId: tweet.id, success: true, durationMs: Date.now() - start });
    return ok(undefined);
  }
}
