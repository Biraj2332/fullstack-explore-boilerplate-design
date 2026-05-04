import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useMyProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useUserTweets } from '@/hooks/useTweets';
import { TweetCard } from '@/components/tweets/TweetCard';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useMyProfile();
  const { data: tweets = [] } = useUserTweets(user?.id ?? '');
  const updateProfile = useUpdateProfile();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');

  const startEdit = () => {
    setName(profile?.name ?? '');
    setBio(profile?.bio ?? '');
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({ name: name || undefined, bio: bio || undefined });
      setEditing(false);
    } catch {
      toast.error('Failed to update profile');
    }
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Profile card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <Avatar name={profile?.name} email={user?.email} size="lg" />

          <div className="flex-1 min-w-0">
            {editing ? (
              <form onSubmit={handleSave} className="flex flex-col gap-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Display name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Bio"
                  rows={2}
                  className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={updateProfile.isPending}
                    className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updateProfile.isPending ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {profile?.name ?? user?.email?.split('@')[0]}
                </h1>
                <p className="text-sm text-gray-500">{user?.email}</p>
                {profile?.bio && (
                  <p className="mt-2 text-sm text-gray-700">{profile.bio}</p>
                )}
                <button
                  onClick={startEdit}
                  className="mt-3 rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tweets */}
      <h2 className="mb-3 mt-8 text-lg font-semibold text-gray-900">Tweets</h2>
      {tweets.length === 0 ? (
        <p className="text-sm text-gray-400">No tweets yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {tweets.map((t) => (
            <TweetCard key={t.id} tweet={t} />
          ))}
        </div>
      )}
    </div>
  );
}
