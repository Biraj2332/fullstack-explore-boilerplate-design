import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TweetsProxyController } from './tweets-proxy.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [TweetsProxyController],
})
export class TweetsProxyModule {}
