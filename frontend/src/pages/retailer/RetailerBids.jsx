import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import { EmptyState, Skeleton } from '../../components/Feedback';

export default function RetailerBids() {
  const [bids, setBids] = useState(null);
  const [negotiateOpenId, setNegotiateOpenId] = useState(null);
  const [negotiatePrice, setNegotiatePrice] = useState('');

  const load = () => {
    api.get('/bids/my-bids').then(({ data }) => setBids(data.data));
  };
  useEffect(() => { load(); }, []);

  const act = async (bidId, action, extra = {}) => {
    try {
      await api.patch(`/bids/${bidId}/${action}`, extra);
      toast.success(
        action === 'accept-counter' ? 'Offer accepted — you can now check out'
        : action === 'reject-counter' ? 'Counter-offer declined'
        : 'New offer sent to the farmer'
      );
      setNegotiateOpenId(null);
      setNegotiatePrice('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  if (!bids) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl">My Bids</h1>
      {bids.length === 0 ? (
        <EmptyState title="You haven't placed any bids yet" description="Negotiate prices directly from a produce listing." />
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => (
            <div key={bid._id} className="card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 overflow-hidden rounded-DEFAULT bg-furrow-100">
                    {bid.produce?.images?.[0]?.url && <img src={bid.produce.images[0].url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div>
                    <p className="font-medium">{bid.produce?.cropName}</p>
                    <p className="text-xs text-soil/40">
                      {bid.quantity} {bid.produce?.unit} · Your offer ₹{bid.proposedPrice}
                      {bid.counterPrice ? ` · Farmer countered with ₹${bid.counterPrice}` : ''}
                    </p>
                  </div>
                </div>
                <StatusBadge status={bid.status} />
              </div>

              {/* Bid was accepted (either directly or via a countered offer) → straight to checkout */}
              {bid.status === 'accepted' && (
                <div className="mt-4 flex justify-end">
                  <Link to="/retailer/cart" className="btn-primary py-1.5 text-xs">Checkout</Link>
                </div>
              )}

              {/* Farmer sent a counter-offer — retailer can accept it, reject it, or negotiate again */}
              {bid.status === 'countered' && (
                <div className="mt-4 border-t border-furrow-100 pt-4">
                  {negotiateOpenId === bid._id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        placeholder="Your new offer"
                        className="input w-32 py-1.5 text-xs"
                        value={negotiatePrice}
                        onChange={(e) => setNegotiatePrice(e.target.value)}
                      />
                      <button
                        onClick={() => act(bid._id, 'negotiate', { proposedPrice: Number(negotiatePrice) })}
                        disabled={!negotiatePrice}
                        className="btn-primary px-3 py-1.5 text-xs"
                      >
                        Send new offer
                      </button>
                      <button onClick={() => setNegotiateOpenId(null)} className="btn-ghost px-3 py-1.5 text-xs">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => act(bid._id, 'accept-counter')} className="btn-primary px-3 py-1.5 text-xs">
                        Accept ₹{bid.counterPrice}
                      </button>
                      <button onClick={() => setNegotiateOpenId(bid._id)} className="btn-outline px-3 py-1.5 text-xs">
                        Counter back
                      </button>
                      <button onClick={() => act(bid._id, 'reject-counter')} className="btn-outline px-3 py-1.5 text-xs text-clay">
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Bid was rejected or expired — offer a quick way to try again with a fresh bid */}
              {(bid.status === 'rejected' || bid.status === 'expired') && bid.produce?._id && (
                <div className="mt-4 flex justify-end border-t border-furrow-100 pt-4">
                  <Link to={`/retailer/produce/${bid.produce._id}`} className="btn-outline py-1.5 text-xs">
                    Place a new bid
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
