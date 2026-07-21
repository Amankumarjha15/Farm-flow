import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { EmptyState, Pagination, Skeleton } from '../../components/Feedback';

export default function AdminUserManagement({ role, title }) {
  const [state, setState] = useState({ loading: true, data: [], pagination: null });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const { data } = await api.get(`/admin/users?role=${role}&page=${page}&limit=15${search ? `&search=${search}` : ''}`);
    setState({ loading: false, data: data.data, pagination: data.pagination });
  }, [role, page, search]);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (id) => {
    await api.patch(`/admin/users/${id}/toggle-active`);
    toast.success('Status updated');
    load();
  };

  const verify = async (id) => {
    await api.patch(`/admin/users/${id}/verify`);
    toast.success('User verified');
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this user?')) return;
    await api.delete(`/admin/users/${id}`);
    toast.success('User removed');
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl">{title}</h1>
        <input className="input max-w-xs" placeholder="Search name or email…" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
      </div>

      {state.loading && <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>}

      {!state.loading && state.data.length === 0 && <EmptyState title={`No ${title.toLowerCase()} found`} />}

      {!state.loading && state.data.length > 0 && (
        <>
          <div className="overflow-hidden rounded-lg border border-furrow-100 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-furrow-50 text-left text-xs uppercase tracking-wide text-soil/40">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  {role === 'logistics' && <th className="px-4 py-3">Verified</th>}
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-furrow-50">
                {state.data.map((u) => (
                  <tr key={u._id}>
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-soil/60">{u.email}</td>
                    {role === 'logistics' && (
                      <td className="px-4 py-3">
                        <span className={`badge ${u.isVerified ? 'bg-furrow-100 text-furrow-800' : 'bg-wheat-100 text-wheat-600'}`}>
                          {u.isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span className={`badge ${u.isActive ? 'bg-furrow-100 text-furrow-800' : 'bg-clay/10 text-clay'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      {role === 'logistics' && !u.isVerified && (
                        <button onClick={() => verify(u._id)} className="text-xs font-semibold text-overcast-600 hover:underline">Verify</button>
                      )}
                      <button onClick={() => toggleActive(u._id)} className="text-xs font-semibold text-furrow-700 hover:underline">
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => remove(u._id)} className="text-xs font-semibold text-clay hover:underline">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={state.pagination.page} pages={state.pagination.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
