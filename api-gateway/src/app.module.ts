import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthProxyModule } from './auth-proxy/auth-proxy.module';
import { LoggingMiddleware } from './common/logging.middleware';
import { UsersProxyModule } from './users-proxy/users-proxy.module';
import { TweetsProxyModule } from './tweets-proxy/tweets-proxy.module';
import { NotificationsProxyModule } from './notifications-proxy/notifications-proxy.module';
import { MediaProxyModule } from './media-proxy/media-proxy.module';

@Module({
  imports: [
    // Rate limiting: 100 req/min per user/IP globally
    ThrottlerModule.forRoot([
      { name: 'global', ttl: 60_000, limit: 100 },
    ]),
    AuthProxyModule,
    UsersProxyModule,
    TweetsProxyModule,
    NotificationsProxyModule,
    MediaProxyModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply ThrottlerGuard globally — use @Throttle() decorator on controllers for stricter limits
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*path');
  }
}
