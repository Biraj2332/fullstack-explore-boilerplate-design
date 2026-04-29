import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') ?? '';
    const start = Date.now();

    const body = req.body ? this.maskSensitive(req.body) : undefined;
    this.logger.log(
      `→ ${method} ${originalUrl} | IP: ${ip} | Agent: ${userAgent}${body ? ` | Body: ${JSON.stringify(body)}` : ''}`,
    );

    res.on('finish', () => {
      const ms = Date.now() - start;
      const { statusCode } = res;
      const level = statusCode >= 400 ? 'error' : 'log';
      this.logger[level](
        `← ${method} ${originalUrl} | ${statusCode} | ${ms}ms`,
      );
    });

    next();
  }

  private maskSensitive(body: Record<string, any>): Record<string, any> {
    const masked = { ...body };
    const sensitiveFields = ['password', 'passwordHash', 'refreshToken', 'accessToken', 'token'];
    for (const field of sensitiveFields) {
      if (field in masked) masked[field] = '***';
    }
    return masked;
  }
}
