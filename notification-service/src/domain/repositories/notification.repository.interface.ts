import { Notification } from '../entities/notification.entity';

export interface INotificationRepository {
  findById(id: string): Promise<Notification | null>;
  findByUserId(userId: string, onlyUnread?: boolean): Promise<Notification[]>;
  create(data: {
    userId: string;
    fromUserId?: string;
    type: string;
    title: string;
    body: string;
    entityId?: string;
    entityType?: string;
  }): Promise<Notification>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  softDelete(id: string): Promise<void>;
}

export const NOTIFICATION_REPOSITORY = Symbol('INotificationRepository');
