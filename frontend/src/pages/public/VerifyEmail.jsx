import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    api
      .get(`/auth/verify-email/${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-furrow-50 px-6 text-center">
      <span className="text-4xl">{status === 'success' ? '✅' : status === 'error' ? '⚠️' : '🌱'}</span>
      <h1 className="mt-4 font-display text-2xl font-semibold">
        {status === 'loading' && 'Verifying your email…'}
        {status === 'success' && 'Email verified!'}
        {status === 'error' && 'Verification link invalid or expired'}
      </h1>
      <p className="mt-2 text-sm text-soil/50">
        {status === 'success' && 'You can now log in to your Farm Flow account.'}
        {status === 'error' && 'Please request a new verification link or contact support.'}
      </p>
      <Link to="/login" className="btn-primary mt-6">
        Go to login
      </Link>
    </div>
  );
}
