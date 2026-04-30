import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { LoggingMiddleware } from './common/logging.middleware';
import { NotificationsController } from './infrastructure/http/notifications.controller';

import { SendNotificationHandler, MarkAsReadHandler, MarkAllAsReadHandler, DeleteNotificationHandler } from './application/handlers/notification.handler';
import { GetNotificationHandler, ListUserNotificationsHandler } from './application/handlers/notification-query.handler';
import { PrismaNotificationRepository } from './infrastructure/persistence/prisma-notification.repository';
import { AuditService } from './infrastructure/audit/audit.service';
import { JwtGuard } from './infrastructure/guards/jwt.guard';
import { NOTIFICATION_REPOSITORY } from './domain/repositories/notification.repository.interface';

const CommandHandlers = [SendNotificationHandler, MarkAsReadHandler, MarkAllAsReadHandler, DeleteNotificationHandler];
const QueryHandlers = [GetNotificationHandler, ListUserNotificationsHandler];

@Module({
  imports: [CqrsModule, JwtModule.register({})],
  controllers: [NotificationsController],
  providers: [
    PrismaService, JwtGuard, AuditService,
    { provide: NOTIFICATION_REPOSITORY, useClass: PrismaNotificationRepository },
    ...CommandHandlers, ...QueryHandlers,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*path');
  }
}
