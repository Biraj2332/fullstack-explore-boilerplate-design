import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { tweetsApi } from '@/api/tweets.api';
import type { Tweet } from '@/types';

export const TWEET_KEYS = {
  all: ['tweets'] as const,
  byId: (id: string) => ['tweets', id] as const,
  byUser: (userId: string) => ['tweets', 'user', userId] as const,
  timeline: (userIds: string[]) => ['tweets', 'timeline', userIds] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────
export function useTweet(id: string) {
  return useQuery({
    queryKey: TWEET_KEYS.byId(id),
    queryFn: () => tweetsApi.getById(id),
    enabled: !!id,
  });
}

export function useUserTweets(userId: string) {
  return useQuery({
    queryKey: TWEET_KEYS.byUser(userId),
    queryFn: () => tweetsApi.getUserTweets(userId),
    enabled: !!userId,
  });
}

export function useTimeline(userIds: string[] = []) {
  return useInfiniteQuery({
    queryKey: TWEET_KEYS.timeline(userIds),
    queryFn: ({ pageParam }) =>
      tweetsApi.getTimeline(userIds, 20, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length === 20 ? lastPage[lastPage.length - 1].id : undefined,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────
export function useCreateTweet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => tweetsApi.create({ content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TWEET_KEYS.all });
      toast.success('Tweet posted!');
    },
    onError: () => toast.error('Failed to post tweet'),
  });
}

export function useDeleteTweet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tweetsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TWEET_KEYS.all });
      toast.success('Tweet deleted');
    },
    onError: () => toast.error('Failed to delete tweet'),
  });
}

export function useLikeTweet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
      liked ? tweetsApi.unlike(id) : tweetsApi.like(id),

    // Optimistic update: toggle likesCount immediately
    onMutate: async ({ id, liked }) => {
      await qc.cancelQueries({ queryKey: TWEET_KEYS.byId(id) });
      const previous = qc.getQueryData<Tweet>(TWEET_KEYS.byId(id));
      if (previous) {
        qc.setQueryData<Tweet>(TWEET_KEYS.byId(id), {
          ...previous,
          likesCount: previous.likesCount + (liked ? -1 : 1),
        });
      }
      // Also patch in timeline caches
      qc.setQueriesData<{ pages: Tweet[][] }>({ queryKey: TWEET_KEYS.all }, (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) =>
            page.map((t) =>
              t.id === id
                ? { ...t, likesCount: t.likesCount + (liked ? -1 : 1) }
                : t,
            ),
          ),
        };
      });
      return { previous };
    },

    onError: (_err, { id }, ctx) => {
      if (ctx?.previous) qc.setQueryData(TWEET_KEYS.byId(id), ctx.previous);
      toast.error('Action failed');
    },

    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: TWEET_KEYS.byId(id) });
    },
  });
}

export function useRetweet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      tweetsApi.retweet(id, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TWEET_KEYS.all });
      toast.success('Retweeted!');
    },
    onError: () => toast.error('Retweet failed'),
  });
}

export function useUpdateTweet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      tweetsApi.update(id, { content }),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: TWEET_KEYS.byId(id) });
      qc.invalidateQueries({ queryKey: TWEET_KEYS.all });
      toast.success('Tweet updated');
    },
    onError: () => toast.error('Update failed'),
  });
}
