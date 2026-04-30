import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetTweetQuery, ListUserTweetsQuery, ListTimelineQuery, GetLikesCountQuery } from '../queries/tweet.queries';
import { TWEET_REPOSITORY } from '../../domain/repositories/tweet.repository.interface';
import type { ITweetRepository } from '../../domain/repositories/tweet.repository.interface';
import { Tweet } from '../../domain/entities/tweet.entity';

@QueryHandler(GetTweetQuery)
export class GetTweetHandler implements IQueryHandler<GetTweetQuery> {
  constructor(@Inject(TWEET_REPOSITORY) private readonly tweetRepo: ITweetRepository) {}
  execute(query: GetTweetQuery): Promise<Tweet | null> {
    return this.tweetRepo.findById(query.tweetId);
  }
}

@QueryHandler(ListUserTweetsQuery)
export class ListUserTweetsHandler implements IQueryHandler<ListUserTweetsQuery> {
  constructor(@Inject(TWEET_REPOSITORY) private readonly tweetRepo: ITweetRepository) {}
  execute(query: ListUserTweetsQuery): Promise<Tweet[]> {
    return this.tweetRepo.findByUserId(query.userId);
  }
}

@QueryHandler(ListTimelineQuery)
export class ListTimelineHandler implements IQueryHandler<ListTimelineQuery> {
  constructor(@Inject(TWEET_REPOSITORY) private readonly tweetRepo: ITweetRepository) {}
  execute(query: ListTimelineQuery): Promise<Tweet[]> {
    return this.tweetRepo.findTimeline(query.userIds, query.limit, query.cursor);
  }
}

@QueryHandler(GetLikesCountQuery)
export class GetLikesCountHandler implements IQueryHandler<GetLikesCountQuery> {
  constructor(@Inject(TWEET_REPOSITORY) private readonly tweetRepo: ITweetRepository) {}
  execute(query: GetLikesCountQuery): Promise<number> {
    return this.tweetRepo.getLikesCount(query.tweetId);
  }
}
