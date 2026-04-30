import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { err, ok, Result } from 'neverthrow';
import { RefreshTokenCommand } from '../commands/refresh-token.command';
import { AUTH_REPOSITORY } from '../../domain/repositories/auth.repository.interface';
import type { IAuthRepository } from '../../domain/repositories/auth.repository.interface';
import { AuthDomainError } from '../../domain/errors/auth.errors';
import { AuditService } from '../../infrastructure/audit/audit.service';

export type RefreshResult = Result<{ accessToken: string; refreshToken: string }, AuthDomainError>;

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand, RefreshResult> {
  private readonly logger = new Logger(RefreshTokenHandler.name);

  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepo: IAuthRepository,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<RefreshResult> {
    const start = Date.now();

    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(command.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      return err({ code: 'INVALID_TOKEN', message: 'Invalid refresh token' });
    }

    const tokenRecord = await this.authRepo.findRefreshToken(command.refreshToken);
    if (!tokenRecord) {
      return err({ code: 'TOKEN_NOT_FOUND', message: 'Refresh token not found' });
    }
    if (tokenRecord.expiresAt < new Date()) {
      await this.authRepo.deleteRefreshToken(command.refreshToken);
      return err({ code: 'TOKEN_EXPIRED', message: 'Refresh token expired' });
    }

    await this.authRepo.deleteRefreshToken(command.refreshToken);

    const accessToken = this.jwtService.sign(
      { sub: tokenRecord.user.id, email: tokenRecord.user.email },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '15m' },
    );
    const newRefreshToken = this.jwtService.sign(
      { sub: tokenRecord.user.id },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' },
    );
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.authRepo.saveRefreshToken(tokenRecord.user.id, newRefreshToken, expiresAt);

    this.logger.log(`token refreshed: ${tokenRecord.user.email}`);
    await this.auditService.log({ userId: tokenRecord.user.id, commandName: 'RefreshTokenCommand', entityType: 'RefreshToken', success: true, ipAddress: command.ipAddress, durationMs: Date.now() - start });

    return ok({ accessToken, refreshToken: newRefreshToken });
  }
}
