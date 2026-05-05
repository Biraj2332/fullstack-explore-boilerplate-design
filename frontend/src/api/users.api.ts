import api from './axios';
import type { UserProfile, UpdateProfilePayload } from '@/types';

export const usersApi = {
  getMyProfile: async (): Promise<UserProfile> => {
    const { data } = await api.get('/users/profile');
    return data;
  },

  getUserById: async (id: string): Promise<UserProfile> => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    const { data } = await api.patch('/users/profile', payload);
    return data;
  },

  deleteProfile: async (): Promise<void> => {
    await api.delete('/users/profile');
  },

  restoreProfile: async (): Promise<void> => {
    await api.post('/users/profile/restore');
  },

  listUsers: async (): Promise<UserProfile[]> => {
    const { data } = await api.get('/users/list');
    return data;
  },

  search: async (q: string, limit = 10): Promise<UserProfile[]> => {
    const { data } = await api.get('/users/search', { params: { q, limit } });
    return data;
  },
};
