import { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import { EmptyState, Pagination, Skeleton } from '../../components/Feedback';

export default function LogisticsHistory() {
  const [state, setState] = useState({ loading: true, data: [], pagination: null });
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const { data } = await api.get(`/logistics/history?page=${page}&limit=10`);
    setState({ loading: false, data: data.data, pagination: data.pagination });
  }, [page]);

  useEffect(() => { load(); }, [load]);

  if (state.loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl">Delivery History</h1>
      {state.data.length === 0 ? (
        <EmptyState title="No completed deliveries yet" />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-furrow-100 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-furrow-50 text-left text-xs uppercase tracking-wide text-soil/40">
                <tr><th className="px-4 py-3">Order #</th><th className="px-4 py-3">Delivered</th><th className="px-4 py-3">Amount</th></tr>
              </thead>
              <tbody className="divide-y divide-furrow-50">
                {state.data.map((o) => (
                  <tr key={o._id}>
                    <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                    <td className="px-4 py-3 text-soil/50">{new Date(o.updatedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">₹{o.totalAmount.toLocaleString()}</td>
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
