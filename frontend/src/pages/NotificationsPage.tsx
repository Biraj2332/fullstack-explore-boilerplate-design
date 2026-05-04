import { formatDistanceToNow } from 'date-fns';
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  useDeleteNotification,
} from '@/hooks/useNotifications';
import { Spinner } from '@/components/ui/Spinner';

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const del = useDeleteNotification();

  const unread = notifications.filter((n) => !n.isRead).length;

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          Notifications{unread > 0 && <span className="ml-2 text-base text-blue-600">({unread} unread)</span>}
        </h1>
        {unread > 0 && (
          <button
            onClick={() => markAll.mutate()}
            className="text-sm text-blue-600 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400">No notifications yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${
                !n.isRead ? 'border-l-4 border-l-blue-400' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                <p className="text-sm text-gray-600">{n.body}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  {' · '}
                  <span className="capitalize">{n.type.replace(/_/g, ' ').toLowerCase()}</span>
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                {!n.isRead && (
                  <button
                    onClick={() => markRead.mutate(n.id)}
                    className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
                  >
                    Mark read
                  </button>
                )}
                <button
                  onClick={() => del.mutate(n.id)}
                  className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
