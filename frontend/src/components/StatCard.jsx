export default function StatCard({ label, value, sublabel, accent = 'furrow' }) {
  const accentClasses = {
    furrow: 'text-furrow-800',
    wheat: 'text-wheat-600',
    overcast: 'text-overcast-600',
    clay: 'text-clay',
  };

  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-soil/50">{label}</p>
      <p className={`mt-2 font-display text-3xl font-semibold ${accentClasses[accent]}`}>{value}</p>
      {sublabel && <p className="mt-1 text-xs text-soil/40">{sublabel}</p>}
    </div>
  );
}
