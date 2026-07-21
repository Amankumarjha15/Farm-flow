import { useForm } from 'react-hook-form';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import AuthLayout from '../../layouts/AuthLayout';
import { resetPassword } from '../../features/auth/authSlice';

export default function ResetPassword() {
  const { token } = useParams();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const password = watch('password');

  const onSubmit = async (values) => {
    const result = await dispatch(resetPassword({ token, password: values.password }));
    if (resetPassword.fulfilled.match(result)) {
      toast.success('Password reset. Please log in.');
      navigate('/login');
    } else {
      toast.error(result.payload || 'Reset failed. The link may have expired.');
    }
  };

  return (
    <AuthLayout title="Set a new password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">New password</label>
          <input
            type="password"
            className="input"
            {...register('password', { required: 'Required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
          />
          {errors.password && <p className="mt-1 text-xs text-clay">{errors.password.message}</p>}
        </div>
        <div>
          <label className="label">Confirm password</label>
          <input
            type="password"
            className="input"
            {...register('confirm', { validate: (v) => v === password || 'Passwords do not match' })}
          />
          {errors.confirm && <p className="mt-1 text-xs text-clay">{errors.confirm.message}</p>}
        </div>
        <button type="submit" className="btn-primary w-full">Reset password</button>
      </form>
      <p className="mt-6 text-center text-sm text-soil/50">
        <Link to="/login" className="font-semibold text-furrow-800 hover:underline">Back to login</Link>
      </p>
    </AuthLayout>
  );
}
