import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../utils/api';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { Skeleton } from '../../components/Feedback';

const PIE_COLORS = ['#396f45', '#d19f3d', '#4f849e', '#a8552f', '#7a8c99', '#16301f'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => setData(data.data));
  }, []);

  if (!data) {
    return <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  }

  const { totals, charts, latestOrders, latestUsers } = data;

  return (
    <div>
      <h1 className="mb-6 text-2xl">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Farmers" value={totals.farmers} />
        <StatCard label="Retailers" value={totals.retailers} />
        <StatCard label="Logistics Partners" value={totals.logisticsPartners} />
        <StatCard label="Total Orders" value={totals.orders} />
        <StatCard label="Revenue" value={`₹${totals.revenue.toLocaleString()}`} accent="wheat" />
        <StatCard label="Pending Payouts" value={`₹${totals.pendingPayouts.toLocaleString()}`} accent="overcast" />
        <StatCard label="Open Disputes" value={totals.openDisputes} accent="clay" />
        <StatCard label="Transactions" value={totals.transactions} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 text-lg">Revenue by Month</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4efe2" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#396f45" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 text-lg">Orders by Status</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={charts.ordersByStatus} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={90} label>
                {charts.ordersByStatus.map((entry, i) => <Cell key={entry._id} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 text-lg">Latest Orders</h2>
          <ul className="divide-y divide-furrow-50">
            {latestOrders.map((o) => (
              <li key={o._id} className="flex items-center justify-between py-2.5 text-sm">
                <span>{o.orderNumber} · {o.retailer?.name}</span>
                <StatusBadge status={o.status} />
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 text-lg">Latest Users</h2>
          <ul className="divide-y divide-furrow-50">
            {latestUsers.map((u) => (
              <li key={u._id} className="flex items-center justify-between py-2.5 text-sm">
                <span>{u.name}</span>
                <span className="badge bg-furrow-100 text-furrow-800">{u.role}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
