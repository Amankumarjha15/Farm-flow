import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import AuthLayout from '../../layouts/AuthLayout';
import { registerUser } from '../../features/auth/authSlice';

const ROLES = [
  { value: 'farmer', label: 'Farmer', icon: '🌾' },
  { value: 'retailer', label: 'Retailer', icon: '🏪' },
  { value: 'logistics', label: 'Logistics Partner', icon: '🚚' },
];

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ defaultValues: { role: 'retailer' } });
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedRole = watch('role');

  const onSubmit = async (values) => {
    setSubmitting(true);
    const result = await dispatch(registerUser(values));
    setSubmitting(false);
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created! Check your email to verify.');
      navigate('/login');
    } else {
      toast.error(result.payload || 'Registration failed');
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Join Farm Flow as a farmer, retailer, or logistics partner.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">I am a</label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-DEFAULT border px-2 py-3 text-xs font-medium transition-colors ${
                  selectedRole === r.value
                    ? 'border-furrow-700 bg-furrow-100 text-furrow-800'
                    : 'border-furrow-100 text-soil/50 hover:border-furrow-300'
                }`}
              >
                <input type="radio" value={r.value} className="hidden" {...register('role')} />
                <span className="text-lg">{r.icon}</span>
                {r.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Full name</label>
          <input className="input" placeholder="Jane Doe" {...register('name', { required: 'Name is required' })} />
          {errors.name && <p className="mt-1 text-xs text-clay">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label">Email</label>
          <input type="email" className="input" placeholder="you@example.com" {...register('email', { required: 'Email is required' })} />
          {errors.email && <p className="mt-1 text-xs text-clay">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Phone</label>
          <input className="input" placeholder="+91 98765 43210" {...register('phone')} />
        </div>

        <div>
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            placeholder="At least 8 characters, 1 number"
            {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
          />
          {errors.password && <p className="mt-1 text-xs text-clay">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-soil/50">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-furrow-800 hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
