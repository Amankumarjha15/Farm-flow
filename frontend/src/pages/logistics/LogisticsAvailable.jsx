import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { EmptyState, ErrorState, Skeleton } from '../../components/Feedback';

export default function LogisticsAvailable() {
  const [state, setState] = useState({ loading: true, error: null, data: [] });
  const [acceptingOrder, setAcceptingOrder] = useState(null);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data } = await api.get('/logistics/available');
      setState({ loading: false, error: null, data: data.data });
    } catch (err) {
      setState({ loading: false, error: err.response?.data?.message || 'Failed to load deliveries', data: [] });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onAccept = async (values) => {
    try {
      await api.patch(`/logistics/${acceptingOrder}/accept`, values);
      toast.success('Delivery assigned to you!');
      setAcceptingOrder(null);
      reset();
      load();
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Too late — another partner already accepted this delivery.');
        load();
      } else {
        toast.error(err.response?.data?.message || 'Failed to accept delivery');
      }
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl">Available Deliveries</h1>
      <p className="mb-6 text-sm text-soil/50">First to accept gets assigned — act fast.</p>

      {state.loading && <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>}
      {!state.loading && state.error && <ErrorState message={state.error} onRetry={load} />}
      {!state.loading && !state.error && state.data.length === 0 && <EmptyState title="No deliveries available right now" description="Check back soon — new orders appear here as soon as payment is confirmed." />}

      {!state.loading && !state.error && state.data.length > 0 && (
        <div className="space-y-4">
          {state.data.map((o) => (
            <div key={o._id} className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{o.orderNumber}</p>
                  <p className="text-xs text-soil/40">{o.retailer?.name} · ₹{o.totalAmount.toLocaleString()} · {o.items?.length} item(s)</p>
                  <p className="text-xs text-soil/40">Deliver to: {o.shippingAddress?.line1}, {o.shippingAddress?.city} {o.shippingAddress?.pincode}</p>
                </div>
                <button onClick={() => setAcceptingOrder(o._id)} className="btn-accent">Accept</button>
              </div>

              {acceptingOrder === o._id && (
                <form onSubmit={handleSubmit(onAccept)} className="mt-4 space-y-3 border-t border-furrow-100 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Expected delivery date</label>
                      <input type="date" className="input" {...register('expectedDeliveryDate', { required: true })} />
                    </div>
                    <div>
                      <label className="label">Expected time</label>
                      <input className="input" placeholder="e.g. 4:00 PM" {...register('expectedDeliveryTime', { required: true })} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Pickup message (optional)</label>
                    <input className="input" {...register('pickupMessage')} />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                      {isSubmitting ? 'Confirming…' : 'Confirm acceptance'}
                    </button>
                    <button type="button" onClick={() => setAcceptingOrder(null)} className="btn-outline">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
