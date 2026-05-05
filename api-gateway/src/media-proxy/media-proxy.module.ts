import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MediaProxyController } from './media-proxy.controller';
import { JwtGuard } from '../common/guards/jwt.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [MediaProxyController],
  providers: [JwtGuard],
})
export class MediaProxyModule {}
