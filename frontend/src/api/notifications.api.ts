import api from './axios';
import type { Notification } from '@/types';

export const notificationsApi = {
  getAll: async (): Promise<Notification[]> => {
    const { data } = await api.get('/notifications');
    return data;
  },

  getUnread: async (): Promise<Notification[]> => {
    const { data } = await api.get('/notifications/unread');
    return data;
  },

  markRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};
