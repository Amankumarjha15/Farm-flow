import { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import { EmptyState, Pagination, Skeleton } from '../../components/Feedback';

export default function AdminPayments() {
  const [state, setState] = useState({ loading: true, data: [], pagination: null });
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const { data } = await api.get(`/admin/payments?page=${page}&limit=15`);
    setState({ loading: false, data: data.data, pagination: data.pagination });
  }, [page]);

  useEffect(() => { load(); }, [load]);

  if (state.loading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl">Payments</h1>
        <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/admin/export/orders`} className="btn-outline text-xs" target="_blank" rel="noreferrer">
          Export Orders CSV
        </a>
      </div>
      {state.data.length === 0 ? (
        <EmptyState title="No payments recorded yet" />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-furrow-100 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-furrow-50 text-left text-xs uppercase tracking-wide text-soil/40">
                <tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Retailer</th><th className="px-4 py-3">Provider</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-furrow-50">
                {state.data.map((p) => (
                  <tr key={p._id}>
                    <td className="px-4 py-3 font-medium">{p.order?.orderNumber}</td>
                    <td className="px-4 py-3 text-soil/60">{p.retailer?.name}</td>
                    <td className="px-4 py-3 capitalize">{p.provider}</td>
                    <td className="px-4 py-3">₹{p.amount.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
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
