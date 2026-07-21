import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import { EmptyState, Skeleton } from '../../components/Feedback';

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [note, setNote] = useState('');
  const [refundAmount, setRefundAmount] = useState('');

  const load = useCallback(() => {
    api.get('/disputes/admin').then(({ data }) => setDisputes(data.data));
  }, []);
  useEffect(() => { load(); }, [load]);

  const resolve = async (id, action) => {
    try {
      await api.patch(`/disputes/${id}/resolve`, {
        action,
        resolutionNote: note,
        ...(action === 'partial_refund' && { refundAmount: Number(refundAmount) }),
      });
      toast.success('Dispute resolved');
      setActiveId(null);
      setNote('');
      setRefundAmount('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve dispute');
    }
  };

  if (!disputes) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl">Disputes</h1>
      {disputes.length === 0 ? (
        <EmptyState title="No disputes to review" />
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <div key={d._id} className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{d.order?.orderNumber} · {d.retailer?.name}</p>
                  <p className="text-xs text-soil/40">vs {d.farmer?.name}</p>
                </div>
                <StatusBadge status={d.status} />
              </div>
              <p className="mt-2 text-sm text-soil/60">{d.complaint}</p>
              {d.images?.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {d.images.map((img) => <img key={img.publicId} src={img.url} alt="" className="h-16 w-16 rounded-DEFAULT object-cover" />)}
                </div>
              )}

              {(d.status === 'open' || d.status === 'under_review') && (
                activeId === d._id ? (
                  <div className="mt-4 space-y-3 border-t border-furrow-100 pt-4">
                    <textarea className="input" rows={2} placeholder="Resolution note" value={note} onChange={(e) => setNote(e.target.value)} />
                    <input type="number" className="input" placeholder="Partial refund amount (if applicable)" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => resolve(d._id, 'refund')} className="btn-primary text-xs">Full Refund</button>
                      <button onClick={() => resolve(d._id, 'partial_refund')} className="btn-outline text-xs">Partial Refund</button>
                      <button onClick={() => resolve(d._id, 'replacement')} className="btn-outline text-xs">Replacement</button>
                      <button onClick={() => resolve(d._id, 'reject')} className="btn-outline text-xs text-clay">Reject</button>
                      <button onClick={() => setActiveId(null)} className="btn-ghost text-xs">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setActiveId(d._id)} className="btn-outline mt-3 text-xs">Review & Resolve</button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
