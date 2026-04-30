import { Tweet } from '../entities/tweet.entity';

export interface ITweetRepository {
  findById(id: string): Promise<Tweet | null>;
  findByUserId(userId: string): Promise<Tweet[]>;
  findTimeline(userIds: string[], limit: number, cursor?: string): Promise<Tweet[]>;
  create(userId: string, content: string, mediaUrls: string[], originalTweetId?: string): Promise<Tweet>;
  update(id: string, content: string): Promise<Tweet>;
  softDelete(id: string): Promise<void>;
  incrementLikes(id: string): Promise<void>;
  decrementLikes(id: string): Promise<void>;
  incrementRetweets(id: string): Promise<void>;
  hasLiked(userId: string, tweetId: string): Promise<boolean>;
  addLike(userId: string, tweetId: string): Promise<void>;
  removeLike(userId: string, tweetId: string): Promise<void>;
  getLikesCount(tweetId: string): Promise<number>;
}

export const TWEET_REPOSITORY = Symbol('ITweetRepository');
