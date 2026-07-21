import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-furrow-50 px-6 text-center">
      <span className="text-5xl">🌾</span>
      <h1 className="mt-4 font-display text-3xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-soil/50">This field hasn't been planted yet.</p>
      <Link to="/" className="btn-primary mt-6">Back home</Link>
    </div>
  );
}

export function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-furrow-50 px-6 text-center">
      <span className="text-5xl">🚫</span>
      <h1 className="mt-4 font-display text-3xl font-semibold">Not authorized</h1>
      <p className="mt-2 text-sm text-soil/50">Your account doesn't have access to this page.</p>
      <Link to="/" className="btn-primary mt-6">Back home</Link>
    </div>
  );
}
