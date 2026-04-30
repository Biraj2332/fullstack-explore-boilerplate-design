export type UserDomainError =
  | { code: 'PROFILE_NOT_FOUND'; message: string }
  | { code: 'PROFILE_ALREADY_EXISTS'; message: string }
  | { code: 'USER_NOT_FOUND'; message: string }
  | { code: 'USER_DELETED'; message: string }
  | { code: 'USER_ALREADY_DELETED'; message: string }
  | { code: 'USER_NOT_DELETED'; message: string };
