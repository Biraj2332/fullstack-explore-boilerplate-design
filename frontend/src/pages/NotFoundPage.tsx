import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-gray-200">404</h1>
      <p className="text-lg text-gray-600">Page not found</p>
      <Link to="/feed" className="text-blue-600 hover:underline">
        Back to feed
      </Link>
    </div>
  );
}
