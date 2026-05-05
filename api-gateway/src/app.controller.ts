import { Controller, Get, Header, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('gateway')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Gateway status' })
  @ApiOkResponse({ description: 'Returns service name, status and timestamp' })
  getStatus() { return this.appService.getStatus(); }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @HttpCode(200)
  getLiveness() { return this.appService.getLiveness(); }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe — aggregates upstream health' })
  async getReadiness() { return this.appService.getReadiness(); }

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({ summary: 'Prometheus-compatible metrics text format' })
  getMetrics() { return this.appService.getMetrics(); }
}
