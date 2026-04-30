import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { err, ok, Result } from 'neverthrow';
import { SoftDeleteUserCommand } from '../commands/soft-delete-user.command';
import { RestoreUserCommand } from '../commands/restore-user.command';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserDomainError } from '../../domain/errors/user.errors';
import { AuditService } from '../../infrastructure/audit/audit.service';

@CommandHandler(SoftDeleteUserCommand)
export class SoftDeleteUserHandler implements ICommandHandler<SoftDeleteUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: SoftDeleteUserCommand): Promise<Result<void, UserDomainError>> {
    const start = Date.now();
    const user = await this.userRepo.findByAuthId(command.authId);
    if (!user) return err({ code: 'USER_NOT_FOUND', message: 'User not found' });
    if (user.isDeleted()) return err({ code: 'USER_ALREADY_DELETED', message: 'User already deleted' });

    await this.userRepo.softDelete(command.authId);
    await this.auditService.log({ userId: command.requesterId, commandName: 'SoftDeleteUserCommand', entityType: 'UserProfile', entityId: user.id, success: true, durationMs: Date.now() - start });
    return ok(undefined);
  }
}

@CommandHandler(RestoreUserCommand)
export class RestoreUserHandler implements ICommandHandler<RestoreUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: RestoreUserCommand): Promise<Result<void, UserDomainError>> {
    const start = Date.now();
    const user = await this.userRepo.findByAuthId(command.authId);
    if (!user) return err({ code: 'USER_NOT_FOUND', message: 'User not found' });
    if (!user.isDeleted()) return err({ code: 'USER_NOT_DELETED', message: 'User is not deleted' });

    await this.userRepo.restore(command.authId);
    await this.auditService.log({ userId: command.requesterId, commandName: 'RestoreUserCommand', entityType: 'UserProfile', entityId: user.id, success: true, durationMs: Date.now() - start });
    return ok(undefined);
  }
}
