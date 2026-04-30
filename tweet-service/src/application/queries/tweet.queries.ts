import { IQuery } from '@nestjs/cqrs';

export class GetTweetQuery implements IQuery {
  constructor(public readonly tweetId: string) {}
}

export class ListUserTweetsQuery implements IQuery {
  constructor(public readonly userId: string) {}
}

export class ListTimelineQuery implements IQuery {
  constructor(
    public readonly userIds: string[],
    public readonly limit = 20,
    public readonly cursor?: string,
  ) {}
}

export class GetLikesCountQuery implements IQuery {
  constructor(public readonly tweetId: string) {}
}
