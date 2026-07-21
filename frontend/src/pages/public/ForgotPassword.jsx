import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import AuthLayout from '../../layouts/AuthLayout';
import { forgotPassword } from '../../features/auth/authSlice';

export default function ForgotPassword() {
  const { register, handleSubmit } = useForm();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();

  const onSubmit = async (values) => {
    setSubmitting(true);
    await dispatch(forgotPassword(values.email));
    setSubmitting(false);
    setSent(true);
  };

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a link to set a new password.">
      {sent ? (
        <div className="rounded-lg border border-furrow-100 bg-furrow-100/50 p-4 text-sm text-furrow-800">
          If an account exists for that email, a reset link is on its way. Check your inbox.
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="you@example.com" {...register('email', { required: true })} />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-soil/50">
        <Link to="/login" className="font-semibold text-furrow-800 hover:underline">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}
