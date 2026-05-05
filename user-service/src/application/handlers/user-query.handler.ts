import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserQuery, GetUserByIdQuery, ListUsersQuery, GetDeletedUsersQuery, SearchUsersQuery } from '../queries/user.queries';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserProfile } from '../../domain/entities/user-profile.entity';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository) {}
  execute(query: GetUserQuery): Promise<UserProfile | null> {
    return this.userRepo.findByAuthId(query.authId);
  }
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository) {}
  execute(query: GetUserByIdQuery): Promise<UserProfile | null> {
    return this.userRepo.findById(query.id);
  }
}

@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<ListUsersQuery> {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository) {}
  execute(query: ListUsersQuery): Promise<UserProfile[]> {
    return this.userRepo.findAll(query.includeDeleted);
  }
}

@QueryHandler(GetDeletedUsersQuery)
export class GetDeletedUsersHandler implements IQueryHandler<GetDeletedUsersQuery> {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository) {}
  execute(): Promise<UserProfile[]> {
    return this.userRepo.findAll(true).then(users => users.filter(u => u.isDeleted()));
  }
}

@QueryHandler(SearchUsersQuery)
export class SearchUsersHandler implements IQueryHandler<SearchUsersQuery> {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository) {}
  execute(q: SearchUsersQuery): Promise<UserProfile[]> {
    return this.userRepo.search(q.q, q.limit);
  }
}
