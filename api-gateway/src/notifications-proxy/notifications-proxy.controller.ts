import { All, Controller, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import axios from 'axios';
import type { Request, Response } from 'express';
import { JwtGuard } from '../common/guards/jwt.guard';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:3003';

@ApiTags('notifications-proxy')
@ApiBearerAuth('access-token')
@UseGuards(JwtGuard)
@Controller('notifications')
export class NotificationsProxyController {
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
    const url = `${NOTIFICATION_SERVICE_URL}/api/notifications${subPath ? '/' + subPath : ''}`;
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
      res.status(502).json({ message: 'Notification service unavailable' });
    }
  }
}
