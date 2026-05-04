import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { notificationsApi } from '@/api/notifications.api';

export const NOTIF_KEYS = {
  all: ['notifications'] as const,
  unread: ['notifications', 'unread'] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: NOTIF_KEYS.all,
    queryFn: notificationsApi.getAll,
    refetchInterval: 30_000, // poll every 30 s
  });
}

export function useUnreadNotifications() {
  return useQuery({
    queryKey: NOTIF_KEYS.unread,
    queryFn: notificationsApi.getUnread,
    refetchInterval: 15_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_KEYS.all }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIF_KEYS.all });
      toast.success('All notifications marked as read');
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_KEYS.all }),
  });
}
