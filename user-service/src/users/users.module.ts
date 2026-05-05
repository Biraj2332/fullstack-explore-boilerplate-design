import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { JwtGuard } from './guards/jwt.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

// CQRS Handlers
import { CreateUserHandler } from '../application/handlers/create-user.handler';
import { UpdateUserHandler } from '../application/handlers/update-user.handler';
import { SoftDeleteUserHandler, RestoreUserHandler } from '../application/handlers/user-lifecycle.handler';
import { GetUserHandler, GetUserByIdHandler, ListUsersHandler, GetDeletedUsersHandler, SearchUsersHandler } from '../application/handlers/user-query.handler';

// Infrastructure
import { PrismaUserRepository } from '../infrastructure/persistence/prisma-user.repository';
import { AuditService } from '../infrastructure/audit/audit.service';
import { USER_REPOSITORY } from '../domain/repositories/user.repository.interface';

const CommandHandlers = [CreateUserHandler, UpdateUserHandler, SoftDeleteUserHandler, RestoreUserHandler];
const QueryHandlers = [GetUserHandler, GetUserByIdHandler, ListUsersHandler, GetDeletedUsersHandler, SearchUsersHandler];

@Module({
  imports: [CqrsModule, JwtModule.register({})],
  controllers: [UsersController],
  providers: [
    UsersService,
    PrismaService,
    JwtGuard,
    AuditService,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class UsersModule {}
