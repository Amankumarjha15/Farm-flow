import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import { EmptyState, Pagination, Skeleton } from '../../components/Feedback';

const STATUS_FILTERS = ['', 'pending', 'eligible', 'completed'];

export default function AdminPayouts() {
  const [state, setState] = useState({ loading: true, data: [], pagination: null });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [completingId, setCompletingId] = useState(null);
  const [txnRef, setTxnRef] = useState('');

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const { data } = await api.get(`/payouts/admin?page=${page}&limit=15${statusFilter ? `&status=${statusFilter}` : ''}`);
    setState({ loading: false, data: data.data, pagination: data.pagination });
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const complete = async (id) => {
    try {
      await api.patch(`/payouts/${id}/complete`, { transactionRef: txnRef || undefined });
      toast.success('Payout marked as completed');
      setCompletingId(null);
      setTxnRef('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete payout');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl">Payouts</h1>
        <select className="input max-w-[160px]" value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
          {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s ? s[0].toUpperCase() + s.slice(1) : 'All statuses'}</option>)}
        </select>
      </div>

      {state.loading && <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>}

      {!state.loading && state.data.length === 0 && <EmptyState title="No payouts found" />}

      {!state.loading && state.data.length > 0 && (
        <>
          <div className="overflow-hidden rounded-lg border border-furrow-100 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-furrow-50 text-left text-xs uppercase tracking-wide text-soil/40">
                <tr>
                  <th className="px-4 py-3">Farmer</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-furrow-50">
                {state.data.map((p) => (
                  <tr key={p._id}>
                    <td className="px-4 py-3 font-medium">{p.farmer?.name}</td>
                    <td className="px-4 py-3 text-soil/60">{p.order?.orderNumber}</td>
                    <td className="px-4 py-3">₹{p.amount.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      {p.status === 'eligible' && (
                        completingId === p._id ? (
                          <div className="flex items-center gap-2">
                            <input
                              className="input w-32 py-1 text-xs"
                              placeholder="Txn ref (optional)"
                              value={txnRef}
                              onChange={(e) => setTxnRef(e.target.value)}
                            />
                            <button onClick={() => complete(p._id)} className="text-xs font-semibold text-furrow-700 hover:underline">Confirm</button>
                            <button onClick={() => setCompletingId(null)} className="text-xs text-soil/40 hover:underline">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setCompletingId(p._id)} className="text-xs font-semibold text-furrow-700 hover:underline">
                            Mark Completed
                          </button>
                        )
                      )}
                    </td>
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
