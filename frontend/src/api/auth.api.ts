import api from './axios';
import type { AuthUser, LoginResponse } from '@/types';

export const authApi = {
  register: async (email: string, password: string): Promise<AuthUser> => {
    const { data } = await api.post('/auth/register', { email, password });
    return data;
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken });
  },

  refresh: async (refreshToken: string): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data;
  },

  me: async (): Promise<AuthUser> => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};
