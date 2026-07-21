import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import AuthLayout from '../../layouts/AuthLayout';
import { loginUser } from '../../features/auth/authSlice';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status } = useSelector((state) => state.auth);

  const onSubmit = async (values) => {
    const result = await dispatch(loginUser(values));
    if (loginUser.fulfilled.match(result)) {
      toast.success('Welcome back!');
      const role = result.payload.role;
      const redirectTo = location.state?.from?.pathname || `/${role}`;
      navigate(redirectTo, { replace: true });
    } else {
      toast.error(result.payload || 'Login failed');
    }
  };

  return (
    <AuthLayout title="Log in to Farm Flow" subtitle="Enter your credentials to access your dashboard.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            placeholder="you@example.com"
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email && <p className="mt-1 text-xs text-clay">{errors.email.message}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label">Password</label>
            <Link to="/forgot-password" className="text-xs text-furrow-700 hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            className="input"
            placeholder="••••••••"
            {...register('password', { required: 'Password is required' })}
          />
          {errors.password && <p className="mt-1 text-xs text-clay">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
          {status === 'loading' ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-soil/50">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-furrow-800 hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
