import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtGuard implements CanActivate {
  private readonly logger = new Logger(JwtGuard.name);

  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn('Rejected: Missing or malformed Authorization header');
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = this.jwt.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
      (request as any).user = payload;
      return true;
    } catch (e: any) {
      this.logger.warn(`Rejected: ${e.message} (secret set: ${!!process.env.JWT_ACCESS_SECRET})`);
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
