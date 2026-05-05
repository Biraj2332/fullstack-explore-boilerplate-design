import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { MediaController } from './infrastructure/http/media.controller';
import { PrismaMediaRepository } from './infrastructure/persistence/prisma-media.repository';
import { AuditService } from './infrastructure/audit/audit.service';
import { JwtGuard } from './infrastructure/guards/jwt.guard';
import { MEDIA_REPOSITORY } from './domain/repositories/media.repository.interface';
import { UploadMediaHandler } from './application/handlers/upload-media.handler';
import { DeleteMediaHandler } from './application/handlers/delete-media.handler';
import { GetMediaHandler, GetByEntityHandler } from './application/handlers/media-query.handler';
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');
  use(req: Request, res: Response, next: NextFunction) {
    const { method, url } = req;
    res.on('finish', () => {
      const fn = res.statusCode >= 400 ? 'error' : 'log';
      this.logger[fn](`${method} ${url} | ${res.statusCode}`);
    });
    next();
  }
}

const CommandHandlers = [UploadMediaHandler, DeleteMediaHandler];
const QueryHandlers   = [GetMediaHandler, GetByEntityHandler];

@Module({
  imports: [CqrsModule, JwtModule.register({})],
  controllers: [MediaController],
  providers: [
    PrismaService,
    JwtGuard,
    AuditService,
    { provide: MEDIA_REPOSITORY, useClass: PrismaMediaRepository },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*path');
  }
}
