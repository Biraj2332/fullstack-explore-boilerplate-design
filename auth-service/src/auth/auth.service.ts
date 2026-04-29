import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { err, ok, Result } from 'neverthrow';
import { PrismaService } from '../prisma.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

export type AuthError =
  | { code: 'EMAIL_IN_USE'; message: string }
  | { code: 'INVALID_CREDENTIALS'; message: string }
  | { code: 'INVALID_TOKEN'; message: string }
  | { code: 'TOKEN_NOT_FOUND'; message: string }
  | { code: 'TOKEN_EXPIRED'; message: string };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<Result<{ id: string; email: string; createdAt: Date }, AuthError>> {
    this.logger.log(`register attempt: ${dto.email}`);

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      this.logger.warn(`register failed — email in use: ${dto.email}`);
      return err({ code: 'EMAIL_IN_USE', message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash },
    });

    this.logger.log(`register success: ${user.email} (id: ${user.id})`);

    // Propagate to user-service so both DBs stay in sync
    const userServiceUrl = process.env.USER_SERVICE_URL ?? 'http://user-service:3002';
    try {
      const response = await fetch(`${userServiceUrl}/api/users/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authId: user.id, email: user.email }),
      });
      if (response.ok) {
        this.logger.log(`user-service profile created for ${user.email}`);
      } else {
        this.logger.warn(`user-service profile creation returned ${response.status} for ${user.email}`);
      }
    } catch (e: any) {
      this.logger.warn(`Could not reach user-service to create profile: ${e.message}`);
    }

    return ok({ id: user.id, email: user.email, createdAt: user.createdAt });
  }

  async login(dto: LoginDto): Promise<Result<{ accessToken: string; refreshToken: string }, AuthError>> {
    this.logger.log(`login attempt: ${dto.email}`);

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      this.logger.warn(`login failed — user not found: ${dto.email}`);
      return err({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      this.logger.warn(`login failed — wrong password: ${dto.email}`);
      return err({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    }

    const tokens = await this.generateTokenPair(user.id, user.email);
    this.logger.log(`login success: ${user.email} (id: ${user.id})`);
    return ok(tokens);
  }

  async refresh(dto: RefreshDto): Promise<Result<{ accessToken: string; refreshToken: string }, AuthError>> {
    this.logger.log('refresh token attempt');

    let payload: { sub: string };
    try {
      payload = this.jwt.verify(dto.refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
    } catch {
      this.logger.warn('refresh failed — invalid token signature');
      return err({ code: 'INVALID_TOKEN', message: 'Invalid refresh token' });
    }

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      this.logger.warn(`refresh failed — token not in DB (sub: ${payload.sub})`);
      return err({ code: 'TOKEN_NOT_FOUND', message: 'Refresh token not found' });
    }

    if (tokenRecord.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
      this.logger.warn(`refresh failed — token expired (sub: ${payload.sub})`);
      return err({ code: 'TOKEN_EXPIRED', message: 'Refresh token expired' });
    }

    await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
    const tokens = await this.generateTokenPair(tokenRecord.user.id, tokenRecord.user.email);
    this.logger.log(`refresh success: ${tokenRecord.user.email}`);
    return ok(tokens);
  }

  async logout(dto: LogoutDto): Promise<Result<{ message: string }, never>> {
    this.logger.log('logout attempt');
    await this.prisma.refreshToken.deleteMany({ where: { token: dto.refreshToken } });
    this.logger.log('logout success — token invalidated');
    return ok({ message: 'Logged out successfully' });
  }

  private async generateTokenPair(userId: string, email: string) {
    const accessToken = this.jwt.sign(
      { sub: userId, email },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '15m' },
    );
    const refreshToken = this.jwt.sign(
      { sub: userId },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' },
    );
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });
    return { accessToken, refreshToken };
  }
}

