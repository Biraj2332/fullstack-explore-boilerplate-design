import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtGuard } from './guards/jwt.guard';

@Module({
  imports: [
    JwtModule.register({}), // secrets passed per-call to support access + refresh with different secrets
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtGuard],
  exports: [JwtGuard, JwtModule],
})
export class AuthModule {}
