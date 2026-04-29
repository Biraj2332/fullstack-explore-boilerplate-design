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
  @All('*path')
  async proxy(@Req() req: Request, @Res() res: Response) {
    const url = `${USER_SERVICE_URL}/api/users${req.path}`;
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
        validateStatus: () => true,
      });
      res.status(response.status).json(response.data);
    } catch (err) {
      res.status(502).json({ message: 'User service unavailable' });
    }
  }
}
