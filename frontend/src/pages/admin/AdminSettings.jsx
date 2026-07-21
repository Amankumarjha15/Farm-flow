import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { Skeleton } from '../../components/Feedback';

export default function AdminSettings() {
  const { register, handleSubmit, reset, watch, formState: { isSubmitting, isLoading } } = useForm();
  const maintenanceMode = watch('maintenanceMode');

  useEffect(() => {
    api.get('/admin/settings').then(({ data }) => reset(data.data));
  }, [reset]);

  const onSubmit = async (values) => {
    try {
      const { data } = await api.put('/admin/settings', values);
      reset(data.data);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl">Platform Settings</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6 p-6">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-soil/40">Commerce</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Platform commission (%)</label>
              <input type="number" step="0.1" min="0" max="100" className="input" {...register('platformCommissionPercent')} />
            </div>
            <div>
              <label className="label">Minimum order amount (₹)</label>
              <input type="number" step="1" min="0" className="input" {...register('minimumOrderAmount')} />
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-soil/40">Support Contact</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Support email</label>
              <input type="email" className="input" {...register('supportEmail')} />
            </div>
            <div>
              <label className="label">Support phone</label>
              <input className="input" {...register('supportPhone')} />
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-soil/40">Access Control</h2>
          <label className="mb-3 flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('allowNewRegistrations')} />
            Allow new user registrations
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('maintenanceMode')} />
            Enable maintenance mode
          </label>
          {maintenanceMode && (
            <div className="mt-3">
              <label className="label">Maintenance banner message</label>
              <textarea className="input" rows={2} {...register('maintenanceMessage')} />
            </div>
          )}
        </div>

        <button type="submit" disabled={isSubmitting || isLoading} className="btn-primary">
          {isSubmitting ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}
