import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('gateway')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Gateway status' })
  @ApiOkResponse({ description: 'Returns service name, status and timestamp' })
  getStatus() {
    return this.appService.getStatus();
  }
}
