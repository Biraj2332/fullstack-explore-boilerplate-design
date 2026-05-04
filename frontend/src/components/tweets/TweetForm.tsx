import { useState } from 'react';
import { useCreateTweet } from '@/hooks/useTweets';

const MAX = 280;

export function TweetForm() {
  const [content, setContent] = useState('');
  const { mutate, isPending } = useCreateTweet();

  const remaining = MAX - content.length;
  const isOverLimit = remaining < 0;
  const isEmpty = content.trim().length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmpty || isOverLimit || isPending) return;
    mutate(content, { onSuccess: () => setContent('') });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's happening?"
        rows={3}
        className="w-full resize-none rounded-md border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <div className="mt-2 flex items-center justify-between">
        {/* Character counter */}
        <span
          className={`text-xs font-medium ${
            isOverLimit
              ? 'text-red-600'
              : remaining <= 20
              ? 'text-yellow-600'
              : 'text-gray-400'
          }`}
        >
          {remaining}
        </span>

        <button
          type="submit"
          disabled={isEmpty || isOverLimit || isPending}
          className="rounded-full bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
        >
          {isPending ? 'Posting…' : 'Tweet'}
        </button>
      </div>
    </form>
  );
}
