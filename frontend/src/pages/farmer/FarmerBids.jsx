import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import { EmptyState, ErrorState, Skeleton } from '../../components/Feedback';

export default function FarmerBids() {
  const [produceList, setProduceList] = useState([]);
  const [selectedProduce, setSelectedProduce] = useState('');
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [counterValue, setCounterValue] = useState({});

  const loadProduce = useCallback(async () => {
    const { data } = await api.get('/produce/my-listings?limit=100');
    setProduceList(data.data);
    if (data.data.length && !selectedProduce) setSelectedProduce(data.data[0]._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBids = useCallback(async (produceId) => {
    if (!produceId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/bids/produce/${produceId}`);
      setBids(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bids');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProduce(); }, [loadProduce]);
  useEffect(() => { if (selectedProduce) loadBids(selectedProduce); }, [selectedProduce, loadBids]);

  const act = async (bidId, action, extra = {}) => {
    try {
      await api.patch(`/bids/${bidId}/${action}`, extra);
      toast.success(`Bid ${action === 'counter' ? 'countered' : action + 'ed'}`);
      loadBids(selectedProduce);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl">Bids</h1>

      <div className="mb-5 max-w-sm">
        <label className="label">Select listing</label>
        <select className="input" value={selectedProduce} onChange={(e) => setSelectedProduce(e.target.value)}>
          {produceList.map((p) => <option key={p._id} value={p._id}>{p.cropName}</option>)}
        </select>
      </div>

      {loading && <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>}
      {!loading && error && <ErrorState message={error} onRetry={() => loadBids(selectedProduce)} />}
      {!loading && !error && bids.length === 0 && <EmptyState title="No bids on this listing yet" />}

      {!loading && !error && bids.length > 0 && (
        <div className="space-y-4">
          {bids.map((bid) => (
            <div key={bid._id} className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{bid.retailer?.name}</p>
                  <p className="text-xs text-soil/40">{bid.retailer?.email} · {bid.retailer?.phone}</p>
                </div>
                <StatusBadge status={bid.status} />
              </div>
              <div className="mt-3 flex items-center gap-6 text-sm">
                <p><span className="text-soil/40">Quantity:</span> {bid.quantity}</p>
                <p><span className="text-soil/40">Offer:</span> ₹{bid.proposedPrice}</p>
                {bid.counterPrice && <p><span className="text-soil/40">Your counter:</span> ₹{bid.counterPrice}</p>}
              </div>
              {bid.message && <p className="mt-2 text-sm italic text-soil/50">"{bid.message}"</p>}

              {(bid.status === 'pending' || bid.status === 'countered') && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button onClick={() => act(bid._id, 'accept')} className="btn-primary px-3 py-1.5 text-xs">Accept</button>
                  <button onClick={() => act(bid._id, 'reject')} className="btn-outline px-3 py-1.5 text-xs text-clay">Reject</button>
                  {bid.status === 'pending' && (
                    <>
                      <input
                        type="number"
                        placeholder="Counter price"
                        className="input w-32 py-1.5 text-xs"
                        value={counterValue[bid._id] || ''}
                        onChange={(e) => setCounterValue({ ...counterValue, [bid._id]: e.target.value })}
                      />
                      <button
                        onClick={() => act(bid._id, 'counter', { counterPrice: Number(counterValue[bid._id]) })}
                        disabled={!counterValue[bid._id]}
                        className="btn-outline px-3 py-1.5 text-xs"
                      >
                        Send counter
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
