import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { LoggingMiddleware } from './common/logging.middleware';
import { TweetsController } from './infrastructure/http/tweets.controller';

// CQRS Handlers
import { CreateTweetHandler, UpdateTweetHandler, DeleteTweetHandler } from './application/handlers/tweet-crud.handler';
import { LikeTweetHandler, UnlikeTweetHandler, RetweetHandler } from './application/handlers/tweet-social.handler';
import { GetTweetHandler, ListUserTweetsHandler, ListTimelineHandler, GetLikesCountHandler } from './application/handlers/tweet-query.handler';

// Infrastructure
import { PrismaTweetRepository } from './infrastructure/persistence/prisma-tweet.repository';
import { AuditService } from './infrastructure/audit/audit.service';
import { JwtGuard } from './infrastructure/guards/jwt.guard';
import { TWEET_REPOSITORY } from './domain/repositories/tweet.repository.interface';

const CommandHandlers = [CreateTweetHandler, UpdateTweetHandler, DeleteTweetHandler, LikeTweetHandler, UnlikeTweetHandler, RetweetHandler];
const QueryHandlers = [GetTweetHandler, ListUserTweetsHandler, ListTimelineHandler, GetLikesCountHandler];

@Module({
  imports: [CqrsModule, JwtModule.register({})],
  controllers: [TweetsController],
  providers: [
    PrismaService,
    JwtGuard,
    AuditService,
    { provide: TWEET_REPOSITORY, useClass: PrismaTweetRepository },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*path');
  }
}
