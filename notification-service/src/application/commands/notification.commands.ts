import { ICommand } from '@nestjs/cqrs';

export class SendNotificationCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly type: string,
    public readonly title: string,
    public readonly body: string,
    public readonly fromUserId?: string,
    public readonly entityId?: string,
    public readonly entityType?: string,
  ) {}
}

export class MarkAsReadCommand implements ICommand {
  constructor(public readonly notificationId: string, public readonly userId: string) {}
}

export class MarkAllAsReadCommand implements ICommand {
  constructor(public readonly userId: string) {}
}

export class DeleteNotificationCommand implements ICommand {
  constructor(public readonly notificationId: string, public readonly userId: string) {}
}
