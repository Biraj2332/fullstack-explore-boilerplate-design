import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useDeleteTweet, useLikeTweet, useRetweet } from '@/hooks/useTweets';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Avatar } from '@/components/ui/Avatar';
import type { Tweet } from '@/types';

interface Props {
  tweet: Tweet;
  /** Whether the logged-in user has liked this tweet (caller tracks this) */
  isLiked?: boolean;
}

export function TweetCard({ tweet, isLiked = false }: Props) {
  const { user } = useAuth();
  const likeMutation = useLikeTweet();
  const retweetMutation = useRetweet();
  const deleteMutation = useDeleteTweet();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showRetweetInput, setShowRetweetInput] = useState(false);
  const [retweetComment, setRetweetComment] = useState('');

  const isOwner = user?.id === tweet.userId;
  const age = formatDistanceToNow(new Date(tweet.createdAt), { addSuffix: true });

  const handleLike = () => {
    likeMutation.mutate({ id: tweet.id, liked: isLiked });
  };

  const handleRetweet = () => {
    retweetMutation.mutate(
      { id: tweet.id, comment: retweetComment },
      {
        onSuccess: () => {
          setShowRetweetInput(false);
          setRetweetComment('');
        },
      },
    );
  };

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {tweet.originalTweetId && (
        <p className="mb-2 text-xs text-gray-400">🔁 Retweet</p>
      )}

      <div className="flex gap-3">
        <Avatar size="sm" email={tweet.userId} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-500 truncate">{tweet.userId.slice(0, 8)}…</span>
            <Link
              to={`/tweet/${tweet.id}`}
              className="shrink-0 text-xs text-gray-400 hover:text-blue-500 hover:underline"
            >
              {age}
            </Link>
          </div>

          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-800">
            {tweet.content}
          </p>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            {/* Like */}
            <button
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className={`flex items-center gap-1 hover:text-red-500 ${isLiked ? 'text-red-500' : ''}`}
            >
              {isLiked ? '❤️' : '🤍'} {tweet.likesCount}
            </button>

            {/* Retweet */}
            <button
              onClick={() => setShowRetweetInput((v) => !v)}
              className="flex items-center gap-1 hover:text-green-600"
            >
              🔁 {tweet.retweetsCount}
            </button>

            {/* Delete (owner only) */}
            {isOwner && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="ml-auto flex items-center gap-1 hover:text-red-600"
              >
                🗑️
              </button>
            )}
          </div>

          {/* Retweet comment box */}
          {showRetweetInput && (
            <div className="mt-3 flex gap-2">
              <input
                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Add a comment (optional)"
                value={retweetComment}
                onChange={(e) => setRetweetComment(e.target.value)}
              />
              <button
                onClick={handleRetweet}
                disabled={retweetMutation.isPending}
                className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
              >
                RT
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDelete}
        title="Delete tweet"
        message="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          deleteMutation.mutate(tweet.id);
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </article>
  );
}
