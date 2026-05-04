import { useRef, useCallback } from 'react';
import { useTimeline } from '@/hooks/useTweets';
import { TweetCard } from './TweetCard';
import { Spinner } from '@/components/ui/Spinner';

interface Props {
  userIds?: string[];
}

export function TweetFeed({ userIds = [] }: Props) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useTimeline(userIds);

  // Intersection observer for infinite scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      if (node) {
        observer.current = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
        });
        observer.current.observe(node);
      }
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  if (isLoading) return <Spinner />;

  const tweets = data?.pages.flat() ?? [];

  if (tweets.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-gray-400">
        No tweets yet. Be the first to post!
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {tweets.map((tweet) => (
        <TweetCard key={tweet.id} tweet={tweet} />
      ))}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} />

      {isFetchingNextPage && (
        <div className="py-4">
          <Spinner size="sm" />
        </div>
      )}

      {!hasNextPage && tweets.length > 0 && (
        <p className="py-4 text-center text-xs text-gray-400">
          You've reached the end
        </p>
      )}
    </div>
  );
}
