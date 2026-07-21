import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import { CardSkeleton, EmptyState, ErrorState, Pagination } from '../../components/Feedback';

export default function FarmerProduceList() {
  const [state, setState] = useState({ loading: true, error: null, data: [], pagination: null });
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data } = await api.get(`/produce/my-listings?page=${page}&limit=9`);
      setState({ loading: false, error: null, data: data.data, pagination: data.pagination });
    } catch (err) {
      setState({ loading: false, error: err.response?.data?.message || 'Failed to load produce', data: [], pagination: null });
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this listing? This cannot be undone.')) return;
    try {
      await api.delete(`/produce/${id}`);
      toast.success('Listing removed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove listing');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl">My Produce</h1>
        <Link to="/farmer/produce/new" className="btn-accent">+ Add Produce</Link>
      </div>

      {state.loading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}

      {!state.loading && state.error && <ErrorState message={state.error} onRetry={load} />}

      {!state.loading && !state.error && state.data.length === 0 && (
        <EmptyState
          title="No produce listed yet"
          description="Create your first listing so retailers can find and order your harvest."
          action={<Link to="/farmer/produce/new" className="btn-accent">Add your first listing</Link>}
        />
      )}

      {!state.loading && !state.error && state.data.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {state.data.map((p) => (
              <div key={p._id} className="card overflow-hidden">
                <div className="h-36 bg-furrow-100">
                  {p.images?.[0]?.url ? (
                    <img src={p.images[0].url} alt={p.cropName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl">🌾</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-base font-semibold">{p.cropName}</h3>
                      <p className="text-xs text-soil/40">{p.category} · Grade {p.qualityGrade}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="mt-2 font-display text-lg font-semibold text-wheat-600">
                    ₹{p.price}<span className="text-xs font-body text-soil/40">/{p.unit}</span>
                  </p>
                  <p className="text-xs text-soil/40">{p.availableQuantity} {p.unit} available</p>
                  <div className="mt-3 flex gap-2">
                    <Link to={`/farmer/produce/${p._id}/edit`} className="btn-outline flex-1 py-1.5 text-xs">Edit</Link>
                    <button onClick={() => handleDelete(p._id)} className="btn-ghost py-1.5 text-xs text-clay hover:bg-clay/5">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={state.pagination.page} pages={state.pagination.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
