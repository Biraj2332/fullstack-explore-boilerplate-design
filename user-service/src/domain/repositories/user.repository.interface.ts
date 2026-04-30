import { UserProfile } from '../entities/user-profile.entity';

export interface IUserRepository {
  findByAuthId(authId: string): Promise<UserProfile | null>;
  findById(id: string): Promise<UserProfile | null>;
  findAll(includeDeleted?: boolean): Promise<UserProfile[]>;
  create(authId: string, email: string): Promise<UserProfile>;
  update(authId: string, data: Partial<{ name: string; bio: string; avatarUrl: string }>): Promise<UserProfile>;
  softDelete(authId: string): Promise<void>;
  restore(authId: string): Promise<void>;
}

export const USER_REPOSITORY = Symbol('IUserRepository');
