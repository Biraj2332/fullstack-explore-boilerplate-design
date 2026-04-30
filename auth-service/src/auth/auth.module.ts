import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtGuard } from './guards/jwt.guard';

// CQRS Handlers
import { RegisterHandler } from '../application/handlers/register.handler';
import { LoginHandler } from '../application/handlers/login.handler';
import { LogoutHandler } from '../application/handlers/logout.handler';
import { RefreshTokenHandler } from '../application/handlers/refresh-token.handler';
import { GetUserHandler } from '../application/handlers/get-user.handler';
import { ValidateTokenHandler } from '../application/handlers/validate-token.handler';

// Infrastructure
import { PrismaAuthRepository } from '../infrastructure/persistence/prisma-auth.repository';
import { AuditService } from '../infrastructure/audit/audit.service';
import { AUTH_REPOSITORY } from '../domain/repositories/auth.repository.interface';

const CommandHandlers = [RegisterHandler, LoginHandler, LogoutHandler, RefreshTokenHandler];
const QueryHandlers = [GetUserHandler, ValidateTokenHandler];

@Module({
  imports: [
    CqrsModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    // Legacy service (kept for backward compat — handlers are the new way)
    AuthService,
    PrismaService,
    JwtGuard,
    AuditService,
    // Repository binding
    { provide: AUTH_REPOSITORY, useClass: PrismaAuthRepository },
    // CQRS
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [JwtGuard, JwtModule, CqrsModule],
})
export class AuthModule {}
