import { IQuery } from '@nestjs/cqrs';

export class GetNotificationQuery implements IQuery {
  constructor(public readonly id: string) {}
}

export class ListUserNotificationsQuery implements IQuery {
  constructor(public readonly userId: string, public readonly onlyUnread = false) {}
}
