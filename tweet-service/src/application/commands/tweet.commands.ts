import { ICommand } from '@nestjs/cqrs';

export class CreateTweetCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly content: string,
    public readonly mediaUrls: string[] = [],
    public readonly ipAddress?: string,
  ) {}
}

export class UpdateTweetCommand implements ICommand {
  constructor(
    public readonly tweetId: string,
    public readonly userId: string,
    public readonly content: string,
    public readonly ipAddress?: string,
  ) {}
}

export class DeleteTweetCommand implements ICommand {
  constructor(
    public readonly tweetId: string,
    public readonly userId: string,
  ) {}
}

export class LikeTweetCommand implements ICommand {
  constructor(
    public readonly tweetId: string,
    public readonly userId: string,
  ) {}
}

export class UnlikeTweetCommand implements ICommand {
  constructor(
    public readonly tweetId: string,
    public readonly userId: string,
  ) {}
}

export class RetweetCommand implements ICommand {
  constructor(
    public readonly originalTweetId: string,
    public readonly userId: string,
    public readonly comment: string = '',
    public readonly ipAddress?: string,
  ) {}
}
