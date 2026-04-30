import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserQuery } from '../queries/get-user.query';
import { AUTH_REPOSITORY } from '../../domain/repositories/auth.repository.interface';
import type { IAuthRepository } from '../../domain/repositories/auth.repository.interface';
import { AuthUser } from '../../domain/entities/auth-user.entity';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery, AuthUser | null> {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepo: IAuthRepository,
  ) {}

  execute(query: GetUserQuery): Promise<AuthUser | null> {
    return this.authRepo.findById(query.userId);
  }
}
