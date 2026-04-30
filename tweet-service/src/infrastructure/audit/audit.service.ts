import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface AuditLogDto {
  userId?: string;
  commandName?: string;
  queryName?: string;
  entityType?: string;
  entityId?: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  durationMs?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(dto: AuditLogDto): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: dto.userId,
          serviceName: 'tweet-service',
          commandName: dto.commandName,
          queryName: dto.queryName,
          entityType: dto.entityType,
          entityId: dto.entityId,
          oldData: dto.oldData as any,
          newData: dto.newData as any,
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
          success: dto.success,
          errorMessage: dto.errorMessage,
          durationMs: dto.durationMs,
        },
      });
    } catch (e: any) {
      this.logger.error(`Audit log failed: ${e.message}`);
    }
  }
}
