import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { SendNotificationCommand, MarkAsReadCommand, MarkAllAsReadCommand, DeleteNotificationCommand } from '../commands/notification.commands';
import { NOTIFICATION_REPOSITORY } from '../../domain/repositories/notification.repository.interface';
import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { Notification } from '../../domain/entities/notification.entity';

@CommandHandler(SendNotificationCommand)
export class SendNotificationHandler implements ICommandHandler<SendNotificationCommand> {
  private readonly logger = new Logger(SendNotificationHandler.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: SendNotificationCommand): Promise<Notification> {
    const start = Date.now();
    const notif = await this.repo.create({
      userId: command.userId,
      fromUserId: command.fromUserId,
      type: command.type,
      title: command.title,
      body: command.body,
      entityId: command.entityId,
      entityType: command.entityType,
    });
    this.logger.log(`notification sent: id=${notif.id} type=${command.type} userId=${command.userId}`);
    await this.auditService.log({ userId: command.userId, commandName: 'SendNotificationCommand', entityType: 'Notification', entityId: notif.id, newData: { type: command.type, title: command.title }, success: true, durationMs: Date.now() - start });
    return notif;
  }
}

@CommandHandler(MarkAsReadCommand)
export class MarkAsReadHandler implements ICommandHandler<MarkAsReadCommand> {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: MarkAsReadCommand): Promise<void> {
    await this.repo.markAsRead(command.notificationId);
    await this.auditService.log({ userId: command.userId, commandName: 'MarkAsReadCommand', entityType: 'Notification', entityId: command.notificationId, success: true });
  }
}

@CommandHandler(MarkAllAsReadCommand)
export class MarkAllAsReadHandler implements ICommandHandler<MarkAllAsReadCommand> {
  constructor(@Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository) {}
  async execute(command: MarkAllAsReadCommand): Promise<void> {
    await this.repo.markAllAsRead(command.userId);
  }
}

@CommandHandler(DeleteNotificationCommand)
export class DeleteNotificationHandler implements ICommandHandler<DeleteNotificationCommand> {
  constructor(@Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository) {}
  async execute(command: DeleteNotificationCommand): Promise<void> {
    await this.repo.softDelete(command.notificationId);
  }
}
