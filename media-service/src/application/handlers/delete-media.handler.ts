import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ok, err, Result } from 'neverthrow';
import { DeleteMediaCommand } from '../commands/delete-media.command';
import { MEDIA_REPOSITORY, IMediaRepository } from '../../domain/repositories/media.repository.interface';
import { MediaDomainError } from '../../domain/errors/media.errors';
import { AuditService } from '../../infrastructure/audit/audit.service';

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? '/app/uploads';

export type DeleteResult = Result<void, MediaDomainError>;

@CommandHandler(DeleteMediaCommand)
export class DeleteMediaHandler implements ICommandHandler<DeleteMediaCommand, DeleteResult> {
  private readonly logger = new Logger(DeleteMediaHandler.name);

  constructor(
    @Inject(MEDIA_REPOSITORY) private readonly repo: IMediaRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(cmd: DeleteMediaCommand): Promise<DeleteResult> {
    const media = await this.repo.findById(cmd.mediaId);
    if (!media || media.isDeleted()) {
      return err({ code: 'NOT_FOUND', message: 'Media not found' });
    }
    if (media.userId !== cmd.requestingUserId) {
      return err({ code: 'UNAUTHORIZED', message: 'You do not own this media' });
    }

    await this.repo.softDelete(cmd.mediaId);

    // Best-effort physical deletion; never break flow if files are already gone
    for (const rel of [media.originalPath, media.thumbnailPath, media.mediumPath, media.largePath]) {
      if (!rel) continue;
      try { await fs.unlink(path.join(UPLOADS_DIR, rel)); } catch { /* ignore */ }
    }

    this.logger.log(`Media ${cmd.mediaId} deleted by user ${cmd.requestingUserId}`);
    await this.auditService.log({ userId: cmd.requestingUserId, commandName: 'DeleteMediaCommand', entityType: 'Media', entityId: cmd.mediaId, success: true });
    return ok(undefined);
  }
}
