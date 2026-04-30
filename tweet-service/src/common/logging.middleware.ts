import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const start = Date.now();
    const body = req.body && Object.keys(req.body).length ? this.maskSensitive(req.body) : undefined;
    const auth = req.headers.authorization ? '🔑 Bearer present' : '🚫 No Auth';
    this.logger.log(`→ ${method} ${originalUrl} | IP: ${ip} | ${auth}${body ? ` | Body: ${JSON.stringify(body)}` : ''}`);

    res.on('finish', () => {
      const ms = Date.now() - start;
      const { statusCode } = res;
      const level = statusCode >= 400 ? 'error' : 'log';
      this.logger[level](`← ${method} ${originalUrl} | ${statusCode} | ${ms}ms`);
    });
    next();
  }

  private maskSensitive(body: Record<string, any>): Record<string, any> {
    const masked = { ...body };
    for (const field of ['password', 'passwordHash', 'refreshToken', 'accessToken', 'token']) {
      if (field in masked) masked[field] = '***';
    }
    return masked;
  }
}
