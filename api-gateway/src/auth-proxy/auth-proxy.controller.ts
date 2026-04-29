import { All, Controller, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import axios from 'axios';
import type { Request, Response } from 'express';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';

@ApiTags('auth-proxy')
@Controller('auth')
export class AuthProxyController {
  @All('*path')
  async proxy(@Req() req: Request, @Res() res: Response) {
    const url = `${AUTH_SERVICE_URL}/api/auth${req.path}`;
    try {
      const response = await axios({
        method: req.method as any,
        url,
        data: req.body,
        headers: {
          'Content-Type': 'application/json',
          ...(req.headers.authorization
            ? { Authorization: req.headers.authorization }
            : {}),
        },
        validateStatus: () => true, // forward all status codes
      });
      res.status(response.status).json(response.data);
    } catch (err) {
      res.status(502).json({ message: 'Auth service unavailable' });
    }
  }
}
