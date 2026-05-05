import { useParams, useNavigate } from 'react-router-dom';
import { useTweet } from '@/hooks/useTweets';
import { TweetCard } from '@/components/tweets/TweetCard';
import { Spinner } from '@/components/ui/Spinner';

export default function TweetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: tweet, isLoading, isError } = useTweet(id ?? '');

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !tweet) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-gray-700">Tweet not found.</p>
        <button
          onClick={() => navigate('/feed')}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Back to feed
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm text-blue-600 hover:underline"
      >
        ← Back
      </button>

      <TweetCard tweet={tweet} />

      {/* Metadata panel */}
      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-500">
        <p><span className="font-medium text-gray-700">Tweet ID:</span> {tweet.id}</p>
        <p className="mt-1"><span className="font-medium text-gray-700">Author ID:</span> {tweet.userId}</p>
        <p className="mt-1"><span className="font-medium text-gray-700">Created:</span> {new Date(tweet.createdAt).toLocaleString()}</p>
        {tweet.updatedAt !== tweet.createdAt && (
          <p className="mt-1"><span className="font-medium text-gray-700">Updated:</span> {new Date(tweet.updatedAt).toLocaleString()}</p>
        )}
        {tweet.originalTweetId && (
          <p className="mt-1"><span className="font-medium text-gray-700">Original tweet:</span> {tweet.originalTweetId}</p>
        )}
        <div className="mt-2 flex gap-6">
          <span>❤️ <strong>{tweet.likesCount}</strong> likes</span>
          <span>🔁 <strong>{tweet.retweetsCount}</strong> retweets</span>
        </div>
      </div>
    </div>
  );
}
