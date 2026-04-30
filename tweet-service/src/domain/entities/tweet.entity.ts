export class Tweet {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly content: string,
    public readonly mediaUrls: string[],
    public readonly likesCount: number,
    public readonly retweetsCount: number,
    public readonly originalTweetId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}

  isDeleted(): boolean { return this.deletedAt !== null; }
  isRetweet(): boolean { return this.originalTweetId !== null; }
}
