import { IQuery } from '@nestjs/cqrs';

export class GetUserQuery implements IQuery {
  constructor(public readonly authId: string) {}
}

export class GetUserByIdQuery implements IQuery {
  constructor(public readonly id: string) {}
}

export class ListUsersQuery implements IQuery {
  constructor(public readonly includeDeleted = false) {}
}

export class GetDeletedUsersQuery implements IQuery {}
