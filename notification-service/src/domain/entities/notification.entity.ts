export class Notification {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly fromUserId: string | null,
    public readonly type: string,
    public readonly title: string,
    public readonly body: string,
    public readonly entityId: string | null,
    public readonly entityType: string | null,
    public readonly isRead: boolean,
    public readonly readAt: Date | null,
    public readonly createdAt: Date,
    public readonly deletedAt: Date | null,
  ) {}

  isDeleted(): boolean { return this.deletedAt !== null; }
}
