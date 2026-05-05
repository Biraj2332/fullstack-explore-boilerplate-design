import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { tweetsApi } from '@/api/tweets.api';
import { usersApi } from '@/api/users.api';
import type { Tweet, UserProfile } from '@/types';

type Tab = 'tweets' | 'users';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>('tweets');

  const [tweetResults, setTweetResults] = useState<Tweet[]>([]);
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const q = searchParams.get('q') ?? '';

  const runSearch = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const [tweetsResp, users] = await Promise.all([
        tweetsApi.search(query),
        usersApi.search(query),
      ]);
      setTweetResults(tweetsResp.tweets);
      setUserResults(users);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = (form.elements.namedItem('q') as HTMLInputElement).value.trim();
    if (!input) return;
    setSearchParams({ q: input });
    runSearch(input);
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Search</h1>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search tweets or users…"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {/* Tab switcher */}
      {searched && !loading && (
        <div className="mb-4 flex gap-1 border-b border-gray-200">
          {(['tweets', 'users'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'tweets' ? `Tweets (${tweetResults.length})` : `Users (${userResults.length})`}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {searched && !loading && tab === 'tweets' && (
        <section>
          {tweetResults.length === 0 ? (
            <p className="text-sm text-gray-500">No tweets found.</p>
          ) : (
            <ul className="space-y-3">
              {tweetResults.map((tweet) => (
                <li key={tweet.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <Link to={`/tweet/${tweet.id}`} className="block hover:opacity-80">
                    <p className="text-sm text-gray-800">{tweet.content}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(tweet.createdAt).toLocaleString()}
                      {' · '}{tweet.likesCount} {tweet.likesCount === 1 ? 'like' : 'likes'}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {searched && !loading && tab === 'users' && (
        <section>
          {userResults.length === 0 ? (
            <p className="text-sm text-gray-500">No users found.</p>
          ) : (
            <ul className="space-y-3">
              {userResults.map((user) => (
                <li key={user.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name ?? user.email}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                      {(user.name ?? user.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name ?? '—'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
