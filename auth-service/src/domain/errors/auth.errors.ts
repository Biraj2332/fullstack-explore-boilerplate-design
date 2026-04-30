// Domain-level error types — no NestJS HttpException

export type AuthDomainError =
  | { code: 'EMAIL_IN_USE';         message: string }
  | { code: 'INVALID_CREDENTIALS';  message: string }
  | { code: 'INVALID_TOKEN';        message: string }
  | { code: 'TOKEN_NOT_FOUND';      message: string }
  | { code: 'TOKEN_EXPIRED';        message: string }
  | { code: 'USER_NOT_FOUND';       message: string }
  | { code: 'USER_DELETED';         message: string };
