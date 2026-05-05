import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ITweetRepository } from '../../domain/repositories/tweet.repository.interface';
import { Tweet } from '../../domain/entities/tweet.entity';

@Injectable()
export class PrismaTweetRepository implements ITweetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Tweet | null> {
    const row = await this.prisma.tweet.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByUserId(userId: string): Promise<Tweet[]> {
    const rows = await this.prisma.tweet.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(r => this.toEntity(r));
  }

  async findTimeline(userIds: string[], limit: number, cursor?: string): Promise<Tweet[]> {
    const rows = await this.prisma.tweet.findMany({
      where: { userId: { in: userIds }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return rows.map(r => this.toEntity(r));
  }

  async create(userId: string, content: string, mediaUrls: string[], originalTweetId?: string): Promise<Tweet> {
    const row = await this.prisma.tweet.create({
      data: { userId, content, mediaUrls, originalTweetId },
    });
    return this.toEntity(row);
  }

  async update(id: string, content: string): Promise<Tweet> {
    const row = await this.prisma.tweet.update({ where: { id }, data: { content } });
    return this.toEntity(row);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.tweet.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async incrementLikes(id: string): Promise<void> {
    await this.prisma.tweet.update({ where: { id }, data: { likesCount: { increment: 1 } } });
  }

  async decrementLikes(id: string): Promise<void> {
    await this.prisma.tweet.update({ where: { id }, data: { likesCount: { decrement: 1 } } });
  }

  async incrementRetweets(id: string): Promise<void> {
    await this.prisma.tweet.update({ where: { id }, data: { retweetsCount: { increment: 1 } } });
  }

  async hasLiked(userId: string, tweetId: string): Promise<boolean> {
    const like = await this.prisma.like.findUnique({ where: { userId_tweetId: { userId, tweetId } } });
    return !!like;
  }

  async addLike(userId: string, tweetId: string): Promise<void> {
    await this.prisma.like.create({ data: { userId, tweetId } });
  }

  async removeLike(userId: string, tweetId: string): Promise<void> {
    await this.prisma.like.delete({ where: { userId_tweetId: { userId, tweetId } } });
  }

  async getLikesCount(tweetId: string): Promise<number> {
    return this.prisma.like.count({ where: { tweetId } });
  }

  async search(q: string, limit: number, cursor?: string): Promise<Tweet[]> {
    // Use PostgreSQL full-text search via Prisma raw query for GIN index support
    const cursorCondition = cursor ? `AND t."createdAt" < (SELECT "createdAt" FROM tweets WHERE id = '${cursor}')` : '';
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM tweets t
       WHERE t."deletedAt" IS NULL
         AND to_tsvector('english', t.content) @@ plainto_tsquery('english', $1)
         ${cursorCondition}
       ORDER BY ts_rank(to_tsvector('english', t.content), plainto_tsquery('english', $1)) DESC,
                t."createdAt" DESC
       LIMIT $2`,
      q,
      limit,
    );
    return rows.map((r) => this.toEntity(r));
  }

  private toEntity(row: any): Tweet {
    return new Tweet(row.id, row.userId, row.content, row.mediaUrls as string[] ?? [], row.likesCount, row.retweetsCount, row.originalTweetId, row.createdAt, row.updatedAt, row.deletedAt);
  }
}
