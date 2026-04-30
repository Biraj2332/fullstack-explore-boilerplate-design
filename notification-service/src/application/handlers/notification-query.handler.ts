import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetNotificationQuery, ListUserNotificationsQuery } from '../queries/notification.queries';
import { NOTIFICATION_REPOSITORY } from '../../domain/repositories/notification.repository.interface';
import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { Notification } from '../../domain/entities/notification.entity';

@QueryHandler(GetNotificationQuery)
export class GetNotificationHandler implements IQueryHandler<GetNotificationQuery> {
  constructor(@Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository) {}
  execute(query: GetNotificationQuery): Promise<Notification | null> {
    return this.repo.findById(query.id);
  }
}

@QueryHandler(ListUserNotificationsQuery)
export class ListUserNotificationsHandler implements IQueryHandler<ListUserNotificationsQuery> {
  constructor(@Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository) {}
  execute(query: ListUserNotificationsQuery): Promise<Notification[]> {
    return this.repo.findByUserId(query.userId, query.onlyUnread);
  }
}
