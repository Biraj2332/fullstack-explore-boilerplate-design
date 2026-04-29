import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtGuard } from '../common/guards/jwt.guard';
import { UsersProxyController } from './users-proxy.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [UsersProxyController],
  providers: [JwtGuard],
})
export class UsersProxyModule {}
