import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { EmptyState, Skeleton } from '../../components/Feedback';

export default function AdminCategories() {
  const [categories, setCategories] = useState(null);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const load = useCallback(() => {
    api.get('/admin/categories').then(({ data }) => setCategories(data.data));
  }, []);
  useEffect(() => { load(); }, [load]);

  const onCreate = async (values) => {
    try {
      await api.post('/admin/categories', values);
      toast.success('Category created');
      reset();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    }
  };

  const toggleActive = async (cat) => {
    await api.put(`/admin/categories/${cat._id}`, { isActive: !cat.isActive });
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this category? Existing produce listings keep their category text either way.')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success('Category deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  if (!categories) return <Skeleton className="h-64" />;

  return (
    <div>
      <h1 className="mb-6 text-2xl">Categories</h1>

      <form onSubmit={handleSubmit(onCreate)} className="card mb-6 flex flex-wrap items-end gap-3 p-5">
        <div className="flex-1 min-w-[160px]">
          <label className="label">New category name</label>
          <input className="input" placeholder="e.g. Leafy Greens" {...register('name', { required: true })} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="label">Description (optional)</label>
          <input className="input" {...register('description')} />
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary">Add category</button>
      </form>

      {categories.length === 0 ? (
        <EmptyState title="No categories yet" description="Add your first category above — it'll appear as a filter option for retailers and a dropdown option for farmers." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-furrow-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-furrow-50 text-left text-xs uppercase tracking-wide text-soil/40">
              <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-furrow-50">
              {categories.map((c) => (
                <tr key={c._id}>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-soil/50">{c.description || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${c.isActive ? 'bg-furrow-100 text-furrow-800' : 'bg-clay/10 text-clay'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-3">
                    <button onClick={() => toggleActive(c)} className="text-xs font-semibold text-furrow-700 hover:underline">
                      {c.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => remove(c._id)} className="text-xs font-semibold text-clay hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
