import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { err, ok, Result } from 'neverthrow';
import { UpdateUserCommand } from '../commands/update-user.command';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserDomainError } from '../../domain/errors/user.errors';
import { UserProfile } from '../../domain/entities/user-profile.entity';
import { AuditService } from '../../infrastructure/audit/audit.service';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  private readonly logger = new Logger(UpdateUserHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: UpdateUserCommand): Promise<Result<UserProfile, UserDomainError>> {
    const start = Date.now();

    const existing = await this.userRepo.findByAuthId(command.authId);
    if (!existing || existing.isDeleted()) {
      return err({ code: 'PROFILE_NOT_FOUND', message: 'Profile not found' });
    }

    const updated = await this.userRepo.update(command.authId, command.data);
    this.logger.log(`updateMyProfile success: authId=${command.authId}`);

    await this.auditService.log({
      userId: command.userId,
      commandName: 'UpdateUserCommand',
      entityType: 'UserProfile',
      entityId: existing.id,
      oldData: { name: existing.name, bio: existing.bio, avatarUrl: existing.avatarUrl },
      newData: command.data,
      success: true,
      ipAddress: command.ipAddress,
      durationMs: Date.now() - start,
    });

    return ok(updated);
  }
}
