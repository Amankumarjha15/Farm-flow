import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { fetchMe } from '../features/auth/authSlice';

export default function Profile() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      name: user?.name,
      phone: user?.phone,
      'address.line1': user?.address?.line1,
      'address.city': user?.address?.city,
      'address.state': user?.address?.state,
      'address.pincode': user?.address?.pincode,
      'farmDetails.farmName': user?.farmDetails?.farmName,
      'farmDetails.farmSize': user?.farmDetails?.farmSize,
      'farmDetails.farmLocation': user?.farmDetails?.farmLocation,
      'vehicleDetails.vehicleType': user?.vehicleDetails?.vehicleType,
      'vehicleDetails.vehicleNumber': user?.vehicleDetails?.vehicleNumber,
      'vehicleDetails.capacity': user?.vehicleDetails?.capacity,
    },
  });
  const [uploading, setUploading] = useState(false);

  const onSubmit = async (values) => {
    const payload = {
      name: values.name,
      phone: values.phone,
      address: {
        line1: values['address.line1'],
        city: values['address.city'],
        state: values['address.state'],
        pincode: values['address.pincode'],
      },
    };
    if (user.role === 'farmer') {
      payload.farmDetails = {
        farmName: values['farmDetails.farmName'],
        farmSize: values['farmDetails.farmSize'],
        farmLocation: values['farmDetails.farmLocation'],
      };
    }
    if (user.role === 'logistics') {
      payload.vehicleDetails = {
        vehicleType: values['vehicleDetails.vehicleType'],
        vehicleNumber: values['vehicleDetails.vehicleNumber'],
        capacity: values['vehicleDetails.capacity'],
      };
    }

    try {
      await api.put('/users/profile', payload);
      await dispatch(fetchMe());
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await api.post('/users/profile/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await dispatch(fetchMe());
      toast.success('Photo updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl">Profile</h1>

      <div className="card mb-6 flex items-center gap-4 p-5">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-wheat-400 font-display text-xl font-semibold text-soil">
          {user?.avatar?.url ? <img src={user.avatar.url} alt="" className="h-full w-full object-cover" /> : user?.name?.[0]}
        </div>
        <div>
          <label className="btn-outline cursor-pointer py-1.5 text-xs">
            {uploading ? 'Uploading…' : 'Change photo'}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploading} />
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" {...register('name')} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" {...register('phone')} />
          </div>
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input bg-furrow-50" value={user?.email} disabled />
        </div>

        <h3 className="pt-2 text-sm font-semibold">Address</h3>
        <div className="grid grid-cols-2 gap-4">
          <input className="input" placeholder="Address line" {...register('address.line1')} />
          <input className="input" placeholder="City" {...register('address.city')} />
          <input className="input" placeholder="State" {...register('address.state')} />
          <input className="input" placeholder="Pincode" {...register('address.pincode')} />
        </div>

        {user?.role === 'farmer' && (
          <>
            <h3 className="pt-2 text-sm font-semibold">Farm details</h3>
            <div className="grid grid-cols-2 gap-4">
              <input className="input" placeholder="Farm name" {...register('farmDetails.farmName')} />
              <input className="input" placeholder="Farm size" {...register('farmDetails.farmSize')} />
              <input className="input col-span-2" placeholder="Farm location" {...register('farmDetails.farmLocation')} />
            </div>
          </>
        )}

        {user?.role === 'logistics' && (
          <>
            <h3 className="pt-2 text-sm font-semibold">Vehicle details</h3>
            <div className="grid grid-cols-2 gap-4">
              <input className="input" placeholder="Vehicle type" {...register('vehicleDetails.vehicleType')} />
              <input className="input" placeholder="Vehicle number" {...register('vehicleDetails.vehicleNumber')} />
              <input className="input" placeholder="Capacity" {...register('vehicleDetails.capacity')} />
            </div>
          </>
        )}

        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
