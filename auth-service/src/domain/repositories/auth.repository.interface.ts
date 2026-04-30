import { AuthUser } from '../entities/auth-user.entity';

// Domain repository interface — implemented in infrastructure layer

export interface IAuthRepository {
  findByEmail(email: string): Promise<AuthUser | null>;
  findById(id: string): Promise<AuthUser | null>;
  create(email: string, passwordHash: string): Promise<AuthUser>;
  saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  findRefreshToken(token: string): Promise<{ userId: string; expiresAt: Date; user: AuthUser } | null>;
  deleteRefreshToken(token: string): Promise<void>;
  deleteRefreshTokensByUserId(userId: string): Promise<void>;
}

export const AUTH_REPOSITORY = Symbol('IAuthRepository');
