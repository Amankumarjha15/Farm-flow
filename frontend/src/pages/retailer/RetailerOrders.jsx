import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import { EmptyState, ErrorState, Pagination, Skeleton } from '../../components/Feedback';

export function RetailerOrdersList() {
  const [state, setState] = useState({ loading: true, error: null, data: [], pagination: null });
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data } = await api.get(`/orders/my-orders?page=${page}&limit=10`);
      setState({ loading: false, error: null, data: data.data, pagination: data.pagination });
    } catch (err) {
      setState({ loading: false, error: err.response?.data?.message || 'Failed to load orders', data: [], pagination: null });
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h1 className="mb-6 text-2xl">My Orders</h1>
      {state.loading && <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>}
      {!state.loading && state.error && <ErrorState message={state.error} onRetry={load} />}
      {!state.loading && !state.error && state.data.length === 0 && <EmptyState title="No orders yet" description="Your placed orders will appear here." />}

      {!state.loading && !state.error && state.data.length > 0 && (
        <>
          <div className="space-y-3">
            {state.data.map((o) => (
              <Link key={o._id} to={`/retailer/orders/${o._id}`} className="card flex items-center justify-between p-4 hover:shadow-md">
                <div>
                  <p className="font-medium">{o.orderNumber}</p>
                  <p className="text-xs text-soil/40">{new Date(o.createdAt).toLocaleDateString()} · ₹{o.totalAmount.toLocaleString()}</p>
                </div>
                <StatusBadge status={o.status} />
              </Link>
            ))}
          </div>
          <Pagination page={state.pagination.page} pages={state.pagination.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

export function RetailerOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data.data));
  }, [id]);

  if (!order) return <Skeleton className="h-96" />;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl">{order.orderNumber}</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="card mb-6 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-soil/40">Items</h2>
        <ul className="divide-y divide-furrow-50">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between py-2 text-sm">
              <span>{item.cropName} × {item.quantity}</span>
              <span className="font-medium">₹{item.subtotal.toLocaleString()}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-furrow-100 pt-3 font-semibold">
          <span>Total</span>
          <span>₹{order.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {order.logisticsPartner && (
        <div className="card mb-6 p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-soil/40">Logistics Partner</h2>
          <p className="text-sm">{order.logisticsPartner.name} · {order.logisticsPartner.phone}</p>
        </div>
      )}

      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-soil/40">Shipment Timeline</h2>
        <ol className="space-y-4 border-l-2 border-furrow-100 pl-4">
          {order.timeline.map((event, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-furrow-700" />
              <p className="text-sm font-medium">{event.status.replace(/_/g, ' ')}</p>
              {event.currentLocation && <p className="text-xs text-soil/50">Near {event.currentLocation} · ETA {event.eta}</p>}
              {event.note && <p className="text-xs text-soil/50">{event.note}</p>}
              <p className="text-xs text-soil/30">{new Date(event.at).toLocaleString()}</p>
            </li>
          ))}
        </ol>
      </div>

      {order.status === 'delivered' && (
        <Link to={`/retailer/disputes/new?orderId=${order._id}`} className="btn-outline mt-6 inline-block text-clay">
          Raise a quality dispute
        </Link>
      )}
    </div>
  );
}
