import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import { EmptyState, Skeleton } from '../../components/Feedback';

export function RetailerDisputesList() {
  const [disputes, setDisputes] = useState(null);

  useEffect(() => {
    api.get('/disputes/my-disputes').then(({ data }) => setDisputes(data.data));
  }, []);

  if (!disputes) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl">Disputes</h1>
      {disputes.length === 0 ? (
        <EmptyState title="No disputes raised" description="Quality issues with a delivered order can be reported from the order detail page." />
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <div key={d._id} className="card p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{d.order?.orderNumber}</p>
                <StatusBadge status={d.status} />
              </div>
              <p className="mt-1 text-sm text-soil/50">{d.complaint}</p>
              {d.resolutionNote && <p className="mt-2 text-xs italic text-soil/40">Admin note: {d.resolutionNote}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RaiseDispute() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm();
  const [images, setImages] = useState([]);
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('complaint', values.complaint);
      images.forEach((f) => formData.append('images', f));
      await api.post('/disputes', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Dispute submitted for admin review');
      navigate('/retailer/disputes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit dispute');
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl">Raise a Dispute</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6">
        <div>
          <label className="label">What went wrong?</label>
          <textarea className="input" rows={4} {...register('complaint', { required: 'Please describe the issue' })} />
          {errors.complaint && <p className="mt-1 text-xs text-clay">{errors.complaint.message}</p>}
        </div>
        <div>
          <label className="label">Photos (optional)</label>
          <input type="file" accept="image/*" multiple className="input" onChange={(e) => setImages(Array.from(e.target.files).slice(0, 5))} />
        </div>
        <button type="submit" disabled={isSubmitting || !orderId} className="btn-primary w-full">
          {isSubmitting ? 'Submitting…' : 'Submit dispute'}
        </button>
        {!orderId && <p className="text-xs text-clay">No order selected — please raise this from an order's detail page.</p>}
      </form>
    </div>
  );
}
