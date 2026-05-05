import { All, Controller, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import axios from 'axios';
import type { Request, Response } from 'express';
import { JwtGuard } from '../common/guards/jwt.guard';

const MEDIA_SERVICE_URL = process.env.MEDIA_SERVICE_URL ?? 'http://localhost:3005';

@ApiTags('media-proxy')
@ApiBearerAuth('access-token')
@UseGuards(JwtGuard)
@Controller('media')
export class MediaProxyController {
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
    const url = `${MEDIA_SERVICE_URL}/api/media${subPath ? '/' + subPath : ''}`;
    try {
      const response = await axios({
        method: req.method as any,
        url,
        data: req.body,
        params: req.query,
        // Pass the raw multipart body for file uploads
        headers: {
          ...(req.headers['content-type'] ? { 'Content-Type': req.headers['content-type'] } : {}),
          ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
        },
        responseType: 'stream',
        validateStatus: () => true,
      });
      res.status(response.status);
      Object.entries(response.headers).forEach(([k, v]) => {
        if (v !== undefined) res.setHeader(k, v as any);
      });
      response.data.pipe(res);
    } catch {
      res.status(502).json({ message: 'Media service unavailable' });
    }
  }
}
