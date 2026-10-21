import '../viora-auth.css';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BagLeafIcon } from '../components/BrandLogo';
import FormField from '../components/FormField';
import Button from '../components/Button';
import Alert from '../components/Alert';
import AddressForm from '../components/AddressForm';
import { useAuth } from '../hooks/useAuth';
import { accountService } from '../services/accountService';
import { getErrorMessage } from '../services/apiClient';
import type { Address, AddressInput } from '../types/auth';

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="border-t border-viora-sage/60 py-8 md:grid md:grid-cols-3 md:gap-8">
      <div className="mb-5 md:mb-0">
        <h2 className="text-lg font-semibold text-viora-ink">{title}</h2>
        <p className="mt-1 text-sm text-viora-muted">{description}</p>
      </div>
      <div className="md:col-span-2">{children}</div>
    </section>
  );
}

/* ---------- details ---------- */
function DetailsForm() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [status, setStatus] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (name.trim().length < 2) {
      setStatus({ type: 'error', text: 'Enter your name (at least 2 characters).' });
      return;
    }
    setSaving(true);
    try {
      setUser(await accountService.updateProfile(name.trim()));
      setStatus({ type: 'success', text: 'Details saved.' });
    } catch (err) {
      setStatus({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {status && <Alert type={status.type}>{status.text}</Alert>}
      <FormField label="Full name" name="profile_name" value={name} onChange={(e) => setName(e.target.value)} />
      <FormField label="Email" name="profile_email" value={user?.email ?? ''} disabled />
      <Button type="submit" loading={saving}>
        Save details
      </Button>
    </form>
  );
}

/* ---------- password ---------- */
function PasswordForm() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [status, setStatus] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (!form.current) return setStatus({ type: 'error', text: 'Enter your current password.' });
    if (form.next.length < 8 || !/[A-Za-z]/.test(form.next) || !/\d/.test(form.next))
      return setStatus({ type: 'error', text: 'New password needs 8+ characters with letters and numbers.' });
    if (form.next !== form.confirm) return setStatus({ type: 'error', text: 'New passwords do not match.' });

    setSaving(true);
    try {
      await accountService.changePassword(form.current, form.next);
      setForm({ current: '', next: '', confirm: '' });
      setStatus({ type: 'success', text: 'Password updated.' });
    } catch (err) {
      setStatus({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {status && <Alert type={status.type}>{status.text}</Alert>}
      <FormField label="Current password" name="current_password" type="password" autoComplete="current-password"
        value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} />
      <FormField label="New password" name="new_password" type="password" autoComplete="new-password"
        value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} />
      <FormField label="Confirm new password" name="confirm_password" type="password" autoComplete="new-password"
        value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
      <Button type="submit" loading={saving}>
        Update password
      </Button>
    </form>
  );
}

/* ---------- addresses ---------- */
const typeText = { both: 'Shipping & billing', shipping: 'Shipping', billing: 'Billing' } as const;

function AddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'list' | 'add' | number>('list'); // number = editing that id

  async function load() {
    setError('');
    try {
      setAddresses(await accountService.listAddresses());
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your addresses.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function run(action: () => Promise<unknown>) {
    setError('');
    try {
      await action();
      setMode('list');
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const save = (data: AddressInput) =>
    run(() => (typeof mode === 'number' ? accountService.updateAddress(mode, data) : accountService.createAddress(data)));

  if (loading) return <p role="status" className="text-sm text-viora-muted">Loading your addresses…</p>;

  if (mode !== 'list') {
    const editing = typeof mode === 'number' ? addresses.find((a) => a.id === mode) : undefined;
    return (
      <>
        {error && <Alert>{error}</Alert>}
        <AddressForm initial={editing} onSubmit={save} onCancel={() => setMode('list')} />
      </>
    );
  }

  return (
    <div>
      {error && <Alert>{error}</Alert>}

      {addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-viora-sage px-5 py-8 text-center">
          <p className="text-sm text-viora-muted">No saved addresses yet. Add one to check out faster.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {addresses.map((a) => (
            <li key={a.id} className={`rounded-xl border bg-white p-4 ${a.is_default ? 'border-viora-olive' : 'border-viora-sage'}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="text-sm text-viora-ink">
                  <p className="font-medium">
                    {a.full_name}
                    {a.is_default && (
                      <span className="ml-2 rounded-full bg-viora-olive px-2 py-0.5 text-xs font-medium text-white">Default</span>
                    )}
                  </p>
                  <p className="mt-1 text-viora-muted">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.postal_code}, {a.country}
                  </p>
                  <p className="mt-1 text-viora-muted">
                    {a.phone} · {typeText[a.address_type]}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" className="px-3 py-1.5" onClick={() => setMode(a.id)}>
                  Edit
                </Button>
                {!a.is_default && (
                  <Button variant="secondary" className="px-3 py-1.5" onClick={() => run(() => accountService.setDefaultAddress(a.id))}>
                    Make default
                  </Button>
                )}
                <Button
                  variant="danger"
                  className="px-3 py-1.5"
                  onClick={() => {
                    if (window.confirm('Delete this address?')) run(() => accountService.deleteAddress(a.id));
                  }}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button className="mt-4" onClick={() => setMode('add')}>
        Add address
      </Button>
    </div>
  );
}

/* ---------- page ---------- */
export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-viora-cream text-left font-body text-viora-ink">
      <header className="border-b border-viora-sage/60 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2 text-viora-olive" aria-label="VIORA home">
            <BagLeafIcon className="h-8 w-8 [--leaf-vein:#fff]" />
            <span className="font-display text-xl font-semibold tracking-[0.14em]">VIORA</span>
          </Link>
          <Button variant="secondary" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-16 pt-10">
        <h1 className="font-display text-4xl font-semibold text-viora-ink">Hi, {user?.name?.split(' ')[0]}</h1>
        <p className="mt-1 mb-8 text-sm text-viora-muted">Manage your details, password and delivery addresses.</p>

        <Section title="Your details" description="This name appears on your orders.">
          <DetailsForm />
        </Section>
        <Section title="Password" description="Enter your current password to set a new one.">
          <PasswordForm />
        </Section>
        <Section title="Addresses" description="Your default address is selected first at checkout.">
          <AddressBook />
        </Section>
      </main>
    </div>
  );
}
