import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import { EmptyState, Pagination, Skeleton } from '../../components/Feedback';

export default function AdminProduce() {
  const [state, setState] = useState({ loading: true, data: [], pagination: null });
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const { data } = await api.get(`/admin/produce?page=${page}&limit=15`);
    setState({ loading: false, data: data.data, pagination: data.pagination });
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const moderate = async (id, status) => {
    await api.patch(`/admin/produce/${id}/moderate`, { status });
    toast.success('Listing updated');
    load();
  };

  if (state.loading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl">Produce Listings</h1>
      {state.data.length === 0 ? (
        <EmptyState title="No produce listings" />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-furrow-100 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-furrow-50 text-left text-xs uppercase tracking-wide text-soil/40">
                <tr><th className="px-4 py-3">Crop</th><th className="px-4 py-3">Farmer</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-furrow-50">
                {state.data.map((p) => (
                  <tr key={p._id}>
                    <td className="px-4 py-3 font-medium">{p.cropName}</td>
                    <td className="px-4 py-3 text-soil/60">{p.farmer?.name}</td>
                    <td className="px-4 py-3">₹{p.price}/{p.unit}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      {p.status !== 'inactive' ? (
                        <button onClick={() => moderate(p._id, 'inactive')} className="text-xs font-semibold text-clay hover:underline">Deactivate</button>
                      ) : (
                        <button onClick={() => moderate(p._id, 'available')} className="text-xs font-semibold text-furrow-700 hover:underline">Reactivate</button>
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
