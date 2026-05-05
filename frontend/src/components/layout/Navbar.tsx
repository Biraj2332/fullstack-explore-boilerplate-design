import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-blue-600">
          FullStack
        </Link>

        {/* Search bar (authenticated only) */}
        {isAuthenticated && (
          <form onSubmit={handleSearch} className="hidden sm:flex items-center gap-1">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className="w-48 rounded-md border border-gray-300 px-3 py-1 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
            />
            <button
              type="submit"
              className="rounded-md bg-gray-100 px-2.5 py-1 text-sm text-gray-600 hover:bg-gray-200"
            >
              Go
            </button>
          </form>
        )}

        {isAuthenticated ? (
          <nav className="flex items-center gap-4">
            <Link
              to="/feed"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Feed
            </Link>
            <Link
              to="/profile"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              {user?.email?.split('@')[0]}
            </Link>

            {/* Notifications bell */}
            <NotificationsDropdown />

            {/* Admin link */}
            {user?.isAdmin && (
              <Link
                to="/admin/audit"
                className="rounded-md bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-800 hover:bg-yellow-200"
              >
                Admin
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
            >
              Logout
            </button>
          </nav>
        ) : (
          <nav className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign Up
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
