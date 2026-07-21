import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: '🌾', title: 'List your harvest', desc: 'Farmers publish produce with quality grades, photos, and live availability.' },
  { icon: '🤝', title: 'Negotiate fairly', desc: 'Retailers bid, farmers counter or accept — no middlemen setting the price.' },
  { icon: '🚚', title: 'Track every mile', desc: 'Manual, transparent shipment updates from pickup to doorstep.' },
  { icon: '💳', title: 'Get paid on delivery', desc: 'Payouts release automatically once the order is confirmed delivered.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-furrow-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌱</span>
          <span className="font-display text-xl font-semibold text-furrow-950">Farm Flow</span>
        </div>
        <div className="flex gap-3">
          <Link to="/login" className="btn-ghost">Log in</Link>
          <Link to="/register" className="btn-primary">Get started</Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="mx-auto mb-4 inline-block rounded-full bg-wheat-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-wheat-600">
          Farm to retail, without the middlemen
        </p>
        <h1 className="font-display text-5xl font-semibold leading-tight text-furrow-950 sm:text-6xl">
          Connecting Farmers <br /> Directly With Retailers
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-soil/60">
          List produce, negotiate prices, and move goods from farm to storefront — with transparent
          logistics and payouts at every step.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/register" className="btn-accent px-6 py-3 text-base">Join as a Farmer</Link>
          <Link to="/register" className="btn-outline px-6 py-3 text-base">Join as a Retailer</Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-6">
            <div className="mb-3 text-3xl">{f.icon}</div>
            <h3 className="font-display text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-soil/50">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-furrow-100 py-8 text-center text-xs text-soil/40">
        © {new Date().getFullYear()} Farm Flow. All rights reserved.
      </footer>
    </div>
  );
}
