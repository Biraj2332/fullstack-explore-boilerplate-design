import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import type sharp from 'sharp';
import { ok, err, Result } from 'neverthrow';
import { UploadMediaCommand } from '../commands/upload-media.command';
import { MEDIA_REPOSITORY, IMediaRepository } from '../../domain/repositories/media.repository.interface';
import { MediaDomainError } from '../../domain/errors/media.errors';
import { Media } from '../../domain/entities/media.entity';
import { AuditService } from '../../infrastructure/audit/audit.service';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const UPLOADS_DIR = process.env.UPLOADS_DIR ?? '/app/uploads';

export type UploadResult = Result<Media, MediaDomainError>;

@CommandHandler(UploadMediaCommand)
export class UploadMediaHandler implements ICommandHandler<UploadMediaCommand, UploadResult> {
  private readonly logger = new Logger(UploadMediaHandler.name);

  constructor(
    @Inject(MEDIA_REPOSITORY) private readonly repo: IMediaRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(cmd: UploadMediaCommand): Promise<UploadResult> {
    const start = Date.now();

    if (!ALLOWED_MIMES.includes(cmd.mimeType)) {
      return err({ code: 'INVALID_MIME_TYPE', message: `Allowed types: ${ALLOWED_MIMES.join(', ')}` });
    }
    if (cmd.fileSize > MAX_BYTES) {
      return err({ code: 'FILE_TOO_LARGE', message: 'Maximum file size is 5 MB' });
    }

    // Generate unique filename slug
    const slug = crypto.randomUUID();
    const ext = path.extname(cmd.originalName) || '.bin';
    const dir = path.join(UPLOADS_DIR, cmd.userId);
    await fs.mkdir(dir, { recursive: true });

    const originalPath = path.join(dir, `${slug}_original${ext}`);
    await fs.writeFile(originalPath, cmd.buffer);

    // Dynamic import — sharp is an optional native module
    let thumbnailPath: string | undefined;
    let mediumPath: string | undefined;
    let largePath: string | undefined;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sharpLib = (await import('sharp')).default as typeof sharp;

      const sizes: Array<{ name: string; w: number; h: number }> = [
        { name: 'thumbnail', w: 150, h: 150 },
        { name: 'medium',    w: 500, h: 500 },
        { name: 'large',     w: 1024, h: 1024 },
      ];

      for (const { name, w, h } of sizes) {
        const outPath = path.join(dir, `${slug}_${name}.webp`);
        await sharpLib(cmd.buffer)
          .resize(w, h, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(outPath);
        if (name === 'thumbnail') thumbnailPath = outPath;
        if (name === 'medium')    mediumPath    = outPath;
        if (name === 'large')     largePath     = outPath;
      }
    } catch (e: any) {
      this.logger.warn(`Sharp processing failed — storing original only: ${e.message}`);
    }

    const media = await this.repo.create({
      userId:       cmd.userId,
      entityType:   cmd.entityType,
      entityId:     cmd.entityId,
      fileName:     cmd.originalName,
      fileSize:     cmd.fileSize,
      mimeType:     cmd.mimeType,
      originalPath: path.relative(UPLOADS_DIR, originalPath),
      thumbnailPath: thumbnailPath ? path.relative(UPLOADS_DIR, thumbnailPath) : undefined,
      mediumPath:    mediumPath    ? path.relative(UPLOADS_DIR, mediumPath)    : undefined,
      largePath:     largePath     ? path.relative(UPLOADS_DIR, largePath)     : undefined,
    });

    await this.auditService.log({
      userId: cmd.userId,
      commandName: 'UploadMediaCommand',
      entityType: 'Media',
      entityId: media.id,
      success: true,
      durationMs: Date.now() - start,
    });

    return ok(media);
  }
}
