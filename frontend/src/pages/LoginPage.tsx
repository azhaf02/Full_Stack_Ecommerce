import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import FormField from '../components/FormField';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../services/apiClient';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string; registered?: boolean; email?: string } | null;
  const redirectTo = state?.from ?? '/';
  const justRegistered = Boolean(state?.registered);

  const [email, setEmail] = useState(state?.email ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not log in. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your account.">
      <form onSubmit={handleSubmit} noValidate>
        {justRegistered && !error && <Alert type="success">Account created successfully. Please log in.</Alert>}
        {error && <Alert>{error}</Alert>}
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" loading={submitting} className="mt-2 w-full py-3.5 text-base">
          Log in
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-viora-muted">
        New here?{' '}
        <Link to="/register" className="font-semibold text-viora-olive underline decoration-viora-olive/40 underline-offset-4 hover:decoration-viora-olive">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
