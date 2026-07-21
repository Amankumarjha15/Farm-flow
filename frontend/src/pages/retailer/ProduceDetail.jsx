import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import { addToCart } from '../../features/orders/cartSlice';
import { Skeleton } from '../../components/Feedback';

export default function ProduceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [produce, setProduce] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [showBidForm, setShowBidForm] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    api.get(`/produce/${id}`).then(({ data }) => setProduce(data.data));
  }, [id]);

  const onSubmitBid = async (values) => {
    try {
      await api.post('/bids', { produceId: id, quantity: Number(values.quantity), proposedPrice: Number(values.proposedPrice), message: values.message });
      toast.success('Bid submitted');
      reset();
      setShowBidForm(false);
      navigate('/retailer/bids');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit bid');
    }
  };

  const handleAddToCart = () => {
    dispatch(addToCart({
      produceId: produce._id, cropName: produce.cropName, image: produce.images?.[0]?.url,
      unit: produce.unit, price: produce.price, quantity: 1,
      availableQuantity: produce.availableQuantity, farmerName: produce.farmer?.name,
    }));
    toast.success('Added to cart');
  };

  if (!produce) {
    return <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <div className="h-96 overflow-hidden rounded-lg bg-furrow-100">
          {produce.images?.length ? (
            <img src={produce.images[activeImg]?.url} alt={produce.cropName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">🌾</div>
          )}
        </div>
        {produce.images?.length > 1 && (
          <div className="mt-3 flex gap-2">
            {produce.images.map((img, i) => (
              <button key={img.publicId} onClick={() => setActiveImg(i)} className={`h-16 w-16 overflow-hidden rounded-DEFAULT border-2 ${activeImg === i ? 'border-furrow-700' : 'border-transparent'}`}>
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold">{produce.cropName}</h1>
            <p className="mt-1 text-sm text-soil/50">{produce.category} · {produce.location} · Grade {produce.qualityGrade}</p>
          </div>
          <StatusBadge status={produce.status} />
        </div>

        <p className="mt-4 font-display text-3xl font-semibold text-wheat-600">
          ₹{produce.price}<span className="text-base font-body text-soil/40">/{produce.unit}</span>
        </p>
        <p className="mt-1 text-sm text-soil/50">{produce.availableQuantity} {produce.unit} available</p>

        {produce.description && <p className="mt-4 text-sm leading-relaxed text-soil/70">{produce.description}</p>}

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {produce.isOrganic && <span className="badge bg-furrow-100 text-furrow-800">Organic</span>}
          <span className="badge bg-overcast-100 text-overcast-600">Harvested {new Date(produce.harvestDate).toLocaleDateString()}</span>
        </div>

        <div className="mt-6 card p-4">
          <p className="text-sm font-semibold">Sold by</p>
          <p className="text-sm text-soil/60">{produce.farmer?.name} · {produce.farmer?.farmDetails?.farmName}</p>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={handleAddToCart} className="btn-primary flex-1">Add to cart</button>
          <button onClick={() => setShowBidForm((s) => !s)} className="btn-accent flex-1">Negotiate price</button>
        </div>

        {showBidForm && (
          <form onSubmit={handleSubmit(onSubmitBid)} className="mt-4 card space-y-3 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Quantity</label>
                <input type="number" step="0.01" className="input" {...register('quantity', { required: true, min: 1, max: produce.availableQuantity })} />
              </div>
              <div>
                <label className="label">Your offer (₹/{produce.unit})</label>
                <input type="number" step="0.01" className="input" {...register('proposedPrice', { required: true, min: 0.01 })} />
              </div>
            </div>
            <div>
              <label className="label">Message (optional)</label>
              <textarea className="input" rows={2} {...register('message')} />
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'Submitting…' : 'Submit bid'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
