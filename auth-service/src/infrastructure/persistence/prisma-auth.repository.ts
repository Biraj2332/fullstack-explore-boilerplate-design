import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { IAuthRepository } from '../../domain/repositories/auth.repository.interface';
import { AuthUser } from '../../domain/entities/auth-user.entity';

@Injectable()
export class PrismaAuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<AuthUser | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? this.toEntity(row) : null;
  }

  async findById(id: string): Promise<AuthUser | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async create(email: string, passwordHash: string): Promise<AuthUser> {
    const row = await this.prisma.user.create({ data: { email, passwordHash } });
    return this.toEntity(row);
  }

  async saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await this.prisma.refreshToken.create({ data: { token, userId, expiresAt } });
  }

  async findRefreshToken(token: string): Promise<{ userId: string; expiresAt: Date; user: AuthUser } | null> {
    const row = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!row) return null;
    return { userId: row.userId, expiresAt: row.expiresAt, user: this.toEntity(row.user) };
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { token } });
  }

  async deleteRefreshTokensByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  private toEntity(row: any): AuthUser {
    return new AuthUser(row.id, row.email, row.passwordHash, row.isAdmin ?? false, row.createdAt, row.updatedAt, row.deletedAt);
  }
}
