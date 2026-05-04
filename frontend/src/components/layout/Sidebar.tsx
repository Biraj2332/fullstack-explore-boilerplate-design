import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMyProfile } from '@/hooks/useProfile';
import { Avatar } from '@/components/ui/Avatar';

export function Sidebar() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile();

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-20 rounded-xl border border-gray-200 bg-white p-4">
        {/* User card */}
        <div className="flex items-center gap-3">
          <Avatar name={profile?.name} email={user?.email} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {profile?.name ?? user?.email?.split('@')[0]}
            </p>
            <p className="truncate text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="mt-4 flex flex-col gap-1">
          <Link
            to="/feed"
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            🏠 Home Feed
          </Link>
          <Link
            to="/profile"
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            👤 My Profile
          </Link>
          <Link
            to="/notifications"
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            🔔 Notifications
          </Link>
        </nav>
      </div>
    </aside>
  );
}
