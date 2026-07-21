import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import { EmptyState, Skeleton } from '../../components/Feedback';

const NEXT_STATUS = {
  accepted_by_logistics: 'ready_to_ship',
  ready_to_ship: 'shipped',
  shipped: 'on_the_way',
  on_the_way: 'delivered',
};
const NEXT_LABEL = {
  ready_to_ship: 'Mark Ready to Ship',
  shipped: 'Mark Shipped',
  on_the_way: 'Mark On The Way',
  delivered: 'Mark Delivered',
};

export default function LogisticsAssigned() {
  const [orders, setOrders] = useState(null);
  const [updatingId, setUpdatingId] = useState(null); // for the one-time status transition form
  const [locationUpdateId, setLocationUpdateId] = useState(null); // for repeatable on-the-way updates
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const locationForm = useForm();

  const load = useCallback(() => {
    api.get('/logistics/assigned').then(({ data }) => setOrders(data.data));
  }, []);
  useEffect(() => { load(); }, [load]);

  const submitStatus = async (order, values = {}) => {
    const nextStatus = NEXT_STATUS[order.status];
    try {
      await api.patch(`/logistics/${order._id}/status`, { status: nextStatus, ...values });
      toast.success(`Marked as ${nextStatus.replace(/_/g, ' ')}`);
      setUpdatingId(null);
      reset();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const submitLocationUpdate = async (orderId, values) => {
    try {
      await api.patch(`/logistics/${orderId}/location`, values);
      toast.success('Location update sent to the retailer');
      locationForm.reset();
      // Deliberately leave locationUpdateId set and the form open — a driver en route will
      // likely want to send another update again shortly; closing it after every single
      // submission would force them to re-open it each time.
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send location update');
    }
  };

  if (!orders) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl">Assigned Deliveries</h1>
      {orders.length === 0 ? (
        <EmptyState title="No active deliveries" description="Accept a delivery from the Available tab to see it here." />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const nextStatus = NEXT_STATUS[o.status];
            const latestUpdate = [...o.timeline].reverse().find((t) => t.status === 'on_the_way' && t.currentLocation);

            return (
              <div key={o._id} className="card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{o.orderNumber}</p>
                    <p className="text-xs text-soil/40">{o.shippingAddress?.line1}, {o.shippingAddress?.city} {o.shippingAddress?.pincode}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>

                {o.status === 'on_the_way' && latestUpdate && (
                  <p className="mt-2 text-xs text-overcast-600">
                    Last update: near {latestUpdate.currentLocation} · ETA {latestUpdate.eta}
                  </p>
                )}

                {/* One-time forward status transition (ready_to_ship → shipped → on_the_way → delivered) */}
                {nextStatus && updatingId !== o._id && (
                  <button onClick={() => setUpdatingId(o._id)} className="btn-primary mt-3 mr-2 text-xs">
                    {NEXT_LABEL[nextStatus]}
                  </button>
                )}

                {/* While already On The Way, offer repeatable location updates as many times as needed */}
                {o.status === 'on_the_way' && (
                  <button
                    onClick={() => setLocationUpdateId(locationUpdateId === o._id ? null : o._id)}
                    className="btn-outline mt-3 text-xs"
                  >
                    {locationUpdateId === o._id ? 'Hide location update' : '📍 Send location update'}
                  </button>
                )}

                {updatingId === o._id && nextStatus === 'on_the_way' && (
                  <form
                    onSubmit={handleSubmit((values) => submitStatus(o, values))}
                    className="mt-4 space-y-3 border-t border-furrow-100 pt-4"
                  >
                    <p className="text-xs text-soil/40">Starting location for this leg of the trip:</p>
                    <div className="grid grid-cols-2 gap-3">
                      <input className="input" placeholder="Current location" {...register('currentLocation', { required: true })} />
                      <input className="input" placeholder="ETA (e.g. 10 hours)" {...register('eta', { required: true })} />
                    </div>
                    <input className="input" placeholder="Message (optional)" {...register('message')} />
                    <div className="flex gap-2">
                      <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 text-xs">Confirm</button>
                      <button type="button" onClick={() => setUpdatingId(null)} className="btn-outline text-xs">Cancel</button>
                    </div>
                  </form>
                )}

                {updatingId === o._id && nextStatus !== 'on_the_way' && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => submitStatus(o)} className="btn-primary text-xs">Confirm {NEXT_LABEL[nextStatus]}</button>
                    <button onClick={() => setUpdatingId(null)} className="btn-outline text-xs">Cancel</button>
                  </div>
                )}

                {/* Repeatable location update form — can be submitted over and over while still On The Way */}
                {locationUpdateId === o._id && (
                  <form
                    onSubmit={locationForm.handleSubmit((values) => submitLocationUpdate(o._id, values))}
                    className="mt-4 space-y-3 border-t border-furrow-100 pt-4"
                  >
                    <p className="text-xs text-soil/40">Push a fresh update — send this as many times as you like while en route.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <input className="input" placeholder="Current location" {...locationForm.register('currentLocation', { required: true })} />
                      <input className="input" placeholder="ETA (e.g. 4 hours)" {...locationForm.register('eta', { required: true })} />
                    </div>
                    <input className="input" placeholder="Message (optional)" {...locationForm.register('message')} />
                    <button type="submit" disabled={locationForm.formState.isSubmitting} className="btn-accent text-xs">
                      {locationForm.formState.isSubmitting ? 'Sending…' : 'Send update'}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
