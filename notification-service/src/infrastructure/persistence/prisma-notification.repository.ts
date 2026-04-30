import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { Notification } from '../../domain/entities/notification.entity';

@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Notification | null> {
    const row = await this.prisma.notification.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByUserId(userId: string, onlyUnread = false): Promise<Notification[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId, deletedAt: null, ...(onlyUnread ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(r => this.toEntity(r));
  }

  async create(data: any): Promise<Notification> {
    const row = await this.prisma.notification.create({ data });
    return this.toEntity(row);
  }

  async markAsRead(id: string): Promise<void> {
    await this.prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true, readAt: new Date() } });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.notification.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private toEntity(row: any): Notification {
    return new Notification(row.id, row.userId, row.fromUserId, row.type, row.title, row.body, row.entityId, row.entityType, row.isRead, row.readAt, row.createdAt, row.deletedAt);
  }
}
