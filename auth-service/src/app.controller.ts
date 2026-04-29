import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('auth')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Service status' })
  @ApiOkResponse({ description: 'Returns service name, status and timestamp' })
  getStatus() {
    return this.appService.getStatus();
  }

  @Get('health')
  @ApiTags('health')
  @ApiOperation({ summary: 'Health check — verifies DB connectivity' })
  @ApiOkResponse({ description: 'Returns status and database connection state' })
  getHealth() {
    return this.appService.getHealth();
  }
}
