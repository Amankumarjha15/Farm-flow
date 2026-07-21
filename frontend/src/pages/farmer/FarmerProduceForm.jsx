import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const FALLBACK_CATEGORIES = ['Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Dairy', 'Other'];
const UNITS = ['kg', 'quintal', 'ton', 'dozen', 'piece'];
const GRADES = ['A', 'B', 'C', 'Premium', 'Standard'];

export default function FarmerProduceForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);

  useEffect(() => {
    // Admin-managed categories take priority; fall back to sensible defaults if the admin
    // hasn't added any yet, so the form is never empty.
    api.get('/public/categories').then(({ data }) => {
      if (data.data.length > 0) setCategories(data.data.map((c) => c.name));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/produce/${id}`).then(({ data }) => {
      const p = data.data;
      reset({
        cropName: p.cropName,
        category: p.category,
        description: p.description,
        quantity: p.quantity,
        availableQuantity: p.availableQuantity,
        unit: p.unit,
        price: p.price,
        location: p.location,
        harvestDate: p.harvestDate?.slice(0, 10),
        isOrganic: p.isOrganic,
        qualityGrade: p.qualityGrade,
      });
      setLoading(false);
    });
  }, [id, isEdit, reset]);

  const onSubmit = async (values) => {
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, val]) => {
        if (val !== undefined && val !== '') formData.append(key, val);
      });
      images.forEach((file) => formData.append('images', file));

      if (isEdit) {
        await api.put(`/produce/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Listing updated');
      } else {
        await api.post('/produce', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Produce listed successfully');
      }
      navigate('/farmer/produce');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save listing');
    }
  };

  if (loading) return <div className="text-sm text-soil/50">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl">{isEdit ? 'Edit Produce' : 'Add Produce'}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Crop name</label>
            <input className="input" {...register('cropName', { required: true })} />
            {errors.cropName && <p className="mt-1 text-xs text-clay">Required</p>}
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" {...register('category', { required: true })}>
              <option value="">Select</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={3} {...register('description')} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Quantity</label>
            <input type="number" step="0.01" className="input" {...register('quantity', { required: true, min: 0.01 })} />
          </div>
          <div>
            <label className="label">Unit</label>
            <select className="input" {...register('unit')}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Price per unit (₹)</label>
            <input type="number" step="0.01" className="input" {...register('price', { required: true, min: 0.01 })} />
          </div>
        </div>

        {isEdit && (
          <div>
            <label className="label">Available quantity</label>
            <input type="number" step="0.01" className="input" {...register('availableQuantity', { min: 0 })} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Location</label>
            <input className="input" {...register('location', { required: true })} />
          </div>
          <div>
            <label className="label">Harvest date</label>
            <input type="date" className="input" {...register('harvestDate', { required: true })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Quality grade</label>
            <select className="input" {...register('qualityGrade')}>
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2 pb-2.5">
            <input type="checkbox" id="isOrganic" {...register('isOrganic')} />
            <label htmlFor="isOrganic" className="text-sm">Organically grown</label>
          </div>
        </div>

        <div>
          <label className="label">Images (up to 8)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files).slice(0, 8))}
            className="input"
          />
          {images.length > 0 && <p className="mt-1 text-xs text-soil/40">{images.length} file(s) selected</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'List produce'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-outline">Cancel</button>
        </div>
      </form>
    </div>
  );
}
