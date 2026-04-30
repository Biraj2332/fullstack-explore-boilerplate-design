import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtGuard implements CanActivate {
  private readonly logger = new Logger(JwtGuard.name);
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Missing Authorization header');
    try {
      const payload = this.jwt.verify(header.split(' ')[1], { secret: process.env.JWT_ACCESS_SECRET });
      (req as any).user = payload;
      return true;
    } catch (e: any) {
      this.logger.warn(`Rejected: ${e.message}`);
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
