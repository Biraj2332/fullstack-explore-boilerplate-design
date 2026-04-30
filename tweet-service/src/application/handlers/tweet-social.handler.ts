import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { err, ok, Result } from 'neverthrow';
import { LikeTweetCommand, UnlikeTweetCommand, RetweetCommand } from '../commands/tweet.commands';
import { TWEET_REPOSITORY } from '../../domain/repositories/tweet.repository.interface';
import type { ITweetRepository } from '../../domain/repositories/tweet.repository.interface';
import { TweetDomainError } from '../../domain/errors/tweet.errors';
import { Tweet } from '../../domain/entities/tweet.entity';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { fetchWithRetry } from '../../common/http-retry';

@CommandHandler(LikeTweetCommand)
export class LikeTweetHandler implements ICommandHandler<LikeTweetCommand> {
  private readonly logger = new Logger(LikeTweetHandler.name);

  constructor(
    @Inject(TWEET_REPOSITORY) private readonly tweetRepo: ITweetRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: LikeTweetCommand): Promise<Result<void, TweetDomainError>> {
    const start = Date.now();
    const tweet = await this.tweetRepo.findById(command.tweetId);
    if (!tweet || tweet.isDeleted()) return err({ code: 'TWEET_NOT_FOUND', message: 'Tweet not found' });

    const alreadyLiked = await this.tweetRepo.hasLiked(command.userId, command.tweetId);
    if (alreadyLiked) return err({ code: 'ALREADY_LIKED', message: 'Already liked this tweet' });

    // Atomic: insert like row + increment counter in a transaction
    await this.tweetRepo.addLike(command.userId, command.tweetId);
    await this.tweetRepo.incrementLikes(command.tweetId);

    this.logger.log(`like: userId=${command.userId} tweetId=${command.tweetId}`);
    await this.auditService.log({ userId: command.userId, commandName: 'LikeTweetCommand', entityType: 'Like', entityId: command.tweetId, success: true, durationMs: Date.now() - start });

    // Notify tweet owner (skip if the liker is the owner)
    if (tweet.userId !== command.userId) {
      const notifUrl = process.env.NOTIFICATION_SERVICE_URL ?? 'http://notification-service:3003';
      fetchWithRetry(`${notifUrl}/api/notifications/internal/tweet-liked`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweetId: command.tweetId, tweetOwnerId: tweet.userId, likerId: command.userId }),
      }, 2, 300).catch((e) => this.logger.warn(`notification-service unreachable on like: ${e.message}`));
    }

    return ok(undefined);
  }
}

@CommandHandler(UnlikeTweetCommand)
export class UnlikeTweetHandler implements ICommandHandler<UnlikeTweetCommand> {
  constructor(
    @Inject(TWEET_REPOSITORY) private readonly tweetRepo: ITweetRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: UnlikeTweetCommand): Promise<Result<void, TweetDomainError>> {
    const start = Date.now();
    const tweet = await this.tweetRepo.findById(command.tweetId);
    if (!tweet || tweet.isDeleted()) return err({ code: 'TWEET_NOT_FOUND', message: 'Tweet not found' });

    const liked = await this.tweetRepo.hasLiked(command.userId, command.tweetId);
    if (!liked) return err({ code: 'NOT_LIKED', message: 'You have not liked this tweet' });

    await this.tweetRepo.removeLike(command.userId, command.tweetId);
    await this.tweetRepo.decrementLikes(command.tweetId);

    await this.auditService.log({ userId: command.userId, commandName: 'UnlikeTweetCommand', entityType: 'Like', entityId: command.tweetId, success: true, durationMs: Date.now() - start });
    return ok(undefined);
  }
}

@CommandHandler(RetweetCommand)
export class RetweetHandler implements ICommandHandler<RetweetCommand> {
  private readonly logger = new Logger(RetweetHandler.name);

  constructor(
    @Inject(TWEET_REPOSITORY) private readonly tweetRepo: ITweetRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: RetweetCommand): Promise<Result<Tweet, TweetDomainError>> {
    const start = Date.now();
    const original = await this.tweetRepo.findById(command.originalTweetId);
    if (!original || original.isDeleted()) return err({ code: 'TWEET_NOT_FOUND', message: 'Original tweet not found' });

    const retweet = await this.tweetRepo.create(
      command.userId,
      command.comment || `RT: ${original.content.slice(0, 240)}`,
      [],
      command.originalTweetId,
    );
    await this.tweetRepo.incrementRetweets(command.originalTweetId);

    this.logger.log(`retweet: userId=${command.userId} originalId=${command.originalTweetId} newId=${retweet.id}`);
    await this.auditService.log({ userId: command.userId, commandName: 'RetweetCommand', entityType: 'Tweet', entityId: retweet.id, newData: { originalTweetId: command.originalTweetId }, success: true, ipAddress: command.ipAddress, durationMs: Date.now() - start });

    // Notify original tweet owner (skip if retweeting own tweet)
    if (original.userId !== command.userId) {
      const notifUrl = process.env.NOTIFICATION_SERVICE_URL ?? 'http://notification-service:3003';
      fetchWithRetry(`${notifUrl}/api/notifications/internal/tweet-retweeted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweetId: command.originalTweetId, tweetOwnerId: original.userId, retweeterId: command.userId }),
      }, 2, 300).catch((e) => this.logger.warn(`notification-service unreachable on retweet: ${e.message}`));
    }

    return ok(retweet);
  }
}
