import api from './axios';
import type { Tweet, CreateTweetPayload, UpdateTweetPayload } from '@/types';

export const tweetsApi = {
  create: async (payload: CreateTweetPayload): Promise<Tweet> => {
    const { data } = await api.post('/tweets', payload);
    return data;
  },

  getById: async (id: string): Promise<Tweet> => {
    const { data } = await api.get(`/tweets/${id}`);
    return data;
  },

  update: async (id: string, payload: UpdateTweetPayload): Promise<Tweet> => {
    const { data } = await api.patch(`/tweets/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tweets/${id}`);
  },

  like: async (id: string): Promise<void> => {
    await api.post(`/tweets/${id}/like`);
  },

  unlike: async (id: string): Promise<void> => {
    await api.delete(`/tweets/${id}/like`);
  },

  retweet: async (id: string, comment = ''): Promise<Tweet> => {
    const { data } = await api.post(`/tweets/${id}/retweet`, { comment });
    return data;
  },

  getUserTweets: async (userId: string): Promise<Tweet[]> => {
    const { data } = await api.get(`/tweets/user/${userId}`);
    return data;
  },

  getTimeline: async (userIds: string[], limit = 20, cursor?: string): Promise<Tweet[]> => {
    const params: Record<string, string | number> = { limit };
    if (userIds.length) params.userIds = userIds.join(',');
    if (cursor) params.cursor = cursor;
    const { data } = await api.get('/tweets', { params });
    return data;
  },

  getLikesCount: async (id: string): Promise<{ tweetId: string; likesCount: number }> => {
    const { data } = await api.get(`/tweets/${id}/likes`);
    return data;
  },

  search: async (q: string, limit = 20, cursor?: string): Promise<{ tweets: Tweet[]; nextCursor: string | null }> => {
    const params: Record<string, string | number> = { q, limit };
    if (cursor) params.cursor = cursor;
    const { data } = await api.get('/tweets/search', { params });
    return data;
  },
};
