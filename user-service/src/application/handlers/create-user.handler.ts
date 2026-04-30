import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ok, Result } from 'neverthrow';
import { CreateUserCommand } from '../commands/create-user.command';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserDomainError } from '../../domain/errors/user.errors';
import { UserProfile } from '../../domain/entities/user-profile.entity';
import { AuditService } from '../../infrastructure/audit/audit.service';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  private readonly logger = new Logger(CreateUserHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: CreateUserCommand): Promise<Result<UserProfile, UserDomainError>> {
    const start = Date.now();
    this.logger.log(`createProfile: authId=${command.authId} email=${command.email}`);

    const user = await this.userRepo.create(command.authId, command.email);

    this.logger.log(`createProfile success: id=${user.id}`);
    await this.auditService.log({ userId: command.authId, commandName: 'CreateUserCommand', entityType: 'UserProfile', entityId: user.id, newData: { authId: user.authId, email: user.email }, success: true, durationMs: Date.now() - start });

    return ok(user);
  }
}
