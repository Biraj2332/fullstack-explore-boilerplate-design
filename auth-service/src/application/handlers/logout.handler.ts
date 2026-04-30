import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ok, Result } from 'neverthrow';
import { LogoutCommand } from '../commands/logout.command';
import { AUTH_REPOSITORY } from '../../domain/repositories/auth.repository.interface';
import type { IAuthRepository } from '../../domain/repositories/auth.repository.interface';
import { AuthDomainError } from '../../domain/errors/auth.errors';
import { AuditService } from '../../infrastructure/audit/audit.service';

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand, Result<{ message: string }, never>> {
  private readonly logger = new Logger(LogoutHandler.name);

  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepo: IAuthRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: LogoutCommand): Promise<Result<{ message: string }, never>> {
    const start = Date.now();
    await this.authRepo.deleteRefreshToken(command.refreshToken);
    this.logger.log('logout success');

    await this.auditService.log({
      userId: command.userId,
      commandName: 'LogoutCommand',
      entityType: 'RefreshToken',
      success: true,
      durationMs: Date.now() - start,
    });

    return ok({ message: 'Logged out successfully' });
  }
}
