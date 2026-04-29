import { Injectable, Logger } from '@nestjs/common';
import { err, ok, Result } from 'neverthrow';
import { PrismaService } from '../prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

export type UserError =
  | { code: 'PROFILE_NOT_FOUND'; message: string }
  | { code: 'USER_NOT_FOUND'; message: string };

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createProfile(dto: CreateProfileDto): Promise<Result<any, never>> {
    this.logger.log(`createProfile: authId=${dto.authId} email=${dto.email}`);
    const user = await this.prisma.user.create({
      data: { authId: dto.authId, email: dto.email },
    });
    this.logger.log(`createProfile success: id=${user.id}`);
    return ok(this.sanitize(user));
  }

  async getMyProfile(authId: string): Promise<Result<any, UserError>> {
    this.logger.log(`getMyProfile: authId=${authId}`);
    const user = await this.prisma.user.findUnique({ where: { authId } });
    if (!user || user.deletedAt) {
      this.logger.warn(`getMyProfile not found: authId=${authId}`);
      return err({ code: 'PROFILE_NOT_FOUND', message: 'Profile not found' });
    }
    return ok(this.sanitize(user));
  }

  async updateMyProfile(authId: string, dto: UpdateProfileDto): Promise<Result<any, UserError>> {
    this.logger.log(`updateMyProfile: authId=${authId} fields=${Object.keys(dto).join(',')}`);
    const user = await this.prisma.user.findUnique({ where: { authId } });
    if (!user || user.deletedAt) {
      this.logger.warn(`updateMyProfile not found: authId=${authId}`);
      return err({ code: 'PROFILE_NOT_FOUND', message: 'Profile not found' });
    }
    const updated = await this.prisma.user.update({
      where: { authId },
      data: { ...dto },
    });
    this.logger.log(`updateMyProfile success: authId=${authId}`);
    return ok(this.sanitize(updated));
  }

  async getUserById(id: string): Promise<Result<any, UserError>> {
    this.logger.log(`getUserById: id=${id}`);
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) {
      this.logger.warn(`getUserById not found: id=${id}`);
      return err({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }
    return ok(this.sanitize(user));
  }

  private sanitize(user: any) {
    const { deletedAt, ...rest } = user;
    return rest;
  }
}

