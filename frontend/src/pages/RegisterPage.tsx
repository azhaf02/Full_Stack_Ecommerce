import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import FormField from '../components/FormField';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../services/apiClient';

type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm', string>>;

// Same rules as the backend (schemas/auth.py)
function validate(name: string, email: string, password: string, confirm: string): Errors {
  const errors: Errors = {};
  if (name.trim().length < 2) errors.name = 'Enter your name (at least 2 characters).';
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = 'Enter a valid email address.';
  if (password.length < 8) errors.password = 'Use at least 8 characters.';
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.password = 'Use both letters and numbers.';
  if (confirm !== password) errors.confirm = 'Passwords do not match.';
  return errors;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError('');
    const found = validate(form.name, form.email, form.password, form.confirm);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      // AUTH-03: send the new customer to Login with a success message
      navigate('/login', { replace: true, state: { registered: true, email: form.email.trim() } });
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not create your account. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="It takes less than a minute.">
      <form onSubmit={handleSubmit} noValidate>
        {serverError && <Alert>{serverError}</Alert>}
        <FormField label="Full name" name="name" autoComplete="name" placeholder="Your name" value={form.name} onChange={update('name')} error={errors.name} />
        <FormField label="Email" name="email" type="email" autoComplete="email" placeholder="name@example.com" value={form.email} onChange={update('email')} error={errors.email} />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={update('password')}
          error={errors.password}
          hint="At least 8 characters, with letters and numbers."
        />
        <FormField
          label="Confirm password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={update('confirm')}
          error={errors.confirm}
        />
        <Button type="submit" loading={submitting} className="mt-2 w-full py-3.5 text-base">
          Create account
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-viora-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-viora-olive underline decoration-viora-olive/40 underline-offset-4 hover:decoration-viora-olive">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
