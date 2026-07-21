import { Link } from 'react-router-dom';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-furrow-950 p-10 text-furrow-50 lg:flex">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🌱</span>
          <span className="font-display text-xl font-semibold">Farm Flow</span>
        </Link>
        <div>
          <h2 className="font-display text-3xl font-semibold leading-snug">
            Fresh produce, fair prices, direct from the field.
          </h2>
          <p className="mt-4 max-w-sm text-furrow-100/60">
            Every listing, bid, and delivery in one transparent flow — from harvest to checkout.
          </p>
        </div>
        <p className="text-xs text-furrow-100/40">© {new Date().getFullYear()} Farm Flow</p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="text-2xl">🌱</span>
            <span className="font-display text-xl font-semibold">Farm Flow</span>
          </Link>
          <h1 className="font-display text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-soil/50">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
