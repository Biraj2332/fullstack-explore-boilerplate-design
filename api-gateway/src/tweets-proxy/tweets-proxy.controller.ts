import { All, Controller, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import axios from 'axios';
import type { Request, Response } from 'express';
import { JwtGuard } from '../common/guards/jwt.guard';

const TWEET_SERVICE_URL = process.env.TWEET_SERVICE_URL ?? 'http://localhost:3004';

@ApiTags('tweets-proxy')
@ApiBearerAuth('access-token')
@UseGuards(JwtGuard)
@Controller('tweets')
export class TweetsProxyController {
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
    const url = `${TWEET_SERVICE_URL}/api/tweets${subPath ? '/' + subPath : ''}`;
    try {
      const response = await axios({
        method: req.method as any,
        url,
        data: req.body,
        params: req.query,
        headers: {
          'Content-Type': 'application/json',
          ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
        },
        validateStatus: () => true,
      });
      res.status(response.status).json(response.data);
    } catch {
      res.status(502).json({ message: 'Tweet service unavailable' });
    }
  }
}
