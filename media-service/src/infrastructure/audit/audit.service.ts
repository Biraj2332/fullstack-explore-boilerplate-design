import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

interface AuditLogDto {
  userId?: string;
  commandName?: string;
  entityType?: string;
  entityId?: string;
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
          userId:       dto.userId,
          serviceName:  'media-service',
          commandName:  dto.commandName,
          entityType:   dto.entityType,
          entityId:     dto.entityId,
          success:      dto.success,
          errorMessage: dto.errorMessage,
          durationMs:   dto.durationMs,
        },
      });
    } catch (e: any) {
      this.logger.error(`Audit log failed: ${e.message}`);
    }
  }
}
