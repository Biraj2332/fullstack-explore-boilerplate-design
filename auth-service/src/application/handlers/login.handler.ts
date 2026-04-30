import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { err, ok, Result } from 'neverthrow';
import { LoginCommand } from '../commands/login.command';
import { AUTH_REPOSITORY } from '../../domain/repositories/auth.repository.interface';
import type { IAuthRepository } from '../../domain/repositories/auth.repository.interface';
import { AuthDomainError } from '../../domain/errors/auth.errors';
import { AuditService } from '../../infrastructure/audit/audit.service';

export type LoginResult = Result<
  { accessToken: string; refreshToken: string },
  AuthDomainError
>;

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand, LoginResult> {
  private readonly logger = new Logger(LoginHandler.name);

  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepo: IAuthRepository,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const start = Date.now();
    this.logger.log(`login attempt: ${command.email}`);

    const user = await this.authRepo.findByEmail(command.email);
    if (!user) {
      await this.auditService.log({ commandName: 'LoginCommand', entityType: 'AuthUser', success: false, errorMessage: 'INVALID_CREDENTIALS', ipAddress: command.ipAddress, userAgent: command.userAgent, durationMs: Date.now() - start });
      return err({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(command.password, user.passwordHash);
    if (!valid) {
      await this.auditService.log({ userId: user.id, commandName: 'LoginCommand', entityType: 'AuthUser', entityId: user.id, success: false, errorMessage: 'INVALID_CREDENTIALS', ipAddress: command.ipAddress, userAgent: command.userAgent, durationMs: Date.now() - start });
      return err({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    }

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '15m' },
    );
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' },
    );
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.authRepo.saveRefreshToken(user.id, refreshToken, expiresAt);

    this.logger.log(`login success: ${user.email}`);
    await this.auditService.log({ userId: user.id, commandName: 'LoginCommand', entityType: 'AuthUser', entityId: user.id, success: true, ipAddress: command.ipAddress, userAgent: command.userAgent, durationMs: Date.now() - start });

    return ok({ accessToken, refreshToken });
  }
}
