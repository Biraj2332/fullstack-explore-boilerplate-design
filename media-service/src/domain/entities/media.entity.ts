// Domain entity — no framework dependencies

export type EntityType = 'tweet' | 'avatar';

export class Media {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly entityType: EntityType,
    public readonly entityId: string | null,
    public readonly fileName: string,
    public readonly fileSize: number,
    public readonly mimeType: string,
    public readonly originalPath: string,
    public readonly thumbnailPath: string | null,
    public readonly mediumPath: string | null,
    public readonly largePath: string | null,
    public readonly metadata: Record<string, unknown>,
    public readonly createdAt: Date,
    public readonly deletedAt: Date | null,
  ) {}

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  /** Public URL relative to /media/:id */
  getPublicId(): string {
    return this.id;
  }
}
