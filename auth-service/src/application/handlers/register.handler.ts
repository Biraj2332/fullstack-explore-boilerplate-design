import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { err, ok, Result } from 'neverthrow';
import { RegisterCommand } from '../commands/register.command';
import { AUTH_REPOSITORY } from '../../domain/repositories/auth.repository.interface';
import type { IAuthRepository } from '../../domain/repositories/auth.repository.interface';
import { AuthDomainError } from '../../domain/errors/auth.errors';
import { AuditService } from '../../infrastructure/audit/audit.service';

export type RegisterResult = Result<
  { id: string; email: string; createdAt: Date },
  AuthDomainError
>;

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand, RegisterResult> {
  private readonly logger = new Logger(RegisterHandler.name);

  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepo: IAuthRepository,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: RegisterCommand): Promise<RegisterResult> {
    const start = Date.now();
    this.logger.log(`register attempt: ${command.email}`);

    const existing = await this.authRepo.findByEmail(command.email);
    if (existing) {
      this.logger.warn(`register failed — email in use: ${command.email}`);
      await this.auditService.log({
        commandName: 'RegisterCommand',
        entityType: 'AuthUser',
        entityId: undefined,
        success: false,
        errorMessage: 'EMAIL_IN_USE',
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
        durationMs: Date.now() - start,
      });
      return err({ code: 'EMAIL_IN_USE', message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(command.password, 10);
    const user = await this.authRepo.create(command.email, passwordHash);

    this.logger.log(`register success: ${user.email} (id: ${user.id})`);
    await this.auditService.log({
      userId: user.id,
      commandName: 'RegisterCommand',
      entityType: 'AuthUser',
      entityId: user.id,
      newData: { email: user.email },
      success: true,
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
      durationMs: Date.now() - start,
    });

    // Notify user-service to create profile
    const userServiceUrl = process.env.USER_SERVICE_URL ?? 'http://user-service:3002';
    try {
      await fetch(`${userServiceUrl}/api/users/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authId: user.id, email: user.email }),
      });
      this.logger.log(`user-service profile created for ${user.email}`);
    } catch (e: any) {
      this.logger.warn(`Could not reach user-service: ${e.message}`);
    }

    return ok({ id: user.id, email: user.email, createdAt: user.createdAt });
  }
}
