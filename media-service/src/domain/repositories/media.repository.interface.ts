import { Media } from '../entities/media.entity';

export interface CreateMediaParams {
  userId: string;
  entityType: string;
  entityId?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  originalPath: string;
  thumbnailPath?: string;
  mediumPath?: string;
  largePath?: string;
  metadata?: Record<string, unknown>;
}

export interface IMediaRepository {
  create(params: CreateMediaParams): Promise<Media>;
  findById(id: string): Promise<Media | null>;
  findByEntityId(entityType: string, entityId: string): Promise<Media[]>;
  findByUserId(userId: string): Promise<Media[]>;
  softDelete(id: string): Promise<void>;
}

export const MEDIA_REPOSITORY = Symbol('IMediaRepository');
