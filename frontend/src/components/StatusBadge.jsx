const COLOR_MAP = {
  // greens = good/complete
  available: 'bg-furrow-100 text-furrow-800',
  delivered: 'bg-furrow-100 text-furrow-800',
  completed: 'bg-furrow-100 text-furrow-800',
  accepted: 'bg-furrow-100 text-furrow-800',
  success: 'bg-furrow-100 text-furrow-800',
  eligible: 'bg-furrow-100 text-furrow-800',
  // golds = in progress / awaiting action
  pending: 'bg-wheat-100 text-wheat-600',
  payment_pending: 'bg-wheat-100 text-wheat-600',
  ready_for_shipment: 'bg-wheat-100 text-wheat-600',
  low_stock: 'bg-wheat-100 text-wheat-600',
  countered: 'bg-wheat-100 text-wheat-600',
  under_review: 'bg-wheat-100 text-wheat-600',
  // blues = active transit / info
  accepted_by_logistics: 'bg-overcast-100 text-overcast-600',
  ready_to_ship: 'bg-overcast-100 text-overcast-600',
  shipped: 'bg-overcast-100 text-overcast-600',
  on_the_way: 'bg-overcast-100 text-overcast-600',
  placed: 'bg-overcast-100 text-overcast-600',
  // reds = negative
  rejected: 'bg-clay/10 text-clay',
  cancelled: 'bg-clay/10 text-clay',
  failed: 'bg-clay/10 text-clay',
  out_of_stock: 'bg-clay/10 text-clay',
  disputed: 'bg-clay/10 text-clay',
  open: 'bg-clay/10 text-clay',
};

export default function StatusBadge({ status }) {
  const classes = COLOR_MAP[status] || 'bg-soil/10 text-soil';
  return <span className={`badge ${classes}`}>{String(status).replace(/_/g, ' ')}</span>;
}
