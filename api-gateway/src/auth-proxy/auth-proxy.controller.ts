import { All, Controller, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import axios from 'axios';
import type { Request, Response } from 'express';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';

@ApiTags('auth-proxy')
// Stricter limit for auth endpoints: 5 requests per 15 minutes per IP
@Throttle({ default: { ttl: 900_000, limit: 5 } })
@Controller('auth')
export class AuthProxyController {
  @All()
  async proxyBase(@Req() req: Request, @Res() res: Response) {
    return this.forward(req, res, '');
  }

  @All('*path')
  async proxySub(@Req() req: Request, @Res() res: Response) {
    const raw = (req.params as any).path ?? '';
    const subPath = Array.isArray(raw) ? raw.join('/') : raw;
    return this.forward(req, res, subPath);
  }

  private async forward(req: Request, res: Response, subPath: string) {
    const url = `${AUTH_SERVICE_URL}/api/auth${subPath ? '/' + subPath : ''}`;
    try {
      const response = await axios({
        method: req.method as any,
        url,
        data: req.body,
        headers: {
          'Content-Type': 'application/json',
          ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
        },
        validateStatus: () => true,
      });
      res.status(response.status).json(response.data);
    } catch {
      res.status(502).json({ message: 'Auth service unavailable' });
    }
  }
}
