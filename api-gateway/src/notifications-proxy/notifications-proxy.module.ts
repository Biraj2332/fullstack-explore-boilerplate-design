import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsProxyController } from './notifications-proxy.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [NotificationsProxyController],
})
export class NotificationsProxyModule {}
