import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getStatus() {
    return {
      service: 'user-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async getHealth() {
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      service: 'user-service',
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
