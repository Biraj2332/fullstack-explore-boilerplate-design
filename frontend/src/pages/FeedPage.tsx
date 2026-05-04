import { TweetForm } from '@/components/tweets/TweetForm';
import { TweetFeed } from '@/components/tweets/TweetFeed';
import { Sidebar } from '@/components/layout/Sidebar';

export default function FeedPage() {
  return (
    <div className="mx-auto flex max-w-5xl gap-6 px-4 py-6">
      {/* Main column */}
      <main className="flex-1 min-w-0 flex flex-col gap-4">
        <TweetForm />
        <TweetFeed />
      </main>

      {/* Right sidebar */}
      <Sidebar />
    </div>
  );
}
