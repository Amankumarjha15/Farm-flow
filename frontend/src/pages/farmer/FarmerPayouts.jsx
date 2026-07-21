import { useEffect, useState } from 'react';
import api from '../../utils/api';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { EmptyState, Skeleton } from '../../components/Feedback';

export default function FarmerPayouts() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/payouts/my-payouts').then(({ data }) => setData(data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl">Payouts</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={`₹${(data?.pendingAmount || 0).toLocaleString()}`} accent="wheat" sublabel="Awaiting delivery confirmation" />
        <StatCard label="Eligible" value={`₹${(data?.eligibleAmount || 0).toLocaleString()}`} accent="overcast" sublabel="Ready for processing" />
        <StatCard label="Total Earned" value={`₹${(data?.totalEarnings || 0).toLocaleString()}`} accent="furrow" sublabel="Completed payouts" />
      </div>

      <h2 className="mb-3 mt-8 text-lg">Transaction History</h2>
      {data?.transactions?.length === 0 ? (
        <EmptyState title="No payout transactions yet" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-furrow-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-furrow-50 text-left text-xs uppercase tracking-wide text-soil/40">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-furrow-50">
              {data?.transactions?.map((t) => (
                <tr key={t._id}>
                  <td className="px-4 py-3 font-medium">{t.order?.orderNumber}</td>
                  <td className="px-4 py-3">₹{t.amount.toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-soil/40">{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
