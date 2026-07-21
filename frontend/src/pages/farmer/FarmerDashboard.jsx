import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { EmptyState, Skeleton } from '../../components/Feedback';

export default function FarmerDashboard() {
  const [loading, setLoading] = useState(true);
  const [produce, setProduce] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payouts, setPayouts] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [produceRes, ordersRes, payoutsRes] = await Promise.all([
          api.get('/produce/my-listings?limit=5'),
          api.get('/orders/farmer-orders?limit=5'),
          api.get('/payouts/my-payouts'),
        ]);
        setProduce(produceRes.data.data);
        setOrders(ordersRes.data.data);
        setPayouts(payoutsRes.data.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl">Farmer Dashboard</h1>
        <Link to="/farmer/produce/new" className="btn-accent">+ Add Produce</Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Active Listings" value={produce.filter((p) => p.status !== 'inactive').length} />
          <StatCard label="Pending Payout" value={`₹${(payouts?.pendingAmount || 0).toLocaleString()}`} accent="wheat" />
          <StatCard label="Eligible Payout" value={`₹${(payouts?.eligibleAmount || 0).toLocaleString()}`} accent="overcast" />
          <StatCard label="Total Earnings" value={`₹${(payouts?.totalEarnings || 0).toLocaleString()}`} accent="furrow" />
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg">Recent Listings</h2>
            <Link to="/farmer/produce" className="text-xs font-semibold text-furrow-700 hover:underline">View all</Link>
          </div>
          {produce.length === 0 ? (
            <EmptyState title="No produce listed yet" description="Add your first listing to start receiving orders." />
          ) : (
            <ul className="divide-y divide-furrow-50">
              {produce.map((p) => (
                <li key={p._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{p.cropName}</p>
                    <p className="text-xs text-soil/40">{p.availableQuantity} {p.unit} available</p>
                  </div>
                  <StatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg">Recent Orders</h2>
            <Link to="/farmer/orders" className="text-xs font-semibold text-furrow-700 hover:underline">View all</Link>
          </div>
          {orders.length === 0 ? (
            <EmptyState title="No orders yet" description="Orders for your produce will appear here." />
          ) : (
            <ul className="divide-y divide-furrow-50">
              {orders.map((o) => (
                <li key={o._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{o.orderNumber}</p>
                    <p className="text-xs text-soil/40">₹{o.totalAmount.toLocaleString()}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
