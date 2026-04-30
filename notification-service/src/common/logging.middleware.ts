import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const start = Date.now();
    const auth = req.headers.authorization ? '🔑 Bearer present' : '🚫 No Auth';
    this.logger.log(`→ ${method} ${originalUrl} | IP: ${ip} | ${auth}`);
    res.on('finish', () => {
      const level = res.statusCode >= 400 ? 'error' : 'log';
      this.logger[level](`← ${method} ${originalUrl} | ${res.statusCode} | ${Date.now() - start}ms`);
    });
    next();
  }
}
