import { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import { EmptyState, ErrorState, Pagination, Skeleton } from '../../components/Feedback';

export default function FarmerOrders() {
  const [state, setState] = useState({ loading: true, error: null, data: [], pagination: null });
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data } = await api.get(`/orders/farmer-orders?page=${page}&limit=10`);
      setState({ loading: false, error: null, data: data.data, pagination: data.pagination });
    } catch (err) {
      setState({ loading: false, error: err.response?.data?.message || 'Failed to load orders', data: [], pagination: null });
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h1 className="mb-6 text-2xl">Orders</h1>
      {state.loading && <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>}
      {!state.loading && state.error && <ErrorState message={state.error} onRetry={load} />}
      {!state.loading && !state.error && state.data.length === 0 && <EmptyState title="No orders yet" />}

      {!state.loading && !state.error && state.data.length > 0 && (
        <>
          <div className="overflow-hidden rounded-lg border border-furrow-100 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-furrow-50 text-left text-xs uppercase tracking-wide text-soil/40">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-furrow-50">
                {state.data.map((o) => (
                  <tr key={o._id}>
                    <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                    <td className="px-4 py-3 text-soil/60">{o.items?.length} item(s)</td>
                    <td className="px-4 py-3">₹{o.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-soil/40">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={state.pagination.page} pages={state.pagination.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
