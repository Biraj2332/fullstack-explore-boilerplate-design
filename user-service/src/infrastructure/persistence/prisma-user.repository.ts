import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserProfile } from '../../domain/entities/user-profile.entity';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByAuthId(authId: string): Promise<UserProfile | null> {
    const row = await this.prisma.user.findUnique({ where: { authId } });
    return row ? this.toEntity(row) : null;
  }

  async findById(id: string): Promise<UserProfile | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findAll(includeDeleted = false): Promise<UserProfile[]> {
    const rows = await this.prisma.user.findMany({
      where: includeDeleted ? {} : { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(r => this.toEntity(r));
  }

  async create(authId: string, email: string): Promise<UserProfile> {
    const row = await this.prisma.user.create({ data: { authId, email } });
    return this.toEntity(row);
  }

  async update(authId: string, data: Partial<{ name: string; bio: string; avatarUrl: string }>): Promise<UserProfile> {
    const row = await this.prisma.user.update({ where: { authId }, data });
    return this.toEntity(row);
  }

  async softDelete(authId: string): Promise<void> {
    await this.prisma.user.update({ where: { authId }, data: { deletedAt: new Date() } });
  }

  async restore(authId: string): Promise<void> {
    await this.prisma.user.update({ where: { authId }, data: { deletedAt: null } });
  }

  private toEntity(row: any): UserProfile {
    return new UserProfile(row.id, row.authId, row.email, row.name, row.bio, row.avatarUrl, row.createdAt, row.updatedAt, row.deletedAt);
  }
}
