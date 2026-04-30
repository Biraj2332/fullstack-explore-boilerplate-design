import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthProxyModule } from './auth-proxy/auth-proxy.module';
import { LoggingMiddleware } from './common/logging.middleware';
import { UsersProxyModule } from './users-proxy/users-proxy.module';
import { TweetsProxyModule } from './tweets-proxy/tweets-proxy.module';
import { NotificationsProxyModule } from './notifications-proxy/notifications-proxy.module';

@Module({
  imports: [AuthProxyModule, UsersProxyModule, TweetsProxyModule, NotificationsProxyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*path');
  }
}
