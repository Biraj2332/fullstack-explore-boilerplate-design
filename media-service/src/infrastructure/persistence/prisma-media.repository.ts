import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { IMediaRepository, CreateMediaParams } from '../../domain/repositories/media.repository.interface';
import { Media } from '../../domain/entities/media.entity';

@Injectable()
export class PrismaMediaRepository implements IMediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(p: CreateMediaParams): Promise<Media> {
    const row = await this.prisma.media.create({
      data: {
        userId:       p.userId,
        entityType:   p.entityType,
        entityId:     p.entityId ?? null,
        fileName:     p.fileName,
        fileSize:     p.fileSize,
        mimeType:     p.mimeType,
        originalPath: p.originalPath,
        thumbnailPath: p.thumbnailPath ?? null,
        mediumPath:    p.mediumPath    ?? null,
        largePath:     p.largePath     ?? null,
        metadata:      (p.metadata ?? {}) as any,
      },
    });
    return this.toEntity(row);
  }

  async findById(id: string): Promise<Media | null> {
    const row = await this.prisma.media.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByEntityId(entityType: string, entityId: string): Promise<Media[]> {
    const rows = await this.prisma.media.findMany({
      where: { entityType, entityId, deletedAt: null },
    });
    return rows.map(this.toEntity);
  }

  async findByUserId(userId: string): Promise<Media[]> {
    const rows = await this.prisma.media.findMany({ where: { userId, deletedAt: null } });
    return rows.map(this.toEntity);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.media.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private toEntity(row: any): Media {
    return new Media(
      row.id, row.userId, row.entityType, row.entityId,
      row.fileName, row.fileSize, row.mimeType,
      row.originalPath, row.thumbnailPath, row.mediumPath, row.largePath,
      row.metadata as Record<string, unknown>,
      row.createdAt, row.deletedAt,
    );
  }
}
