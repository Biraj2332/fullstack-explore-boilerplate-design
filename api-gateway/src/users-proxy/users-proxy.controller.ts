import { All, Controller, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import axios from 'axios';
import type { Request, Response } from 'express';
import { JwtGuard } from '../common/guards/jwt.guard';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://localhost:3002';

@ApiTags('users-proxy')
@ApiBearerAuth('access-token')
@UseGuards(JwtGuard)
@Controller('users')
export class UsersProxyController {
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
    const url = `${USER_SERVICE_URL}/api/users${subPath ? '/' + subPath : ''}`;
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
      res.status(502).json({ message: 'User service unavailable' });
    }
  }
}
